
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

type SupabaseProductStock = {
  id: number;
  stock_quantity: number | null;
  stock_status: string | null;
  organization_id?: string;
};

export const useSupabaseProductStock = (productId?: number, forceRefresh = false) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-product-stock', currentOrganization?.id, productId],
    enabled: !!currentOrganization?.id && !!productId,
    queryFn: async () => {
      console.log(`[useSupabaseProductStock] Fetching stock for product ${productId}`);
      
      const { data, error } = await supabase
        .from('wc_products')
        .select('id, stock_quantity, stock_status, organization_id')
        .eq('id', productId as number)
        .maybeSingle<SupabaseProductStock>();

      if (error) {
        console.error('[useSupabaseProductStock] Erro ao buscar estoque no Supabase:', error);
        return null;
      }

      console.log(`[useSupabaseProductStock] Stock data for product ${productId}:`, data);
      return data;
    },
    staleTime: forceRefresh ? 0 : 30 * 1000, // Force refresh or 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Hook to invalidate stock data after updates
export const useRefreshProductStock = () => {
  const queryClient = useQueryClient();
  
  return (productId: number) => {
    console.log(`[useRefreshProductStock] Invalidating stock cache for product ${productId}`);
    queryClient.invalidateQueries({
      queryKey: ['supabase-product-stock']
    });
  };
};
