import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export interface ProductTag {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  wc_tag_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductTagRelation {
  id: string;
  product_id: number;
  tag_id: string;
  created_at: string;
}

export const useProductTags = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['product-tags', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('product_tags')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ProductTag[];
    },
    enabled: !!currentOrganization,
  });
};

export const useProductTagsByProduct = (productId: number) => {
  return useQuery({
    queryKey: ['product-tags', 'product', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_tag_relations')
        .select(`
          id,
          tag:product_tags (*)
        `)
        .eq('product_id', productId);

      if (error) throw error;
      return (data || [])
        .map((relation: any) => relation.tag as ProductTag)
        .filter((tag: ProductTag | null): tag is ProductTag => tag !== null);
    },
    enabled: !!productId,
  });
};

export const useCreateProductTag = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: Omit<ProductTag, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('product_tags')
        .insert({
          ...tagData,
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast({
        title: "Tag criada",
        description: "Tag criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tag",
        description: "Não foi possível criar a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProductTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, tagIds }: { productId: number; tagIds: string[] }) => {
      // First, remove existing tag relations
      await supabase
        .from('product_tag_relations')
        .delete()
        .eq('product_id', productId);

      // Then add new tag relations
      if (tagIds.length > 0) {
        const relations = tagIds.map(tagId => ({
          product_id: productId,
          tag_id: tagId,
        }));

        const { error } = await supabase
          .from('product_tag_relations')
          .insert(relations);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast({
        title: "Tags atualizadas",
        description: "Tags do produto atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tags",
        description: "Não foi possível atualizar as tags. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProductTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      toast({
        title: "Tag excluída",
        description: "Tag excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tag",
        description: "Não foi possível excluir a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};