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
  const { syncStatus, isLoadingStatus, discover, isDiscovering } = useDiscovery();
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
      discover(config);
      
      // Aguardar descoberta completar
      await new Promise<void>(resolve => {
        const checkDiscovery = () => {
          if (!isDiscovering) {
            resolve();
          } else {
            setTimeout(checkDiscovery, 500);
          }
        };
        checkDiscovery();
      });

      if (!syncStatus) {
        throw new Error('Falha na descoberta');
      }

      updateProgress({
        progress: 30,
        currentStep: 'Sincronizando do WooCommerce...'
      });

      // 2. Sincronizar produtos do WooCommerce
      const missingIds = syncStatus.metadata?.missingIds || [];
      const changedIds = syncStatus.metadata?.changedIds || [];
      const allIds = [...missingIds, ...changedIds];

      if (allIds.length > 0) {
        syncFromWooCommerce({ 
          config, 
          entityIds: allIds,
          batchSize: 25 
        });

        // Aguardar sincronização completar
        await new Promise<void>(resolve => {
          const checkSync = () => {
            if (!isSyncing) {
              resolve();
            } else {
              setTimeout(checkSync, 500);
            }
          };
          checkSync();
        });
      }

      updateProgress({
        progress: 80,
        currentStep: 'Processando mudanças locais...'
      });

      // 3. Processar queue de mudanças locais
      processQueue({ batchSize: 10, maxRetries: 3 });

      // Aguardar processamento completar
      await new Promise<void>(resolve => {
        const checkQueue = () => {
          if (!isProcessingQueue) {
            resolve();
          } else {
            setTimeout(checkQueue, 500);
          }
        };
        checkQueue();
      });

      updateProgress({
        progress: 100,
        currentStep: 'Sincronização concluída!'
      });

      return {
        wooCommerceSync: { processed: allIds.length, errors: 0, failedIds: [] },
        queueProcessed: true
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