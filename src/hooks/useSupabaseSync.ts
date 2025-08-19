import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface SyncConfig {
  id?: string;
  user_id?: string;
  sync_type: 'products' | 'customers' | 'orders';
  is_active: boolean;
  sync_interval: 'manual' | '15min' | '30min' | '1h' | '2h' | '6h' | '12h' | '24h';
  last_sync_at?: string;
  next_sync_at?: string;
  auto_sync_enabled: boolean;
  sync_on_startup: boolean;
  config_data?: any;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  items_processed: number;
  items_failed: number;
  duration_ms?: number;
  error_details?: string;
  created_at: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  stock_status: string;
  categories?: any[];
  images?: any[];
  description?: string;
  short_description?: string;
  type: string;
  status: string;
  synced_at?: string;
}

// Hook para buscar produtos do Supabase filtrados por organização
export const useSupabaseProducts = (page = 1, search = '', status = '', category = '') => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-products', currentOrganization?.id, page, search, status, category],
    queryFn: async () => {
      if (!currentOrganization) {
        return { products: [], total: 0, pages: 0 };
      }

      let query = supabase
        .from('wc_products')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('synced_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (status && status !== 'any') {
        query = query.eq('status', status);
      }

      if (category && category !== '0') {
        query = query.contains('categories', [{ id: parseInt(category) }]);
      }

      const { data, error, count } = await query
        .range((page - 1) * 20, page * 20 - 1);

      if (error) throw error;

      return {
        products: data || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      };
    },
    enabled: !!currentOrganization
  });
};

// Hook para buscar categorias do Supabase filtradas por organização
export const useSupabaseCategories = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-categories', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization
  });
};

// Hook para configurações de sincronização filtradas por organização
export const useSyncConfig = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('sync_config')
        .select('*')
        .order('sync_type');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization
  });
};

// Hook para salvar configuração de sincronização
export const useSaveSyncConfig = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (config: SyncConfig) => {
      if (!currentOrganization) throw new Error('Nenhuma organização selecionada');

      const { data, error } = await supabase
        .from('sync_config')
        .upsert({
          ...config,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'user_id,sync_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-config', currentOrganization?.id] });
      toast.success('Configuração de sincronização salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  });
};

// Hook para logs de sincronização filtrados por organização
export const useSyncLogs = (syncType?: string, limit = 50) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-logs', currentOrganization?.id, syncType, limit],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (syncType) {
        query = query.eq('sync_type', syncType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization
  });
};

