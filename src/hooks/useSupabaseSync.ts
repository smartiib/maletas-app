import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Hook para buscar produtos do Supabase
export const useSupabaseProducts = (page = 1, search = '', status = '', category = '') => {
  return useQuery({
    queryKey: ['supabase-products', page, search, status, category],
    queryFn: async () => {
      let query = supabase
        .from('wc_products')
        .select('*', { count: 'exact' })
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
    enabled: true
  });
};

// Hook para buscar categorias do Supabase
export const useSupabaseCategories = () => {
  return useQuery({
    queryKey: ['supabase-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });
};

// Hook para configurações de sincronização
export const useSyncConfig = () => {
  return useQuery({
    queryKey: ['sync-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_config')
        .select('*')
        .order('sync_type');

      if (error) throw error;
      return data || [];
    }
  });
};

// Hook para salvar configuração de sincronização
export const useSaveSyncConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: SyncConfig) => {
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
      queryClient.invalidateQueries({ queryKey: ['sync-config'] });
      toast.success('Configuração de sincronização salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  });
};

// Hook para logs de sincronização
export const useSyncLogs = (syncType?: string, limit = 50) => {
  return useQuery({
    queryKey: ['sync-logs', syncType, limit],
    queryFn: async () => {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (syncType) {
        query = query.eq('sync_type', syncType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });
};

// Hook para executar sincronização manual
export const useManualSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sync_type: 'products' | 'categories' | 'full';
      config: {
        url: string;
        consumer_key: string;
        consumer_secret: string;
      };
      batch_size?: number;
      force_full_sync?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await supabase.functions.invoke('wc-sync', {
        body: params,
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
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-config'] });
      
      if (data.success) {
        toast.success(`Sincronização concluída! ${data.items_processed} itens processados`);
      } else {
        toast.error(`Sincronização com falhas: ${data.message}`);
      }
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });
};

// Hook para obter estatísticas de sincronização
export const useSyncStats = () => {
  return useQuery({
    queryKey: ['sync-stats'],
    queryFn: async () => {
      // Buscar contagem de produtos
      const { count: productsCount } = await supabase
        .from('wc_products')
        .select('*', { count: 'exact', head: true });

      // Buscar contagem de categorias
      const { count: categoriesCount } = await supabase
        .from('wc_product_categories')
        .select('*', { count: 'exact', head: true });

      // Buscar última sincronização
      const { data: lastSync } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('operation', 'sync_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Buscar configurações ativas
      const { data: activeConfigs } = await supabase
        .from('sync_config')
        .select('*')
        .eq('is_active', true);

      return {
        products_count: productsCount || 0,
        categories_count: categoriesCount || 0,
        last_sync: lastSync,
        active_configs: activeConfigs || [],
        last_sync_time: lastSync?.created_at ? new Date(lastSync.created_at) : null
      };
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
};

// Hook para verificar se há sincronização em andamento
export const useSyncStatus = () => {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('operation', 'sync_started')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) return { is_syncing: false };

      // Verificar se há um sync_completed correspondente
      const { data: completed } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('sync_type', data.sync_type)
        .in('operation', ['sync_completed', 'sync_error'])
        .gte('created_at', data.created_at)
        .limit(1)
        .single();

      return {
        is_syncing: !completed,
        current_sync: data,
        started_at: data.created_at
      };
    },
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

// Orders hooks
export const useSupabaseOrders = (page: number, search: string, status: string) => {
  return useQuery({
    queryKey: ['supabase-orders', page, search, status],
    queryFn: async () => {
      let query = supabase
        .from('wc_orders')
        .select('*', { count: 'exact' })
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useSupabaseAllOrders = (search: string, status: string) => {
  return useQuery({
    queryKey: ['supabase-all-orders', search, status],
    queryFn: async () => {
      let query = supabase
        .from('wc_orders')
        .select('*')
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseOrder = (id: number) => {
  return useQuery({
    queryKey: ['supabase-order', id],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from('wc_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao buscar pedido: ${error.message}`);
      }

      return order;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

// Customers hooks
export const useSupabaseCustomers = (page: number, search: string) => {
  return useQuery({
    queryKey: ['supabase-customers', page, search],
    queryFn: async () => {
      let query = supabase
        .from('wc_customers')
        .select('*', { count: 'exact' })
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseAllCustomers = (search: string = '') => {
  return useQuery({
    queryKey: ['supabase-all-customers', search],
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseCustomer = (id: number) => {
  return useQuery({
    queryKey: ['supabase-customer', id],
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
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useSupabaseBirthdayCustomers = (month?: number) => {
  return useQuery({
    queryKey: ['supabase-birthday-customers', month],
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