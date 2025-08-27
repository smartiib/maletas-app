

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
  totalFound?: number;
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

  // IMPROVED: Progressive sync with better error handling and more aggressive pagination
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
    totalFound: number = 0,
    iteration: number = 1
  ): Promise<{ processed: number; errors: number; totalFound: number }> => {
    
    const requestBody: SyncRequest = {
      sync_type: params.syncType,
      config: params.config,
      batch_size: params.batchSize || 50, // Mantido em 50 para equilibrar velocidade e confiabilidade
      max_pages: 3, // Reduzido para evitar timeouts, mas ainda processar mais produtos
      page,
      organization_id: currentOrganization!.id,
      product_ids: params.productIds
    };

    console.log(`[Progressive Sync] Iteração ${iteration}, Página ${page}, processados: ${totalProcessed}, encontrados: ${totalFound}`);

    // Update progress before each call
    const progressPercentage = Math.min(10 + (iteration * 8), 85);
    updateProgress({
      progress: progressPercentage,
      currentStep: `Processando lote ${iteration} (página ${page}) - ${totalProcessed} produtos sincronizados...`,
      itemsProcessed: totalProcessed,
    });

    try {
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
      const newTotalFound = totalFound + (response.totalFound || response.processed);

      console.log(`[Progressive Sync] Lote ${iteration} concluído:`, {
        processed: response.processed,
        errors: response.errors,
        totalProcessed: newTotalProcessed,
        totalFound: newTotalFound,
        hasMore: response.hasMore,
        nextPage: response.nextPage,
        timeElapsed: response.timeElapsed
      });

      // Update progress after processing
      updateProgress({
        itemsProcessed: newTotalProcessed,
        currentStep: `Lote ${iteration} concluído - ${response.processed} produtos processados (${newTotalFound} encontrados no total)`,
        progress: response.hasMore ? Math.min(15 + (iteration * 10), 80) : 90
      });

      // If there's more data, continue with next page
      if (response.nextPage && response.hasMore && iteration < 20) { // Limite de 20 iterações para evitar loops infinitos
        // Small delay between requests to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2 segundos
        
        return await performProgressiveSync(
          params,
          response.nextPage,
          newTotalProcessed,
          newTotalErrors,
          newTotalFound,
          iteration + 1
        );
      }

      return { processed: newTotalProcessed, errors: newTotalErrors, totalFound: newTotalFound };

    } catch (error: any) {
      console.error(`[Progressive Sync] Erro na iteração ${iteration}:`, error);
      
      // Se for um erro de timeout e já processamos alguns produtos, continuar
      if (error.message?.includes('timeout') && totalProcessed > 0) {
        console.log(`[Progressive Sync] Timeout na iteração ${iteration}, mas continuando...`);
        
        // Tentar continuar na próxima página com um delay maior
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return await performProgressiveSync(
          params,
          page + 1,
          totalProcessed,
          totalErrors + 1,
          totalFound,
          iteration + 1
        );
      }
      
      throw error;
    }
  };

  const syncData = useMutation({
    mutationFn: async ({ 
      syncType, 
      config, 
      batchSize = 50, // Mantido em 50
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

      // Execute progressive sync with improved parameters
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
        : `${syncType} sincronizado! ${data.processed} de ${data.totalFound || data.processed} produtos processados`;
      
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
