

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
        .eq('organization_id', currentOrganization.id) // buscar somente da org atual
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
        .eq('organization_id', currentOrganization.id) // somente da org atual
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
        .eq('organization_id', currentOrganization.id) // somente da org atual
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

      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id) // somente da org atual
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

