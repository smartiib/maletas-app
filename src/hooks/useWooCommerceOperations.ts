
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
  force_full_sync?: boolean;
  organization_id: string; // Obrigatório
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

  const syncData = useMutation({
    mutationFn: async ({ 
      syncType, 
      config, 
      batchSize = 50, 
      forceFullSync = false 
    }: {
      syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: { url: string; consumer_key: string; consumer_secret: string; };
      batchSize?: number;
      forceFullSync?: boolean;
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      console.log('Iniciando sincronização:', { syncType, organizationId: currentOrganization.id });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const requestBody: SyncRequest = {
        sync_type: syncType,
        config: {
          url: config.url,
          consumer_key: config.consumer_key,
          consumer_secret: config.consumer_secret
        },
        batch_size: batchSize,
        force_full_sync: forceFullSync,
        organization_id: currentOrganization.id // Incluir organization_id obrigatório
      };

      console.log('Request body (sanitizado):', {
        ...requestBody,
        config: { ...requestBody.config, consumer_key: '***', consumer_secret: '***' }
      });

      try {
        // Usar invoke com tratamento de erro melhorado
        const { data, error } = await supabase.functions.invoke('wc-sync', {
          body: requestBody
        });

        if (error) {
          console.error('Erro na sincronização (supabase error):', error);
          
          // Verificar se é erro de CORS ou timeout
          if (error.message?.includes('Failed to send a request') || 
              error.message?.includes('CORS') ||
              error.message?.includes('Gateway Timeout')) {
            throw new Error('Erro de conexão com o servidor. Verifique sua conexão e tente novamente.');
          }
          
          throw new Error(error.message || 'Erro na sincronização');
        }

        if (!data) {
          console.log('Sincronização completada sem dados de retorno');
          return { success: true, message: 'Sincronização completada' };
        }

        return data;
      } catch (fetchError: any) {
        console.error('Erro de fetch na sincronização:', fetchError);
        
        // Tratamento específico para diferentes tipos de erro
        if (fetchError.name === 'FunctionsHttpError') {
          throw new Error('Erro HTTP na função de sincronização. Verifique os logs.');
        }
        
        if (fetchError.name === 'FunctionsFetchError') {
          throw new Error('Erro de conectividade. Verifique sua conexão com a internet.');
        }
        
        if (fetchError.message?.includes('CORS')) {
          throw new Error('Erro de CORS. Entre em contato com o suporte.');
        }
        
        if (fetchError.message?.includes('timeout') || fetchError.message?.includes('Gateway Timeout')) {
          throw new Error('Timeout na sincronização. A operação pode estar em andamento. Tente novamente em alguns minutos.');
        }
        
        throw fetchError;
      }
    },
    onMutate: ({ syncType }) => {
      startSync(syncType);
      console.log('Sincronização iniciada:', syncType);
    },
    onSuccess: (data, { syncType }) => {
      console.log('Sincronização concluída:', data);
      completeSync(data?.success !== false, data?.message || 'Sincronização concluída com sucesso');
      
      if (data?.success !== false) {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ 
          queryKey: ['woocommerce-products', currentOrganization?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['woocommerce-categories', currentOrganization?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['woocommerce-orders', currentOrganization?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['woocommerce-customers', currentOrganization?.id] 
        });
        
        toast.success(`Sincronização de ${syncType} concluída com sucesso!`);
      } else {
        toast.error(`Erro na sincronização: ${data?.message || 'Erro desconhecido'}`);
      }
    },
    onError: (error: any, { syncType }) => {
      console.error('Erro na sincronização:', error);
      const errorMessage = error?.message || 'Erro desconhecido na sincronização';
      completeSync(false, errorMessage);
      toast.error(`Erro na sincronização de ${syncType}: ${errorMessage}`);
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
