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

  // IMPROVED: Sync completo mais resiliente que não para prematuramente
  const performCompleteSync = async (
    params: {
      syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: { url: string; consumer_key: string; consumer_secret: string; };
      batchSize?: number;
      productIds?: number[];
    }
  ): Promise<{ processed: number; errors: number; totalFound: number }> => {
    let totalProcessedAcrossPasses = 0;
    let totalErrorsAcrossPasses = 0;
    let bestEstimatedTotalFound = 0;

    // Controle de passadas
    let passNumber = 1;
    const maxPasses = 5; // limite de segurança para evitar loops infinitos

    console.log(`[Complete Sync] Iniciando sincronização completa de ${params.syncType}`);
    updateProgress({
      progress: 5,
      currentStep: 'Iniciando sincronização completa...',
      itemsProcessed: 0,
    });

    // Executa múltiplas passadas se necessário
    while (passNumber <= maxPasses) {
      let currentPage = 1;
      let iteration = 1;
      let shouldContinue = true;

      // Acumuladores desta passada (somente para esta rodada completa entre página 1 e última)
      let processedThisPass = 0;
      let errorsThisPass = 0;
      let foundThisPass = 0;
      let consecutiveEmptyResponses = 0;
      let lastProcessedCount = 0;

      console.log(`[Complete Sync] Passada ${passNumber} iniciada`);

      while (shouldContinue && iteration <= 50) {
        const requestBody: SyncRequest = {
          sync_type: params.syncType,
          config: params.config,
          batch_size: 100,
          max_pages: 1000,
          page: currentPage,
          organization_id: currentOrganization!.id,
          product_ids: params.productIds
        };

        console.log(`[Complete Sync] Passada ${passNumber} - Iteração ${iteration}, Página inicial ${currentPage}, processados até agora nesta passada: ${processedThisPass}`);

        const progressPercentage = Math.min(5 + (iteration * 12), 85);
        updateProgress({
          progress: progressPercentage,
          currentStep: `Passada ${passNumber} • Lote ${iteration} - Sincronizando a partir da página ${currentPage}...`,
          itemsProcessed: totalProcessedAcrossPasses + processedThisPass,
        });

        const { data, error } = await supabase.functions.invoke('wc-sync', {
          body: requestBody
        });

        if (error) {
          console.error(`[Complete Sync] Erro ao invocar função na passada ${passNumber}, iteração ${iteration}:`, error);
          // Erros bloqueantes (ex.: credenciais/organization)
          if (error.message?.includes('Organization ID') || error.message?.includes('credentials')) {
            throw new Error(error.message);
          }
          errorsThisPass++;
          totalErrorsAcrossPasses++;
          // Avança para próxima página para não travar na mesma
          currentPage++;
          iteration++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        const response = data as SyncResponse;
        if (!response?.success) {
          console.error(`[Complete Sync] Resposta sem sucesso na passada ${passNumber}, iteração ${iteration}:`, response);
          errorsThisPass++;
          totalErrorsAcrossPasses++;
          currentPage++;
          iteration++;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }

        // Acumula APENAS desta passada
        processedThisPass += response.processed || 0;
        errorsThisPass += response.errors || 0;
        foundThisPass += response.totalFound || 0;

        console.log(`[Complete Sync] Passada ${passNumber} - Lote ${iteration} concluído:`, {
          processed: response.processed,
          errors: response.errors,
          processedThisPass,
          foundThisPass,
          hasMore: response.hasMore,
          nextPage: response.nextPage,
          timeElapsed: response.timeElapsed
        });

        updateProgress({
          itemsProcessed: totalProcessedAcrossPasses + processedThisPass,
          currentStep: `Passada ${passNumber} • Lote ${iteration} - ${response.processed} itens processados (${foundThisPass} encontrados nesta passada)`,
          progress: Math.min(10 + (iteration * 12), 90)
        });

        // NOVA LÓGICA: Não confiar apenas em hasMore/nextPage do backend
        // Continuar enquanto há progresso real sendo feito
        const currentProcessed = response.processed || 0;
        
        if (currentProcessed === 0) {
          consecutiveEmptyResponses++;
          console.log(`[Complete Sync] Resposta vazia ${consecutiveEmptyResponses}/3 na iteração ${iteration}`);
          
          // Se tivemos 3 respostas consecutivas sem processar nada, parar esta passada
          if (consecutiveEmptyResponses >= 3) {
            console.log(`[Complete Sync] Passada ${passNumber} finalizada: muitas respostas vazias consecutivas`);
            shouldContinue = false;
            break;
          }
        } else {
          consecutiveEmptyResponses = 0; // Reset contador
        }

        // Se o backend deu nextPage, usar ele
        // Se não deu nextPage mas ainda há progresso, continuar página seguinte
        if (response.nextPage && response.nextPage > currentPage) {
          currentPage = response.nextPage;
          iteration++;
          await new Promise(resolve => setTimeout(resolve, 800));
        } else if (currentProcessed > 0) {
          // Ainda processou algo, tentar próxima página
          currentPage++;
          iteration++;
          await new Promise(resolve => setTimeout(resolve, 800));
        } else if (response.hasMore === false && response.nextPage === null) {
          // Backend disse claramente que acabou E não processou nada
          console.log(`[Complete Sync] Passada ${passNumber} finalizada pelo backend`);
          shouldContinue = false;
          break;
        } else {
          // Caso de segurança: tentar mais uma página
          currentPage++;
          iteration++;
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        lastProcessedCount = currentProcessed;
      }

      // Consolidar contadores desta passada
      totalProcessedAcrossPasses += processedThisPass;
      totalErrorsAcrossPasses += errorsThisPass;
      bestEstimatedTotalFound = Math.max(bestEstimatedTotalFound, foundThisPass);

      console.log(`[Complete Sync] Passada ${passNumber} finalizada. Processados nesta passada: ${processedThisPass}, Total geral: ${totalProcessedAcrossPasses}`);

      // Se nesta passada não processamos nada, não vale a pena tentar outra passada
      if (processedThisPass === 0) {
        console.log(`[Complete Sync] Nenhum item processado na passada ${passNumber}. Encerrando.`);
        break;
      }

      // Se processamos menos de 50 itens nesta passada, provavelmente acabou
      if (processedThisPass < 50) {
        console.log(`[Complete Sync] Poucos itens processados na passada ${passNumber} (${processedThisPass}). Considerando completo.`);
        break;
      }

      // Preparar próxima passada se necessário
      if (passNumber < maxPasses) {
        passNumber++;
        updateProgress({
          currentStep: `Iniciando passada ${passNumber} para garantir cobertura completa...`,
          progress: 60 + (passNumber * 10)
        });
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }

    console.log(`[Complete Sync] Sincronização finalizada. Total processado: ${totalProcessedAcrossPasses}, Melhor estimativa encontrados: ${bestEstimatedTotalFound}, Erros: ${totalErrorsAcrossPasses}`);

    return {
      processed: totalProcessedAcrossPasses,
      errors: totalErrorsAcrossPasses,
      totalFound: bestEstimatedTotalFound
    };
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
