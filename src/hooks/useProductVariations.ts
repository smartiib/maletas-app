
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
    queryKey: ['wc-variations', currentOrganization?.id ?? 'no-org', parentId],
    queryFn: async (): Promise<DbVariation[]> => {
      if (!parentId) return [];

      // Base da query: sempre por parent_id
      let query = supabase
        .from('wc_product_variations')
        .select('id,parent_id,sku,price,regular_price,sale_price,stock_quantity,stock_status,attributes,image,description')
        .eq('parent_id', parentId)
        .order('id', { ascending: true });

      // Incluir registros com organization_id nulo OU da organização atual
      if (currentOrganization?.id) {
        query = query.or(`organization_id.is.null,organization_id.eq.${currentOrganization.id}`);
      } else {
        // Enquanto a org não carrega, tentar trazer os nulos (política RLS permite SELECT quando organization_id IS NULL)
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useProductVariations] Erro ao buscar variações:', error);
        return [];
      }

      console.log('[useProductVariations] Variações carregadas:', {
        parentId,
        count: data?.length || 0,
        sample: data?.[0],
      });

      return (data || []) as DbVariation[];
    },
    // Buscar assim que tivermos o parentId, mesmo se a organização ainda não estiver disponível
    enabled: !!parentId,
    staleTime: 15000,
  });
};
