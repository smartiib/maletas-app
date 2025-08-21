
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Sync Status Hook com correção para logs antigos
export const useSyncStatus = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-status', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return { is_syncing: false };

      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar status de sincronização:', error);
        return { is_syncing: false };
      }

      if (!data || data.length === 0) {
        return { is_syncing: false };
      }

      const latestLog = data[0];
      
      // Se é sync_started, verificar se não é muito antigo (mais de 15 minutos)
      if (latestLog.log_type === 'sync_started') {
        const logTime = new Date(latestLog.created_at).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - logTime) / (1000 * 60);
        
        // Se passou de 15 minutos, considerar como não sincronizando
        if (diffMinutes > 15) {
          console.log('Log sync_started muito antigo, considerando como inativo');
          return { is_syncing: false };
        }
        
        return { is_syncing: true };
      }

      return { is_syncing: false };
    },
    enabled: !!currentOrganization,
    refetchInterval: 3000, // Verificar a cada 3 segundos
  });
};

// Sync Stats Hook
export const useSyncStats = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      // Buscar contadores das tabelas
      const [productsResult, customersResult, ordersResult] = await Promise.all([
        supabase
          .from('wc_products')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
        supabase
          .from('wc_customers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
        supabase
          .from('wc_orders')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
      ]);

      // Buscar último log de sincronização bem-sucedida
      const { data: lastSyncLog } = await supabase
        .from('sync_logs')
        .select('created_at')
        .eq('organization_id', currentOrganization.id)
        .eq('log_type', 'sync_completed')
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        products_count: productsResult.count || 0,
        customers_count: customersResult.count || 0,
        orders_count: ordersResult.count || 0,
        last_sync_time: lastSyncLog?.[0]?.created_at || null,
      };
    },
    enabled: !!currentOrganization,
    staleTime: 30000, // 30 segundos
  });
};

// Manual Sync Hook
export const useManualSync = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      sync_type: 'products' | 'categories' | 'orders' | 'customers' | 'full';
      config: {
        url: string;
        consumer_key: string;
        consumer_secret: string;
      };
      batch_size?: number;
      force_full_sync?: boolean;
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      console.log('Iniciando sincronização manual:', params);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const requestBody = {
        ...params,
        organization_id: currentOrganization.id,
      };

      const { data, error } = await supabase.functions.invoke('wc-sync', {
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Erro na sincronização:', error);
        throw new Error(error.message || 'Erro na sincronização');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Sincronização iniciada com sucesso:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-categories', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers', currentOrganization?.id] });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização manual:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });
};
