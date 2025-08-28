import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { useOrganization } from '@/contexts/OrganizationContext';
import { IncrementalSyncService } from '@/services/incrementalSync';

interface SyncConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

export const useIncrementalSync = () => {
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

  // Query para buscar status de sincronização
  const syncStatusQuery = useQuery({
    queryKey: ['sync-status', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('sync_type', 'products')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!currentOrganization?.id
  });

  // Mutation para descobrir produtos a sincronizar
  const discoverMutation = useMutation({
    mutationFn: async (config: SyncConfig) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }

      const syncService = new IncrementalSyncService(config, currentOrganization.id);
      
      updateProgress({
        progress: 10,
        currentStep: 'Descobrindo produtos para sincronização...'
      });

      // Marcar início da descoberta
      await syncService.updateSyncStatus({
        status: 'discovering',
        last_discover_at: new Date().toISOString()
      });

      const result = await syncService.discoverProductsToSync();

      // Atualizar status com resultados da descoberta
      await syncService.updateSyncStatus({
        total_items: result.totalItems,
        processed_items: 0,
        status: 'ready',
        metadata: {
          missingIds: result.missingIds,
          changedIds: result.changedIds,
          lastModified: result.lastModified,
          discoveredAt: new Date().toISOString()
        }
      });

      return result;
    },
    onSuccess: (result) => {
      const totalToSync = result.missingIds.length + result.changedIds.length;
      
      updateProgress({
        progress: 20,
        currentStep: `Encontrados ${totalToSync} produtos para sincronizar de ${result.totalItems} total`,
        totalItems: totalToSync
      });

      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      
      toast.success(`Descoberta concluída: ${totalToSync} produtos precisam ser sincronizados`);
    }
  });

  // Mutation para sincronizar produtos específicos SEM variações
  const syncSpecificMutation = useMutation({
    mutationFn: async ({ 
      config, 
      productIds 
    }: { 
      config: SyncConfig; 
      productIds: number[] 
    }) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }

      if (productIds.length === 0) {
        return { processed: 0, errors: 0, failedIds: [] as number[] };
      }

      const syncService = new IncrementalSyncService(config, currentOrganization.id);
      
      // Atualizar status para sincronizando
      await syncService.updateSyncStatus({
        status: 'syncing'
      });

      // Sincronizar em lotes de 50 produtos SEM variações
      const batchSize = 50;
      let totalProcessed = 0;
      let totalErrors = 0;
      const failedIds: number[] = [];

      for (let i = 0; i < productIds.length; i += batchSize) {
        const originalBatch = productIds.slice(i, i + batchSize);
        let pendingIds = [...originalBatch];
        let attempts = 0;
        const maxAttempts = 10; // evita loops infinitos em caso de erros persistentes

        // Para detectar respostas "vazias" e não encerrar indevidamente
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        while (pendingIds.length > 0 && attempts < maxAttempts) {
          const progress = Math.min(20 + (i / productIds.length) * 70, 90);
          updateProgress({
            progress,
            currentStep: `Sincronizando lote ${Math.floor(i / batchSize) + 1} (${pendingIds.length} produtos restantes - apenas produtos pai)...`,
            itemsProcessed: totalProcessed
          });

          try {
            const { data, error } = await supabase.functions.invoke('wc-sync', {
              body: {
                sync_type: 'specific_products',
                config,
                organization_id: currentOrganization.id,
                product_ids: pendingIds,
                batch_size: pendingIds.length,
                include_variations: false // manter sem variações
              }
            });

            if (error) {
              console.error('[IncrementalSync] Erro no lote:', error);
              // não perder os pendingIds: contam como falha do lote atual
              totalErrors += pendingIds.length;
              failedIds.push(...pendingIds);
              break; // sai do while, vai para próximo lote
            }

            // Tratar respostas vazias ou sem forma esperada como tentativa falha (retry)
            if (!data || (typeof data !== 'object')) {
              console.warn('[IncrementalSync] Resposta vazia/inesperada do edge. Repetindo tentativa...');
              attempts += 1;
              await delay(500);
              continue;
            }

            const response = (data as any);
            const processed = Number(response.processed ?? 0);
            const errors = Number(response.errors ?? 0);
            const remainingIds: number[] = Array.isArray(response.remainingIds) ? response.remainingIds : (
              // fallback: se não vier remainingIds mas hasMore = true, não considerar o lote como concluído
              response.hasMore ? pendingIds : []
            );

            // Caso a resposta não traga nenhum indicativo (processed/remainingIds), considerar como tentativa falha
            const noUsefulInfo = !processed && (!Array.isArray(response.remainingIds) && !response.hasMore);
            if (noUsefulInfo) {
              console.warn('[IncrementalSync] Resposta sem dados úteis. Repetindo tentativa...');
              attempts += 1;
              await delay(500);
              continue;
            }

            totalProcessed += processed;
            totalErrors += errors;

            // Atualizar progresso no banco
            await syncService.updateSyncStatus({
              processed_items: totalProcessed
            });

            // Se ainda restam IDs, repetir apenas os restantes
            const before = pendingIds.length;
            pendingIds = remainingIds;

            // Se nada foi processado e o número de pendentes não mudou, evitar loop infinito
            const noProgressThisAttempt = processed === 0 && pendingIds.length === before;
            if (noProgressThisAttempt) {
              attempts += 1;
              console.warn(`[IncrementalSync] Sem progresso na tentativa ${attempts}. Mantendo retry... pendentes: ${pendingIds.length}`);
              await delay(500);
            } else if (pendingIds.length > 0) {
              attempts += 1;
              await delay(300);
            }
          } catch (err) {
            console.error('[IncrementalSync] Erro no lote (exceção):', err);
            totalErrors += pendingIds.length;
            failedIds.push(...pendingIds);
            break;
          }
        }

        // Se ainda tiverem IDs pendentes após estourar as tentativas, contabilizar como erro
        if (pendingIds.length > 0) {
          console.warn('[IncrementalSync] IDs não processados após tentativas máximas:', pendingIds);
          totalErrors += pendingIds.length;
          failedIds.push(...pendingIds);
        }

        // Delay antes do próximo lote para aliviar a função edge
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Sanidade: se ainda houver diferença entre solicitados e processados, contar como erro
      const unprocessed = Math.max(productIds.length - totalProcessed, 0);
      if (unprocessed > 0) {
        console.warn('[IncrementalSync] Diferença não processada detectada:', { requested: productIds.length, processed: totalProcessed, unprocessed });
        totalErrors += unprocessed;
      }

      // Marcar sincronização como concluída (sucesso somente se não houve erros)
      await syncService.updateSyncStatus({
        status: totalErrors === 0 ? 'completed' : 'ready', // se houve erros, manter "ready" para nova tentativa
        last_sync_at: new Date().toISOString(),
        processed_items: totalProcessed,
        metadata: {
          completedAt: new Date().toISOString(),
          processedIds: productIds.length,
          totalProcessed,
          totalErrors,
          failedIds: Array.from(new Set(failedIds)),
          note: 'Products synced without variations'
        }
      });

      return { processed: totalProcessed, errors: totalErrors, failedIds: Array.from(new Set(failedIds)) };
    },
    onSuccess: (result) => {
      updateProgress({
        progress: result.errors === 0 ? 100 : Math.min(progressState.progress, 99), // só 100% se sem erros
        currentStep: result.errors === 0
          ? `Sincronização de produtos concluída! ${result.processed} produtos processados (variações não incluídas)`
          : `Sincronização parcial: ${result.processed} processados, ${result.errors} erros`,
        itemsProcessed: result.processed
      });

      // Invalidar queries relacionadas
      const orgId = currentOrganization?.id;
      queryClient.invalidateQueries({ queryKey: ['sync-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', orgId] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', orgId] });
      
      const message = result.errors > 0 
        ? `Sincronização parcial com ${result.errors} erros. Você pode tentar novamente para completar.`
        : 'Produtos sincronizados com sucesso! Use o botão "Buscar variações" nos produtos variáveis para sincronizar suas variações.';
      
      completeSync(result.errors === 0, result.errors > 0 ? `${result.errors} erros / pendências` : undefined);
      toast[result.errors > 0 ? 'warning' : 'success'](message);
    }
  });

  // Mutation principal que combina descoberta + sincronização SEM variações
  const fullSyncMutation = useMutation({
    mutationFn: async (config: SyncConfig) => {
      startSync('Sincronização Incremental de Produtos');
      
      // 1. Descobrir produtos
      const discovery = await discoverMutation.mutateAsync(config);
      
      // 2. Sincronizar apenas produtos necessários SEM variações
      const allIds = [...discovery.missingIds, ...discovery.changedIds];
      
      if (allIds.length === 0) {
        updateProgress({
          progress: 100,
          currentStep: 'Todos os produtos já estão sincronizados!'
        });
        return { processed: 0, errors: 0, upToDate: true };
      }

      const result = await syncSpecificMutation.mutateAsync({
        config,
        productIds: allIds
      });

      return { ...result, upToDate: false };
    },
    onError: (error: any) => {
      console.error('[IncrementalSync] Erro na sincronização:', error);
      completeSync(false, error.message);
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  return {
    // Queries
    syncStatus: syncStatusQuery.data,
    isLoadingSyncStatus: syncStatusQuery.isLoading,

    // Mutations
    discoverProducts: (discoverMutation as any).mutate,
    syncSpecificProducts: (syncSpecificMutation as any).mutate,
    fullSync: (fullSyncMutation as any).mutate,

    // Estados
    isDiscovering: (discoverMutation as any).isPending,
    isSyncing: (syncSpecificMutation as any).isPending || (fullSyncMutation as any).isPending,
    
    // Progress
    progressState,
    closeProgress,
    resetProgress
  };
};
