
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface DbVariation {
  id: number;
  parent_id: number;
  sku?: string | null;
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  stock_quantity?: number | null;
  stock_status?: string | null;
  attributes?: Array<any> | null;
  image?: any | null;
  description?: string | null;
}

export const useProductVariations = (parentId?: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['wc-variations', currentOrganization?.id, parentId],
    queryFn: async (): Promise<DbVariation[]> => {
      if (!currentOrganization || !parentId) return [];

      const { data, error } = await supabase
        .from('wc_product_variations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('parent_id', parentId)
        .order('id', { ascending: true });

      if (error) {
        console.error('[useProductVariations] Erro ao buscar variações:', error);
        return [];
      }

      console.log('[useProductVariations] Variações carregadas:', {
        parentId,
        count: data?.length || 0,
      });

      return (data || []) as DbVariation[];
    },
    enabled: !!currentOrganization && !!parentId,
    staleTime: 10000,
  });
};
