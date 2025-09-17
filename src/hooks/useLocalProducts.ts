import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Types
export interface LocalProduct {
  id: number;
  name: string;
  sku: string;
  slug?: string;
  type?: string;
  status?: string;
  featured?: boolean;
  description?: string;
  short_description?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  on_sale?: boolean;
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: string;
  backorders?: string;
  categories?: any[];
  tags?: any[];
  images?: any[];
  attributes?: any[];
  variations?: any[];
  meta_data?: any[];
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
  weight?: string;
  dimensions?: any;
  permalink?: string;
}

// Fetch all products
export const useLocalProducts = (filters?: { 
  search?: string; 
  category?: string; 
  status?: string;
  page?: number;
  perPage?: number;
}) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-products', currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('wc_products')
        .select('*')
        .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
        .order('name');

      // Apply filters
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Pagination
      if (filters?.page && filters?.perPage) {
        const from = (filters.page - 1) * filters.perPage;
        const to = from + filters.perPage - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar produtos locais:', error);
        throw error;
      }

      return data as LocalProduct[] || [];
    },
    enabled: !!currentOrganization,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Fetch single product
export const useLocalProduct = (productId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-product', productId, currentOrganization?.id],
    queryFn: async () => {
      if (!productId || !currentOrganization) return null;

      const { data, error } = await supabase
        .from('wc_products')
        .select('*')
        .eq('id', productId)
        .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar produto local:', error);
        throw error;
      }

      return data as LocalProduct;
    },
    enabled: !!productId && !!currentOrganization,
  });
};

// Create product
export const useCreateLocalProduct = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (productData: Omit<LocalProduct, 'id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Generate a temporary ID for local storage
      const tempId = Math.floor(Math.random() * 1000000) + Date.now();
      
      const newProduct = {
        ...productData,
        id: tempId,
        organization_id: currentOrganization.id,
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
        status: productData.status || 'draft',
        type: productData.type || 'simple',
        manage_stock: productData.manage_stock || false,
        stock_status: productData.stock_status || 'instock',
      };

      // Insert into local database
      const { data, error } = await supabase
        .from('wc_products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar produto local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'product',
          entity_id: data.id,
          operation: 'create',
          data: newProduct,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
      toast.success('Produto criado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar produto', {
        description: error.message,
      });
    },
  });
};

// Update product
export const useUpdateLocalProduct = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocalProduct> }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      const updatedData = {
        ...data,
        date_modified: new Date().toISOString(),
      };

      // Update in local database
      const { data: result, error } = await supabase
        .from('wc_products')
        .update(updatedData)
        .eq('id', id)
        .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'product',
          entity_id: id,
          operation: 'update',
          data: { id, ...updatedData },
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
      queryClient.invalidateQueries({ queryKey: ['local-product'] });
      toast.success('Produto atualizado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar produto', {
        description: error.message,
      });
    },
  });
};

// Update product stock
export const useUpdateLocalProductStock = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      id, 
      stock_quantity, 
      variationId 
    }: { 
      id: number; 
      stock_quantity: number; 
      variationId?: number;
    }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      if (variationId) {
        // Update variation stock
        const { data: result, error } = await supabase
          .from('wc_product_variations')
          .update({ 
            stock_quantity,
            date_modified: new Date().toISOString(),
          })
          .eq('id', variationId)
          .eq('parent_id', id)
          .select()
          .single();

        if (error) throw error;

        // Add to sync queue for variation
        await supabase
          .from('sync_queue')
          .insert({
            organization_id: currentOrganization.id,
            entity_type: 'product',
            entity_id: id,
            operation: 'update',
            data: { id, variationId, stock_quantity },
          });

        return result;
      } else {
        // Update main product stock
        const { data: result, error } = await supabase
          .from('wc_products')
          .update({ 
            stock_quantity,
            date_modified: new Date().toISOString(),
          })
          .eq('id', id)
          .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
          .select()
          .single();

        if (error) throw error;

        // Add to sync queue
        await supabase
          .from('sync_queue')
          .insert({
            organization_id: currentOrganization.id,
            entity_type: 'product',
            entity_id: id,
            operation: 'update',
            data: { id, stock_quantity },
          });

        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
      queryClient.invalidateQueries({ queryKey: ['local-product'] });
      toast.success('Estoque atualizado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar estoque', {
        description: error.message,
      });
    },
  });
};

// Delete product
export const useDeleteLocalProduct = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (productId: number) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Get product data before deletion for sync queue
      const { data: productData } = await supabase
        .from('wc_products')
        .select('*')
        .eq('id', productId)
        .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
        .single();

      // Mark as deleted (soft delete by changing status)
      const { error } = await supabase
        .from('wc_products')
        .update({ 
          status: 'trash',
          date_modified: new Date().toISOString()
        })
        .eq('id', productId)
        .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`);

      if (error) {
        console.error('Erro ao deletar produto local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'product',
          entity_id: productId,
          operation: 'delete',
          data: productData || {},
        });

      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-products'] });
      toast.success('Produto removido localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover produto', {
        description: error.message,
      });
    },
  });
};

// Get product variations
export const useLocalProductVariations = (productId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-product-variations', productId, currentOrganization?.id],
    queryFn: async () => {
      if (!productId || !currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_product_variations')
        .select('*')
        .eq('parent_id', productId)
        .order('id');

      if (error) {
        console.error('Erro ao buscar variações locais:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!productId && !!currentOrganization,
  });
};