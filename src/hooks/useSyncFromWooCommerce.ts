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

      // Process in smaller chunks sequentially
      const CHUNK_SIZE = batchSize;
      let totalProcessed = 0;
      let totalErrors = 0;
      const allFailedIds: number[] = [];

      for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
        const chunk = entityIds.slice(i, i + CHUNK_SIZE);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(entityIds.length / CHUNK_SIZE);

        updateProgress({
          progress: Math.round((i / entityIds.length) * 95),
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
            totalProcessed += result.processed || 0;
            totalErrors += result.errors || 0;
            if (result.failedIds && result.failedIds.length > 0) {
              allFailedIds.push(...result.failedIds);
            }
            console.log(`✅ Lote ${chunkNumber}/${totalChunks}: ${result.processed} processados, ${result.errors} erros`);
          }
        } catch (error) {
          console.error(`Exceção no lote ${chunkNumber}:`, error);
          totalErrors += chunk.length;
          allFailedIds.push(...chunk);
        }

        // Small delay between chunks to avoid overwhelming the API
        if (i + CHUNK_SIZE < entityIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      updateProgress({
        progress: 100,
        currentStep: totalErrors === 0 
          ? `✅ Sincronização concluída: ${totalProcessed} produtos` 
          : `⚠️ Concluído: ${totalProcessed} OK, ${totalErrors} erros`,
        itemsProcessed: totalProcessed,
        totalItems: entityIds.length
      });

      return {
        processed: totalProcessed,
        errors: totalErrors,
        failedIds: Array.from(new Set(allFailedIds)),
        total: entityIds.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['local-products', currentOrganization?.id] });

      const isSuccess = result.errors === 0 && result.processed === result.total;
      completeSync(
        isSuccess, 
        isSuccess ? undefined : `${result.errors} de ${result.total} produtos falharam`
      );

      if (isSuccess) {
        toast.success('Sincronização concluída!', {
          description: `${result.processed} produtos sincronizados com sucesso`
        });
      } else {
        toast.warning('Sincronização parcial', {
          description: `${result.processed} OK, ${result.errors} com erro${result.failedIds.length > 0 ? ` (IDs: ${result.failedIds.slice(0, 5).join(', ')}...)` : ''}`
        });
      }
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
    syncFromWooCommerceAsync: syncFromWooCommerceMutation.mutateAsync,
    isSyncing: syncFromWooCommerceMutation.isPending,
    progressState
  };
};