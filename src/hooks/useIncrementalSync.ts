import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useSyncFromWooCommerce } from '@/hooks/useSyncFromWooCommerce';
import { useSyncQueue } from '@/hooks/useSyncQueue';

interface SyncConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

/**
 * Hook principal para sincronização incremental
 * Combina descoberta, sincronização e processamento de queue
 */
export const useIncrementalSync = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const {
    progressState,
    startSync,
    updateProgress,
    completeSync
  } = useSyncProgress();

  // Usar hooks especializados
  const { syncStatus, isLoadingStatus, discover, discoverAsync, isDiscovering } = useDiscovery();
  const { syncFromWooCommerce, isSyncing } = useSyncFromWooCommerce();
  const { queueStatus, processQueue, isProcessingQueue, addToQueue } = useSyncQueue();

  // Mutation para sincronização completa (descoberta + sync)
  const fullSyncMutation = useMutation({
    mutationFn: async (config: SyncConfig) => {
      startSync('Sincronização Completa');
      
      updateProgress({
        progress: 10,
        currentStep: 'Descobrindo mudanças...'
      });

      // 1. Descobrir mudanças
      const discovery = await discoverAsync(config);

      if (!discovery) {
        throw new Error('Falha na descoberta');
      }

      const discoveredTotal = discovery.totalItems || 0;
      console.log(`🔍 Descobertos ${discoveredTotal} produtos no WooCommerce`);

      updateProgress({
        progress: 20,
        currentStep: `Sincronizando ${discoveredTotal} produtos...`
      });

      // 2. Sincronizar TODOS os produtos do WooCommerce (não apenas missing/changed)
      const missingIds = discovery.missingIds || [];
      const changedIds = discovery.changedIds || [];
      const allIds = Array.from(new Set([...missingIds, ...changedIds]));

      console.log(`📦 Produtos a sincronizar: ${allIds.length} (missing: ${missingIds.length}, changed: ${changedIds.length})`);

      let syncResult = { processed: 0, errors: 0, failedIds: [] as number[], total: 0 };

      if (allIds.length > 0) {
        try {
          // Usar mutateAsync para aguardar a conclusão
          syncResult = await new Promise<any>((resolve, reject) => {
            syncFromWooCommerce(
              { 
                config, 
                entityIds: allIds,
                batchSize: 25 
              },
              {
                onSuccess: (data) => resolve(data),
                onError: (error) => reject(error)
              }
            );
          });

          console.log(`✅ Sincronização WooCommerce concluída: ${syncResult.processed}/${syncResult.total}`);
        } catch (error) {
          console.error('❌ Erro na sincronização:', error);
          throw error;
        }
      }

      updateProgress({
        progress: 90,
        currentStep: 'Verificando resultado...'
      });

      // Verificar se todos foram sincronizados
      const expectedCount = allIds.length;
      const actualCount = syncResult.processed;
      
      if (actualCount < expectedCount) {
        console.warn(`⚠️ Sincronização incompleta: ${actualCount}/${expectedCount}`);
        
        // Tentar ressincronizar produtos falhados (apenas 1 retry)
        if (syncResult.failedIds && syncResult.failedIds.length > 0 && syncResult.failedIds.length <= 50) {
          console.log(`🔄 Tentando ressincronizar ${syncResult.failedIds.length} produtos falhados...`);
          
          try {
            const retryResult = await new Promise<any>((resolve, reject) => {
              syncFromWooCommerce(
                { 
                  config, 
                  entityIds: syncResult.failedIds,
                  batchSize: 10
                },
                {
                  onSuccess: (data) => resolve(data),
                  onError: (error) => reject(error)
                }
              );
            });

            syncResult.processed += retryResult.processed;
            syncResult.errors = retryResult.errors;
            syncResult.failedIds = retryResult.failedIds;
          } catch (retryError) {
            console.error('❌ Erro no retry:', retryError);
          }
        }
      }

      updateProgress({
        progress: 100,
        currentStep: syncResult.errors === 0 
          ? '✅ Sincronização concluída!' 
          : `⚠️ Concluído com ${syncResult.errors} erros`
      });

      return {
        wooCommerceSync: syncResult,
        discoveredTotal,
        queueProcessed: false
      };
    },
    onSuccess: () => {
      completeSync(true);
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['local-products', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization?.id] });
      
      toast.success('Sincronização completa realizada com sucesso!');
    },
    onError: (error) => {
      completeSync(false, error.message);
      toast.error('Erro na sincronização completa', {
        description: error.message
      });
    }
  });

  // Mutation para sincronização específica de produtos
  const syncSpecificMutation = useMutation({
    mutationFn: async ({ 
      config, 
      productIds 
    }: { 
      config: SyncConfig; 
      productIds: number[] 
    }) => {
      if (productIds.length === 0) {
        return { processed: 0, errors: 0, failedIds: [] };
      }

      syncFromWooCommerce({ 
        config, 
        entityIds: productIds,
        batchSize: 25 
      });

      // Note: o resultado real virá do onSuccess do useSyncFromWooCommerce
      return { processed: productIds.length, errors: 0, failedIds: [] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['local-products', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization?.id] });
    }
  });

  return {
    // Status e dados
    syncStatus,
    isLoadingStatus,
    queueStatus,
    
    // Operações principais
    discoverProducts: discover,
    isDiscovering,
    
    syncSpecificProducts: syncSpecificMutation.mutate,
    isSyncingSpecific: syncSpecificMutation.isPending,
    
    fullSync: fullSyncMutation.mutate,
    isFullSyncing: fullSyncMutation.isPending,
    
    processQueue,
    isProcessingQueue,
    addToQueue,
    
    // Estado de progresso
    progressState
  };
};