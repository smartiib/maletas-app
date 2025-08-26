
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

export const useWooCommerceFilteredProducts = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['wc-products-filtered', currentOrganization?.id, isConfigured],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('wc_products')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredOrders = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['wc-orders-filtered', currentOrganization?.id, isConfigured],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('wc_orders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('date_created', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredCustomers = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['wc-customers-filtered', currentOrganization?.id, isConfigured],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('first_name');

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredCategories = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['wc-categories-filtered', currentOrganization?.id, isConfigured],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      // Usar wc_product_categories diretamente (não wc_categories que é uma view)
      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Novo hook para buscar logs de sync (corrigindo erro 400)
export const useLastSyncStatus = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['last-sync-status', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      // Buscar último log ordenado por data, sem filtros problemáticos
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar status do sync:', error);
        return null;
      }

      return data;
    },
    enabled: !!currentOrganization,
    staleTime: 30 * 1000, // 30 segundos
  });
};

// Novo hook para buscar configuração de sync (corrigindo erro 404)
export const useSyncConfig = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['sync-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      // Usar sync_configs (não sync_config)
      const { data, error } = await supabase
        .from('sync_configs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar config do sync:', error);
        return null;
      }

      return data;
    },
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
