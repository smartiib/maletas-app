
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

      // Não enviar headers customizados; o client injeta Authorization/Content-Type corretamente
      const { data, error } = await supabase.functions.invoke('wc-sync', {
        body: requestBody
      });

      if (error) {
        console.error('Erro na sincronização:', error);
        throw new Error(error.message || 'Erro na sincronização');
      }

      return data;
    },
    onMutate: ({ syncType }) => {
      startSync(syncType);
      console.log('Sincronização iniciada:', syncType);
    },
    onSuccess: (data, { syncType }) => {
      console.log('Sincronização concluída:', data);
      completeSync(data.success, data.message);
      
      if (data.success) {
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
        
        toast.success(`${syncType} sincronizado com sucesso!`);
      } else {
        toast.error(`Erro na sincronização: ${data.message}`);
      }
    },
    onError: (error: any, { syncType }) => {
      console.error('Erro na sincronização:', error);
      completeSync(false, error.message);
      toast.error(`Erro na sincronização de ${syncType}: ${error.message}`);
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
