
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export const useWooCommerceFilteredCategories = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['wc-product-categories', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      console.log('[useWooCommerceFilteredCategories] Fetching categories from Supabase...');
      
      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('[useWooCommerceFilteredCategories] Error:', error);
        throw error;
      }

      console.log(`[useWooCommerceFilteredCategories] Found ${data?.length || 0} categories`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWooCommerceFilteredProducts = (page = 1, perPage = 100, searchTerm = '') => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['wc-products-filtered', currentOrganization?.id, page, perPage, searchTerm],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      let query = supabase
        .from('wc_products')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization!.id);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('date_created', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (error) throw error;

      // Return just the products array to maintain compatibility
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useWooCommerceFilteredOrders = (page = 1, perPage = 100) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['wc-orders-filtered', currentOrganization?.id, page, perPage],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('wc_orders')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization!.id)
        .order('date_created', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (error) throw error;

      // Return just the orders array to maintain compatibility
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useWooCommerceFilteredCustomers = (page = 1, perPage = 100) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['wc-customers-filtered', currentOrganization?.id, page, perPage],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      // Since we don't have a wc_customers table, return empty array for now
      console.log('[useWooCommerceFilteredCustomers] No customers table available');
      return [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};
