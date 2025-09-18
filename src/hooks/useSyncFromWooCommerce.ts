import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSyncProgress } from '@/hooks/useSyncProgress';

interface SyncConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

interface SyncFromWooCommerceParams {
  config?: SyncConfig;
  entityIds: number[];
  batchSize?: number;
}

export const useSyncFromWooCommerce = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const {
    progressState,
    startSync,
    updateProgress,
    completeSync
  } = useSyncProgress();

  const syncFromWooCommerceMutation = useMutation({
    mutationFn: async ({ config, entityIds, batchSize = 25 }: SyncFromWooCommerceParams) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }

      if (entityIds.length === 0) {
        return { processed: 0, errors: 0, failedIds: [] };
      }

      startSync('Sincronização do WooCommerce');

      // Process in smaller chunks to provide better progress feedback
      const CHUNK_SIZE = batchSize;
      let totalProcessed = 0;
      let totalErrors = 0;
      const allFailedIds: number[] = [];

      for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
        const chunk = entityIds.slice(i, i + CHUNK_SIZE);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(entityIds.length / CHUNK_SIZE);

        updateProgress({
          progress: Math.round((i / entityIds.length) * 90),
          currentStep: `Processando lote ${chunkNumber}/${totalChunks} (${chunk.length} produtos)`,
          itemsProcessed: totalProcessed,
          totalItems: entityIds.length
        });

        try {
          const { data, error } = await supabase.functions.invoke('sync-manager', {
            body: {
              operation: 'sync_from_wc',
              organizationId: currentOrganization.id,
              config,
              entityIds: chunk,
              batchSize: chunk.length
            }
          });

          if (error) {
            console.error(`Erro no lote ${chunkNumber}:`, error);
            totalErrors += chunk.length;
            allFailedIds.push(...chunk);
          } else if (data) {
            const result = data as { processed: number; errors: number; failedIds: number[] };
            totalProcessed += result.processed;
            totalErrors += result.errors;
            allFailedIds.push(...result.failedIds);
          }
        } catch (error) {
          console.error(`Exceção no lote ${chunkNumber}:`, error);
          totalErrors += chunk.length;
          allFailedIds.push(...chunk);
        }

        // Small delay between chunks
        if (i + CHUNK_SIZE < entityIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      updateProgress({
        progress: 100,
        currentStep: `Sincronização concluída: ${totalProcessed} processados, ${totalErrors} erros`,
        itemsProcessed: totalProcessed,
        totalItems: entityIds.length
      });

      return {
        processed: totalProcessed,
        errors: totalErrors,
        failedIds: Array.from(new Set(allFailedIds))
      };
    },
    onSuccess: (result) => {
      const successRate = result.processed + result.errors > 0 
        ? (result.processed / (result.processed + result.errors)) * 100 
        : 0;

      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['local-products', currentOrganization?.id] });

      const isSuccess = result.errors === 0;
      completeSync(isSuccess, isSuccess ? undefined : `${result.errors} produtos com erro`);

      toast[isSuccess ? 'success' : 'warning'](
        `Sincronização ${isSuccess ? 'concluída' : 'parcial'}`,
        {
          description: `${result.processed} produtos sincronizados${result.errors > 0 ? `, ${result.errors} com erro` : ''}`
        }
      );
    },
    onError: (error) => {
      completeSync(false, error.message);
      toast.error('Erro na sincronização', {
        description: error.message
      });
    }
  });

  return {
    syncFromWooCommerce: syncFromWooCommerceMutation.mutate,
    isSyncing: syncFromWooCommerceMutation.isPending,
    progressState
  };
};