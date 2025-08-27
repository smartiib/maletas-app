
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

  // IMPROVED: Sync completo que não para até pegar TODOS os produtos
  const performCompleteSync = async (
    params: {
      syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: { url: string; consumer_key: string; consumer_secret: string; };
      batchSize?: number;
      productIds?: number[];
    }
  ): Promise<{ processed: number; errors: number; totalFound: number }> => {
    
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalFound = 0;
    let currentPage = 1;
    let iteration = 1;
    let hasMore = true;

    console.log(`[Complete Sync] Iniciando sincronização completa de ${params.syncType}`);
    
    // Atualizar progresso inicial
    updateProgress({
      progress: 5,
      currentStep: 'Iniciando sincronização completa...',
      itemsProcessed: 0,
    });

    while (hasMore && iteration <= 50) { // Limite máximo de 50 iterações como segurança
      const requestBody: SyncRequest = {
        sync_type: params.syncType,
        config: params.config,
        batch_size: 100, // Batch size grande para eficiência
        max_pages: 1000, // Permitir muitas páginas por chamada
        page: currentPage,
        organization_id: currentOrganization!.id,
        product_ids: params.productIds
      };

      console.log(`[Complete Sync] Iteração ${iteration}, Página inicial ${currentPage}, processados até agora: ${totalProcessed}`);

      // Calcular progresso baseado na iteração
      const progressPercentage = Math.min(10 + (iteration * 15), 85);
      updateProgress({
        progress: progressPercentage,
        currentStep: `Lote ${iteration} - Sincronizando produtos a partir da página ${currentPage}...`,
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

        totalProcessed += response.processed;
        totalErrors += response.errors;
        totalFound += (response.totalFound || response.processed);

        console.log(`[Complete Sync] Lote ${iteration} concluído:`, {
          processed: response.processed,
          errors: response.errors,
          totalProcessed,
          totalFound,
          hasMore: response.hasMore,
          nextPage: response.nextPage,
          timeElapsed: response.timeElapsed
        });

        // Atualizar progresso após cada lote
        updateProgress({
          itemsProcessed: totalProcessed,
          currentStep: `Lote ${iteration} concluído - ${response.processed} produtos processados (${totalFound} encontrados no total)`,
          progress: response.hasMore ? Math.min(15 + (iteration * 15), 80) : 95
        });

        // Verificar se há mais dados
        if (!response.hasMore || !response.nextPage) {
          console.log(`[Complete Sync] Sincronização completa! Processados: ${totalProcessed}, Encontrados: ${totalFound}`);
          hasMore = false;
          break;
        }

        // Preparar para próxima iteração
        currentPage = response.nextPage;
        iteration++;

        // Pequeno delay entre requisições
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.error(`[Complete Sync] Erro na iteração ${iteration}:`, error);
        
        // Para erro crítico, parar
        if (error.message?.includes('Organization ID') || error.message?.includes('credentials')) {
          throw error;
        }

        // Para outros erros, tentar continuar
        totalErrors++;
        currentPage++;
        iteration++;
        
        // Se muitos erros consecutivos, parar
        if (totalErrors > 10) {
          throw new Error(`Muitos erros na sincronização: ${error.message}`);
        }

        // Delay maior em caso de erro
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return { processed: totalProcessed, errors: totalErrors, totalFound };
  };

  const syncData = useMutation({
    mutationFn: async ({ 
      syncType, 
      config, 
      batchSize = 100,
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

      console.log('Iniciando sincronização completa:', { syncType, organizationId: currentOrganization.id, productIds });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Execute complete sync
      const result = await performCompleteSync({
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
        : `${syncType} sincronizado! ${data.processed} de ${data.totalFound || data.processed} produtos processados com sucesso`;
      
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
