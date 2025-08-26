
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { logger } from '@/services/logger';

interface SaveProductLocalData {
  name: string;
  sku?: string;
  regular_price: string;
  sale_price?: string;
  status: string;
  description?: string;
  short_description?: string;
  supplier_id?: string;
  category_id?: string;
}

export const useSaveProductLocal = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: SaveProductLocalData }) => {
      console.log(`[useSaveProductLocal] Saving product ${productId} to Supabase:`, data);

      if (!currentOrganization?.id) {
        throw new Error('Organization not found');
      }

      // Prepare update data (excluding stock fields)
      const updateData: any = {
        name: data.name,
        sku: data.sku || null,
        regular_price: data.regular_price ? parseFloat(data.regular_price) : null,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        status: data.status,
        description: data.description || null,
        short_description: data.short_description || null,
        updated_at: new Date().toISOString(),
      };

      // Handle supplier metadata
      if (data.supplier_id) {
        updateData.meta_data = [
          { key: 'supplier_id', value: data.supplier_id }
        ];
      }

      // Handle category
      if (data.category_id) {
        updateData.categories = [{ id: parseInt(data.category_id) }];
      }

      const { data: updatedProduct, error } = await supabase
        .from('wc_products')
        .update(updateData)
        .eq('id', productId)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) {
        console.error('[useSaveProductLocal] Error updating product:', error);
        throw error;
      }

      console.log(`[useSaveProductLocal] Product ${productId} saved successfully`);
      return updatedProduct;
    },
    onSuccess: (data) => {
      // Invalidate product queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-product-stock'] });
      
      logger.success('Produto Salvo', 'Produto foi salvo localmente com sucesso');
    },
    onError: (error) => {
      console.error('[useSaveProductLocal] Error:', error);
      logger.error('Erro ao Salvar', 'Erro ao salvar produto localmente');
    },
  });
};
