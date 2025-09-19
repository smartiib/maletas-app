import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface SyncConfig {
  url: string;
  consumer_key: string;
  consumer_secret: string;
}

interface DiscoveryResult {
  totalItems: number;
  missingIds: number[];
  changedIds: number[];
  toCreateInWooCommerce: any[];
  toUpdateInWooCommerce: any[];
  toDeleteInWooCommerce: number[];
  conflicts: any[];
  lastModified: string | null;
}

export const useDiscovery = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

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
    enabled: !!currentOrganization?.id,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Mutation para descobrir mudanças
  const discoverMutation = useMutation({
    mutationFn: async (config?: SyncConfig) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('sync-manager', {
        body: {
          operation: 'discover',
          organizationId: currentOrganization.id,
          config
        }
      });

      if (error) {
        throw new Error(`Erro na descoberta: ${error.message}`);
      }

      return data as DiscoveryResult;
    },
    onSuccess: (result) => {
      const totalToSync = result.missingIds.length + result.changedIds.length;
      const totalLocalChanges = result.toCreateInWooCommerce.length + 
                               result.toUpdateInWooCommerce.length + 
                               result.toDeleteInWooCommerce.length;
      
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      
      toast.success(
        `Descoberta concluída: ${totalToSync} produtos do WooCommerce, ${totalLocalChanges} mudanças locais`,
        { description: `${result.conflicts.length} conflitos detectados` }
      );
    },
    onError: (error) => {
      const errorMessage = error.message;
      let description = errorMessage;
      
      if (errorMessage.includes('401') || errorMessage.includes('credenciais')) {
        description = 'Erro de autenticação com WooCommerce. Verifique suas credenciais nas configurações.';
      }
      
      toast.error('Erro na descoberta', { 
        description 
      });
    }
  });

  return {
    syncStatus: syncStatusQuery.data,
    isLoadingStatus: syncStatusQuery.isLoading,
    discover: discoverMutation.mutate,
    discoverAsync: discoverMutation.mutateAsync,
    isDiscovering: discoverMutation.isPending
  };
};