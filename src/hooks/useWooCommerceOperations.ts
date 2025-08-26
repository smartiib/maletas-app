
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useOrganization } from '@/contexts/OrganizationContext';

interface SyncRequest {
  sync_type: 'products' | 'categories' | 'orders' | 'customers' | 'full';
  config: {
    url: string;
    consumer_key: string;
    consumer_secret: string;
  };
  batch_size?: number;
  max_pages?: number;
  page?: number;
  force_full_sync?: boolean;
  organization_id: string;
  product_ids?: number[]; // Novo: para sync específico
}

interface SyncResponse {
  success: boolean;
  message: string;
  processed: number;
  errors: number;
  currentPage?: number;
  nextPage?: number | null;
  hasMore?: boolean;
  sync_type: string;
  timeElapsed?: number;
}

export const useWooCommerceOperations = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const {
    progressState,
    startSync,
    updateProgress,
    completeSync,
    closeProgress,
    resetProgress
  } = useSyncProgress();

  // IMPROVED: Progressive sync with smaller, safer batches
  const performProgressiveSync = async (
    params: {
      syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: { url: string; consumer_key: string; consumer_secret: string; };
      batchSize?: number;
      productIds?: number[];
    },
    page: number = 1,
    totalProcessed: number = 0,
    totalErrors: number = 0,
    iteration: number = 1
  ): Promise<{ processed: number; errors: number }> => {
    
    const requestBody: SyncRequest = {
      sync_type: params.syncType,
      config: params.config,
      batch_size: params.batchSize || 25, // REDUCED from 50
      max_pages: 1, // ALWAYS 1 page per request to prevent timeout
      page,
      organization_id: currentOrganization!.id,
      product_ids: params.productIds
    };

    console.log(`[Progressive Sync] Iteração ${iteration}, Página ${page}, processados até agora: ${totalProcessed}`);

    // Update progress before each call
    updateProgress({
      progress: Math.min(20 + (iteration * 10), 90), // Progressive increase
      currentStep: `Processando lote ${iteration} (página ${page})...`,
      itemsProcessed: totalProcessed,
    });

    const { data, error } = await supabase.functions.invoke('wc-sync', {
      body: requestBody
    });

    if (error) {
      throw new Error(error.message || 'Erro na sincronização');
    }

    const response = data as SyncResponse;
    
    if (!response.success) {
      throw new Error(response.message || 'Erro na sincronização');
    }

    const newTotalProcessed = totalProcessed + response.processed;
    const newTotalErrors = totalErrors + response.errors;

    console.log(`[Progressive Sync] Lote ${iteration} concluído:`, {
      processed: response.processed,
      errors: response.errors,
      totalProcessed: newTotalProcessed,
      hasMore: response.hasMore,
      nextPage: response.nextPage,
      timeElapsed: response.timeElapsed
    });

    // Update progress after processing
    updateProgress({
      itemsProcessed: newTotalProcessed,
      currentStep: `Lote ${iteration} concluído - ${response.processed} itens processados`,
      progress: response.hasMore ? Math.min(30 + (iteration * 15), 85) : 95
    });

    // If there's more data, continue with next page
    if (response.nextPage && response.hasMore) {
      // Small delay between requests to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return await performProgressiveSync(
        params,
        response.nextPage,
        newTotalProcessed,
        newTotalErrors,
        iteration + 1
      );
    }

    return { processed: newTotalProcessed, errors: newTotalErrors };
  };

  const syncData = useMutation({
    mutationFn: async ({ 
      syncType, 
      config, 
      batchSize = 25, // REDUCED from 50
      productIds
    }: {
      syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: { url: string; consumer_key: string; consumer_secret: string; };
      batchSize?: number;
      productIds?: number[];
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      console.log('Iniciando sincronização progressiva:', { syncType, organizationId: currentOrganization.id, productIds });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Execute progressive sync with safer parameters
      const result = await performProgressiveSync({
        syncType,
        config,
        batchSize,
        productIds
      });

      return result;
    },
    onMutate: ({ syncType, productIds }) => {
      const syncLabel = productIds ? `produtos específicos (${productIds.length})` : syncType;
      startSync(syncLabel);
      console.log('Sincronização iniciada:', syncLabel);
    },
    onSuccess: (data, { syncType, productIds }) => {
      console.log('Sincronização concluída:', data);
      completeSync(data.errors === 0, data.errors > 0 ? `${data.errors} erros encontrados` : undefined);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['woocommerce-products', currentOrganization?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['wc-products-filtered', currentOrganization?.id] 
      });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'wc-variations' || q.queryKey[0] === 'wc-variations-by-ids'),
      });
      
      const message = productIds 
        ? `${data.processed} produtos específicos sincronizados!`
        : `${syncType} sincronizado! ${data.processed} itens processados`;
      
      toast.success(message);
    },
    onError: (error: any, { syncType, productIds }) => {
      console.error('Erro na sincronização:', error);
      completeSync(false, error.message);
      
      const syncLabel = productIds ? 'produtos específicos' : syncType;
      toast.error(`Erro na sincronização de ${syncLabel}: ${error.message}`);
    }
  });

  return {
    syncData,
    progressState,
    updateProgress,
    closeProgress,
    resetProgress
  };
};

// Novo hook para sincronização de produtos específicos
export const useSpecificProductSync = () => {
  const { syncData } = useWooCommerceOperations();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (productIds: number[]) => {
      if (!currentOrganization) {
        throw new Error('Organização não encontrada');
      }

      // Buscar configuração do WooCommerce da organização
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganization.id)
        .single();

      if (error || !orgData?.settings) {
        throw new Error('Configuração do WooCommerce não encontrada');
      }

      const settings = orgData.settings as any;
      const config = {
        url: settings.woocommerce_url,
        consumer_key: settings.woocommerce_consumer_key,
        consumer_secret: settings.woocommerce_consumer_secret
      };

      if (!config.url || !config.consumer_key || !config.consumer_secret) {
        throw new Error('Configuração do WooCommerce incompleta');
      }

      return syncData.mutateAsync({
        syncType: 'products',
        config,
        productIds
      });
    }
  });
};
