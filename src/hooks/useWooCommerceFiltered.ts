
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export const useWooCommerceFilteredProducts = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['wc-products-filtered', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
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
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredOrders = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['wc-orders-filtered', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
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
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredCustomers = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['wc-customers-filtered', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
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
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useWooCommerceFilteredCategories = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['wc-categories-filtered', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return [];
      }

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
    enabled: !!currentOrganization,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};