// Hook para executar sincronização manual
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
      if (!currentOrganization) throw new Error('Nenhuma organização selecionada');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await supabase.functions.invoke('wc-sync', {
        body: {
          ...params,
          organization_id: currentOrganization.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar TODAS as queries relacionadas para forçar atualização
      queryClient.invalidateQueries({ 
        queryKey: ['supabase-products'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['supabase-categories'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['supabase-orders'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['supabase-customers'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['sync-logs'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['sync-config'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['sync-stats'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['sync-status'],
        refetchType: 'all'
      });

      // Aguardar um pouco antes de mostrar a mensagem para garantir que as queries foram atualizadas
      setTimeout(() => {
        if (data.success) {
          toast.success(`Sincronização concluída! ${data.items_processed} itens processados`);
        } else {
          toast.error(`Sincronização com falhas: ${data.message}`);
        }
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });
};

// Hook para obter estatísticas de sincronização filtradas por organização
export const useSyncStats = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return {
          products_count: 0,
          categories_count: 0,
          orders_count: 0,
          customers_count: 0,
          last_sync: null,
          active_configs: [],
          last_sync_time: null
        };
      }

      // Buscar contagem de produtos
      const { count: productsCount } = await supabase
        .from('wc_products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Buscar contagem de categorias
      const { count: categoriesCount } = await supabase
        .from('wc_product_categories')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Buscar contagem de pedidos
      const { count: ordersCount } = await supabase
        .from('wc_orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Buscar contagem de clientes
      const { count: customersCount } = await supabase
        .from('wc_customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Buscar última sincronização (pode não existir -> usar maybeSingle para evitar 406)
      const { data: lastSync, error: lastSyncError } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('operation', 'sync_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSyncError) {
        console.warn('[useSyncStats] lastSync maybeSingle error:', lastSyncError);
      }

      // Buscar configurações ativas
      const { data: activeConfigs, error: activeConfigsError } = await supabase
        .from('sync_config')
        .select('*')
        .eq('is_active', true);

      if (activeConfigsError) {
        console.warn('[useSyncStats] activeConfigs error:', activeConfigsError);
      }

      return {
        products_count: productsCount || 0,
        categories_count: categoriesCount || 0,
        orders_count: ordersCount || 0,
        customers_count: customersCount || 0,
        last_sync: lastSync || null,
        active_configs: activeConfigs || [],
        last_sync_time: lastSync?.created_at ? new Date(lastSync.created_at) : null
      };
    },
    enabled: !!currentOrganization,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0 // Não manter em cache
  });
};

// Hook para verificar se há sincronização em andamento
export const useSyncStatus = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['sync-status', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return { is_syncing: false };
      }

      // Pode não haver sync_started -> usar maybeSingle para evitar 406
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('operation', 'sync_started')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[useSyncStatus] sync_started maybeSingle error:', error);
      }

      if (!data) {
        return { is_syncing: false };
      }

      // Verificar se há um sync_completed correspondente (pode não existir ainda)
      const { data: completed, error: completedError } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('sync_type', data.sync_type)
        .in('operation', ['sync_completed', 'sync_error'])
        .gte('created_at', data.created_at)
        .limit(1)
        .maybeSingle();

      if (completedError) {
        console.warn('[useSyncStatus] completed maybeSingle error:', completedError);
      }

      return {
        is_syncing: !completed,
        current_sync: data,
        started_at: data.created_at
      };
    },
    enabled: !!currentOrganization,
    refetchInterval: 5000 // Verificar a cada 5 segundos
  });
};

// Utilitário para calcular tempo desde última sincronização
export const useTimeSinceLastSync = () => {
  const { data: stats } = useSyncStats();
  
  const getTimeSinceLastSync = () => {
    if (!stats?.last_sync_time) return 'Nunca sincronizado';
    
    const now = new Date();
    const lastSync = stats.last_sync_time;
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };
  
  return getTimeSinceLastSync();
};

// Orders hooks filtrados por organização
export const useSupabaseOrders = (page: number, search: string, status: string) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-orders', currentOrganization?.id, page, search, status],
    queryFn: async () => {
      if (!currentOrganization) {
        return { orders: [], total: 0, pages: 0 };
      }

      let query = supabase
        .from('wc_orders')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('date_created', { ascending: false });

      // Apply filters
      if (search) {
        query = query.or(`number.ilike.%${search}%,billing->>first_name.ilike.%${search}%,billing->>last_name.ilike.%${search}%,billing->>email.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply pagination
      const from = (page - 1) * 20;
      const to = from + 19;
      query = query.range(from, to);

      const { data: orders, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`);
      }

      return {
        orders: orders || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      };
    },
    enabled: !!currentOrganization,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useSupabaseAllOrders = (search: string, status: string) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-all-orders', currentOrganization?.id, search, status],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('wc_orders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('date_created', { ascending: false });

      // Apply filters
      if (search) {
        query = query.or(`number.ilike.%${search}%,billing->>first_name.ilike.%${search}%,billing->>last_name.ilike.%${search}%,billing->>email.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: orders, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`);
      }

      return orders || [];
    },
    enabled: !!currentOrganization,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseOrder = (id: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-order', currentOrganization?.id, id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      const { data: order, error } = await supabase
        .from('wc_orders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao buscar pedido: ${error.message}`);
      }

      return order;
    },
    enabled: !!id && !!currentOrganization,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

// Customers hooks filtrados por organização
export const useSupabaseCustomers = (page: number, search: string) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-customers', currentOrganization?.id, page, search],
    queryFn: async () => {
      if (!currentOrganization) {
        return { customers: [], total: 0, pages: 0 };
      }

      let query = supabase
        .from('wc_customers')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('date_created', { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * 20;
      const to = from + 19;
      query = query.range(from, to);

      const { data: customers, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      return {
        customers: customers || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      };
    },
    enabled: !!currentOrganization,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseAllCustomers = (search: string = '') => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-all-customers', currentOrganization?.id, search],
    queryFn: async () => {
      let query = supabase
        .from('wc_customers')
        .select('*')
        .order('first_name', { ascending: true });

      // Apply search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: customers, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      return customers || [];
    },
    enabled: !!currentOrganization,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseCustomer = (id: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-customer', currentOrganization?.id, id],
    queryFn: async () => {
      const { data: customer, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao buscar cliente: ${error.message}`);
      }

      return customer;
    },
    enabled: !!id && !!currentOrganization,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseBirthdayCustomers = (month?: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-birthday-customers', currentOrganization?.id, month],
    queryFn: async () => {
      const targetMonth = month || new Date().getMonth() + 1;
      
      const { data: customers, error } = await supabase
        .from('wc_customers')
        .select('*')
        .not('billing->>date_of_birth', 'is', null);

      if (error) {
        throw new Error(`Erro ao buscar aniversariantes: ${error.message}`);
      }

      // Filter by month on the client side since we need to extract month from JSON
      const birthdayCustomers = (customers || []).filter(customer => {
        const billing = customer.billing as any;
        if (billing?.date_of_birth) {
          const birthDate = new Date(billing.date_of_birth);
          return birthDate.getMonth() + 1 === targetMonth;
        }
        return false;
      });

      return birthdayCustomers;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
};

export function useSupabaseSync() {
  const { currentOrganization } = useOrganization();

  const logSyncOperation = async (
    syncType: string,
    operation: string,
    status: 'success' | 'error',
    message: string,
    details?: any,
    itemsProcessed = 0,
    itemsFailed = 0,
    durationMs?: number
  ) => {
    if (!currentOrganization) return;

    try {
      await supabase.from('sync_logs').insert({
        sync_type: syncType,
        operation,
        status,
        message,
        details: details || {},
        items_processed: itemsProcessed,
        items_failed: itemsFailed,
        duration_ms: durationMs,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        organization_id: currentOrganization.id,
      });
    } catch (error) {
      console.error('Erro ao salvar log de sincronização:', error);
    }
  };

  return {
    logSyncOperation,
  };
}
