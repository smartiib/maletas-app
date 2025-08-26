
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

type SupabaseProductStock = {
  id: number;
  stock_quantity: number | null;
  stock_status: string | null;
  organization_id?: string;
};

export const useSupabaseProductStock = (productId?: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['supabase-product-stock', currentOrganization?.id, productId],
    enabled: !!currentOrganization?.id && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wc_products')
        .select('id, stock_quantity, stock_status, organization_id')
        .eq('id', productId as number)
        .maybeSingle<SupabaseProductStock>();

      if (error) {
        console.error('[useSupabaseProductStock] Erro ao buscar estoque no Supabase:', error);
        return null;
      }

      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
};
