
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

  // Mutation para sincronizar produtos específicos com multi-pass strategy
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
        return { processed: 0, errors: 0, failedIds: [] as number[], passes: 0 };
      }

      const syncService = new IncrementalSyncService(config, currentOrganization.id);
      
      // Atualizar status para sincronizando
      await syncService.updateSyncStatus({
        status: 'syncing'
      });

      // Multi-pass strategy with smaller batches
      const BATCH_SIZE = 25;
      const MAX_PASSES = 15;
      const MAX_ATTEMPTS_PER_BATCH = 3;
      
      let allPendingIds = [...productIds];
      let totalProcessed = 0;
      let totalErrors = 0;
      const failedIds: number[] = [];
      let currentPass = 1;

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      while (allPendingIds.length > 0 && currentPass <= MAX_PASSES) {
        console.log(`[IncrementalSync] Pass ${currentPass}: ${allPendingIds.length} produtos pendentes`);
        
        updateProgress({
          progress: Math.min(20 + ((totalProcessed / productIds.length) * 70), 95),
          currentStep: `Pass ${currentPass}: Processando ${allPendingIds.length} produtos restantes (lotes de ${BATCH_SIZE})...`,
          itemsProcessed: totalProcessed,
          totalItems: productIds.length
        });

        let passProcessed = 0;
        let passErrors = 0;
        const passFailedIds: number[] = [];

        // Process remaining IDs in batches for this pass
        for (let i = 0; i < allPendingIds.length; i += BATCH_SIZE) {
          const batch = allPendingIds.slice(i, i + BATCH_SIZE);
          let batchAttempts = 0;
          let batchPendingIds = [...batch];

          while (batchPendingIds.length > 0 && batchAttempts < MAX_ATTEMPTS_PER_BATCH) {
            batchAttempts++;
            
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allPendingIds.length / BATCH_SIZE);
            
            updateProgress({
              progress: Math.min(20 + ((totalProcessed / productIds.length) * 70), 95),
              currentStep: `Pass ${currentPass}: Lote ${batchNumber}/${totalBatches} (${batchPendingIds.length} produtos, tentativa ${batchAttempts})`,
              itemsProcessed: totalProcessed,
              totalItems: productIds.length
            });

            try {
              const { data, error } = await supabase.functions.invoke('wc-sync', {
                body: {
                  sync_type: 'specific_products',
                  config,
                  organization_id: currentOrganization.id,
                  product_ids: batchPendingIds,
                  batch_size: batchPendingIds.length,
                  include_variations: false
                }
              });

              if (error) {
                console.error(`[IncrementalSync] Erro no lote (Pass ${currentPass}, tentativa ${batchAttempts}):`, error);
                if (batchAttempts >= MAX_ATTEMPTS_PER_BATCH) {
                  passErrors += batchPendingIds.length;
                  passFailedIds.push(...batchPendingIds);
                  break;
                }
                await delay(1000 * batchAttempts);
                continue;
              }

              if (!data || typeof data !== 'object') {
                console.warn(`[IncrementalSync] Resposta vazia/inesperada (Pass ${currentPass}, tentativa ${batchAttempts})`);
                if (batchAttempts >= MAX_ATTEMPTS_PER_BATCH) {
                  passErrors += batchPendingIds.length;
                  passFailedIds.push(...batchPendingIds);
                  break;
                }
                await delay(1000 * batchAttempts);
                continue;
              }

              const response = data as any;
              const processed = Number(response.processed ?? 0);
              const errors = Number(response.errors ?? 0);
              
              // Use processedIds if available, otherwise fall back to remainingIds logic
              let actuallyProcessedIds: number[] = [];
              let remainingIds: number[] = [];
              
              if (Array.isArray(response.processedIds)) {
                actuallyProcessedIds = response.processedIds;
                remainingIds = batchPendingIds.filter(id => !actuallyProcessedIds.includes(id));
              } else if (Array.isArray(response.remainingIds)) {
                remainingIds = response.remainingIds;
                actuallyProcessedIds = batchPendingIds.filter(id => !remainingIds.includes(id));
              } else {
                // Fallback: assume processed count is accurate
                if (processed > 0) {
                  actuallyProcessedIds = batchPendingIds.slice(0, processed);
                  remainingIds = batchPendingIds.slice(processed);
                } else {
                  remainingIds = [...batchPendingIds];
                }
              }

              passProcessed += actuallyProcessedIds.length;
              passErrors += errors;

              // Update progress in database
              await syncService.updateSyncStatus({
                processed_items: totalProcessed + passProcessed
              });

              console.log(`[IncrementalSync] Pass ${currentPass}, Lote ${batchNumber}: processados=${actuallyProcessedIds.length}, erros=${errors}, restantes=${remainingIds.length}`);

              if (remainingIds.length === 0) {
                batchPendingIds = [];
              } else if (remainingIds.length < batchPendingIds.length) {
                batchPendingIds = remainingIds;
                await delay(500);
              } else if (actuallyProcessedIds.length === 0) {
                if (batchAttempts >= MAX_ATTEMPTS_PER_BATCH) {
                  passErrors += batchPendingIds.length;
                  passFailedIds.push(...batchPendingIds);
                  break;
                }
                await delay(1000 * batchAttempts);
              } else {
                batchPendingIds = remainingIds;
                await delay(500);
              }

            } catch (err) {
              console.error(`[IncrementalSync] Exceção no lote (Pass ${currentPass}, tentativa ${batchAttempts}):`, err);
              if (batchAttempts >= MAX_ATTEMPTS_PER_BATCH) {
                passErrors += batchPendingIds.length;
                passFailedIds.push(...batchPendingIds);
                break;
              }
              await delay(1000 * batchAttempts);
            }
          }

          if (batchPendingIds.length > 0 && batchAttempts >= MAX_ATTEMPTS_PER_BATCH) {
            passFailedIds.push(...batchPendingIds);
            passErrors += batchPendingIds.length;
          }

          if (i + BATCH_SIZE < allPendingIds.length) {
            await delay(300);
          }
        }

        totalProcessed += passProcessed;
        totalErrors += passErrors;
        failedIds.push(...passFailedIds);

        // Update pending list to only include items that actually failed
        allPendingIds = passFailedIds;

        console.log(`[IncrementalSync] Pass ${currentPass} concluído: processados=${passProcessed}, erros=${passErrors}, restantes=${allPendingIds.length}`);

        if (passProcessed === 0 && allPendingIds.length > 0) {
          console.warn(`[IncrementalSync] Nenhum progresso no Pass ${currentPass}, interrompendo...`);
          break;
        }

        currentPass++;
        
        if (allPendingIds.length > 0 && currentPass <= MAX_PASSES) {
          await delay(1000);
        }
      }

      if (allPendingIds.length > 0) {
        console.warn(`[IncrementalSync] ${allPendingIds.length} produtos não processados após ${currentPass - 1} passes`);
        totalErrors += allPendingIds.length;
        failedIds.push(...allPendingIds);
      }

      // Determine final status - only mark as completed if ALL items were processed
      const isFullyCompleted = totalProcessed === productIds.length && totalErrors === 0;
      
      await syncService.updateSyncStatus({
        status: isFullyCompleted ? 'completed' : 'ready',
        last_sync_at: new Date().toISOString(),
        processed_items: totalProcessed,
        metadata: {
          completedAt: new Date().toISOString(),
          totalPasses: currentPass - 1,
          requestedIds: productIds.length,
          totalProcessed,
          totalErrors,
          failedIds: Array.from(new Set(failedIds)),
          isFullyCompleted,
          note: 'Multi-pass sync with accurate completion tracking'
        }
      });

      return { 
        processed: totalProcessed, 
        errors: totalErrors, 
        failedIds: Array.from(new Set(failedIds)),
        passes: currentPass - 1,
        isFullyCompleted
      };
    },
    onSuccess: (result) => {
      const totalRequested = result.processed + result.errors;
      const successRate = totalRequested > 0 ? (result.processed / totalRequested) * 100 : 0;
      
      updateProgress({
        progress: result.isFullyCompleted ? 100 : Math.min(95, Math.round(successRate)),
        currentStep: result.isFullyCompleted
          ? `Sincronização concluída! ${result.processed} produtos processados em ${result.passes} passes`
          : `Sincronização parcial: ${result.processed} processados, ${result.errors} pendentes (${result.passes} passes)`,
        itemsProcessed: result.processed,
        totalItems: result.processed + result.errors
      });

      const orgId = currentOrganization?.id;
      queryClient.invalidateQueries({ queryKey: ['sync-status', orgId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', orgId] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', orgId] });
      
      const message = result.isFullyCompleted
        ? `Sincronização concluída com sucesso! ${result.processed} produtos processados em ${result.passes} passes.`
        : `Sincronização parcial: ${result.processed} produtos sincronizados, ${result.errors} ainda pendentes. ${result.passes} passes realizados.`;
      
      completeSync(result.isFullyCompleted, result.isFullyCompleted ? undefined : `${result.errors} produtos pendentes em ${result.passes} passes`);
      toast[result.isFullyCompleted ? 'success' : 'info'](message);
    }
  });

  // Mutation principal que combina descoberta + sincronização
  const fullSyncMutation = useMutation({
    mutationFn: async (config: SyncConfig) => {
      startSync('Sincronização Incremental (Multi-Pass)');
      
      // 1. Descobrir produtos
      const discovery = await discoverMutation.mutateAsync(config);
      
      // 2. Sincronizar apenas produtos necessários
      const allIds = [...discovery.missingIds, ...discovery.changedIds];
      
      if (allIds.length === 0) {
        // Sanity check: se a contagem local divergir da contagem do Woo, força uma reconciliação completa
        const { count: localCount } = await supabase
          .from('wc_products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id);

        if ((localCount ?? 0) < discovery.totalItems) {
          updateProgress({
            progress: 60,
            currentStep: `Reconciliação necessária: local ${localCount ?? 0} < Woo ${discovery.totalItems}. Executando sync completo...`
          });

          const { data, error } = await supabase.functions.invoke('wc-sync', {
            body: {
              sync_type: 'products',
              config,
              organization_id: currentOrganization.id,
              batch_size: 100,
              max_pages: 1000,
              include_variations: false
            }
          });

          if (error) {
            throw new Error(`Falha no sync de reconciliação: ${error.message}`);
          }

          // Após reconciliação, atualizar caches e concluir
          queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization.id] });
          updateProgress({
            progress: 100,
            currentStep: 'Reconciliação concluída.'
          });

          return { processed: Number((data as any)?.processed ?? 0), errors: Number((data as any)?.errors ?? 0), upToDate: false, passes: 1, isFullyCompleted: true };
        }

        updateProgress({
          progress: 100,
          currentStep: 'Todos os produtos já estão sincronizados!'
        });
        return { processed: 0, errors: 0, upToDate: true, passes: 0, isFullyCompleted: true };
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
