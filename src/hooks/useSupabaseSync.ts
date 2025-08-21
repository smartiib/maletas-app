
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Types used by multiple hooks
type SyncType = 'products' | 'categories' | 'orders' | 'customers' | 'full';

interface SyncLog {
  id: string;
  organization_id: string;
  log_type: 'sync_started' | 'sync_completed' | 'sync_error' | string;
  status?: 'success' | 'error' | 'pending' | string;
  sync_type?: SyncType | string;
  operation?: string;
  message?: string;
  items_processed?: number;
  items_failed?: number;
  duration_ms?: number;
  created_at: string;
}

interface SyncConfig {
  id?: string;
  organization_id: string;
  sync_type: 'products' | 'categories' | 'orders' | 'customers';
  is_active: boolean;
  sync_interval: 'manual' | '15min' | '30min' | '1h' | '2h' | '6h' | '12h' | '24h';
  auto_sync_enabled: boolean;
  sync_on_startup: boolean;
  config_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// =========================================
// Sync Status Hook (with stale-start protection and started_at)
// =========================================
export const useSyncStatus = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-status', currentOrganization?.id],
    queryFn: async (): Promise<{ is_syncing: boolean; started_at?: string }> => {
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

      const latestLog = data[0] as SyncLog;

      // Consider sync_started stale after 15 minutes
      if (latestLog.log_type === 'sync_started') {
        const logTime = new Date(latestLog.created_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - logTime) / (1000 * 60);

        if (diffMinutes > 15) {
          console.log('Log sync_started muito antigo, considerando como inativo');
          return { is_syncing: false };
        }

        return { is_syncing: true, started_at: latestLog.created_at };
      }

      return { is_syncing: false };
    },
    enabled: !!currentOrganization,
    refetchInterval: 3000, // Verificar a cada 3 segundos
  });
};

// =========================================
// Sync Stats Hook (adds categories_count, last_sync, active_configs)
// =========================================
export const useSyncStats = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      // Counts from tables
      const [productsResult, customersResult, ordersResult, categoriesResult] = await Promise.all([
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
        supabase
          .from('wc_categories')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id).throwOnError(),
      ]);

      // Latest success or error log to show status
      const { data: lastAnyLog } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('log_type', ['sync_completed', 'sync_error'])
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSync =
        lastAnyLog && lastAnyLog[0]
          ? {
              status: lastAnyLog[0].log_type === 'sync_completed' ? 'success' : 'error',
              created_at: lastAnyLog[0].created_at as string,
            }
          : { status: 'never', created_at: null as any };

      // Active configs count
      const { data: activeConfigs } = await supabase
        .from('sync_configs')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      return {
        products_count: productsResult.count || 0,
        customers_count: customersResult.count || 0,
        orders_count: ordersResult.count || 0,
        categories_count: categoriesResult?.count || 0,
        last_sync_time: lastSync.created_at,
        last_sync: lastSync,
        active_configs: activeConfigs || [],
      };
    },
    enabled: !!currentOrganization,
    staleTime: 30000, // 30 segundos
  });
};

// =========================================
// Manual Sync Hook
// =========================================
export const useManualSync = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      sync_type: SyncType;
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
    onSuccess: (data, _variables) => {
      console.log('Sincronização iniciada com sucesso:', data);
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['sync-status', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-categories', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-config', currentOrganization?.id] });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização manual:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });
};

// =========================================
// Time since last sync (string for UI)
// =========================================
export const useTimeSinceLastSync = () => {
  const { data: stats } = useSyncStats();

  const compute = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Nunca sincronizado';
    const lastSyncDate = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSyncDate.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Sincronizado agora';
    if (diffInMinutes < 60) return `Há ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `Há ${Math.floor(diffInMinutes / 60)} horas`;
    return `Há ${Math.floor(diffInMinutes / 1440)} dias`;
  };

  return compute(stats?.last_sync_time);
};

// =========================================
// Sync Logs list for dashboard
// =========================================
export const useSyncLogs = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-logs', currentOrganization?.id],
    queryFn: async (): Promise<SyncLog[]> => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs de sincronização:', error);
        return [];
      }

      return data as SyncLog[];
    },
    enabled: !!currentOrganization,
    refetchInterval: 5000,
  });
};

// =========================================
// Sync Config (list + save)
// =========================================
export const useSyncConfig = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-config', currentOrganization?.id],
    queryFn: async (): Promise<SyncConfig[]> => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('sync_configs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar configurações de sync:', error);
        return [];
      }

      return (data || []) as SyncConfig[];
    },
    enabled: !!currentOrganization,
  });
};

export const useSaveSyncConfig = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (config: Omit<SyncConfig, 'organization_id'> & { organization_id?: string }) => {
      if (!currentOrganization) throw new Error('Nenhuma organização selecionada');

      const payload: SyncConfig = {
        organization_id: currentOrganization.id,
        ...config,
        updated_at: new Date().toISOString(),
      };

      console.log('[useSaveSyncConfig] upsert payload', payload);

      const { data, error } = await supabase
        .from('sync_configs')
        .upsert(payload)
        .select();

      if (error) {
        console.error('Erro ao salvar configuração de sync:', error);
        throw new Error(error.message || 'Erro ao salvar configuração');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-config', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats', currentOrganization?.id] });
      toast.success('Configurações salvas com sucesso');
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar configuração: ${err.message}`);
    }
  });
};

// =========================================
// Data hooks used around the app (POS, Suppliers, Maletas)
// =========================================

export const useSupabaseProducts = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return { products: [] };
      const { data, error } = await supabase
        .from('wc_products')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('id', { ascending: true });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return { products: [] };
      }
      return { products: data as any[] };
    },
    enabled: !!currentOrganization,
  });
};

export const useSupabaseCustomers = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-customers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return { customers: [] };
      const { data, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('id', { ascending: true });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        return { customers: [] };
      }
      return { customers: data as any[] };
    },
    enabled: !!currentOrganization,
  });
};

export const useSupabaseAllCustomers = () => {
  // For now same as useSupabaseCustomers (non-paginated)
  return useSupabaseCustomers();
};

export const useSupabaseCategories = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-categories', currentOrganization?.id],
    // Return string[] (category names) to match POS expectations
    queryFn: async (): Promise<string[]> => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('wc_categories')
        .select('name')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
      }

      // Map to string[]
      const names = (data || []).map((c: any) => c.name).filter(Boolean);
      return names as string[];
    },
    enabled: !!currentOrganization,
  });
};
