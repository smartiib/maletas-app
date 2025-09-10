import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export interface ProductCategory {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  wc_category_id?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProductCategories = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['product-categories', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: !!currentOrganization,
  });
};

export const useCreateProductCategory = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: Omit<ProductCategory, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          ...categoryData,
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast({
        title: "Categoria criada",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ProductCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast({
        title: "Categoria excluída",
        description: "Categoria excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};