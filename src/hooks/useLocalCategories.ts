import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Types
export interface LocalCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parent?: number;
  count?: number;
  image?: any;
  display?: string;
  menu_order?: number;
  organization_id?: string;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch all categories
export const useLocalCategories = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-categories', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) {
        console.error('Erro ao buscar categorias locais:', error);
        throw error;
      }

      return data as LocalCategory[] || [];
    },
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos - categorias mudam menos
  });
};

// Fetch single category
export const useLocalCategory = (categoryId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-category', categoryId, currentOrganization?.id],
    queryFn: async () => {
      if (!categoryId || !currentOrganization) return null;

      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('id', categoryId)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar categoria local:', error);
        throw error;
      }

      return data as LocalCategory;
    },
    enabled: !!categoryId && !!currentOrganization,
  });
};

// Create category
export const useCreateLocalCategory = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (categoryData: Omit<LocalCategory, 'id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Generate a temporary ID
      const tempId = Math.floor(Math.random() * 1000000) + Date.now();
      
      const newCategory = {
        ...categoryData,
        id: tempId,
        organization_id: currentOrganization.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        count: 0,
        display: categoryData.display || 'default',
        menu_order: categoryData.menu_order || 0,
      };

      // Insert into local database
      const { data, error } = await supabase
        .from('wc_product_categories')
        .insert(newCategory)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'category',
          entity_id: data.id,
          operation: 'create',
          data: newCategory,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-categories'] });
      toast.success('Categoria criada localmente e agendada para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar categoria', {
        description: error.message,
      });
    },
  });
};

// Update category
export const useUpdateLocalCategory = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocalCategory> }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      const updatedData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Update in local database
      const { data: result, error } = await supabase
        .from('wc_product_categories')
        .update(updatedData)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar categoria local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'category',
          entity_id: id,
          operation: 'update',
          data: { id, ...updatedData },
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-categories'] });
      queryClient.invalidateQueries({ queryKey: ['local-category'] });
      toast.success('Categoria atualizada localmente e agendada para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar categoria', {
        description: error.message,
      });
    },
  });
};

// Delete category
export const useDeleteLocalCategory = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Get category data before deletion for sync queue
      const { data: categoryData } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('id', categoryId)
        .eq('organization_id', currentOrganization.id)
        .single();

      // Check if category has products
      const { data: products } = await supabase
        .from('wc_products')
        .select('id')
        .contains('categories', [{ id: categoryId }])
        .limit(1);

      if (products && products.length > 0) {
        throw new Error('Não é possível excluir categoria que possui produtos associados');
      }

      // Delete from local database
      const { error } = await supabase
        .from('wc_product_categories')
        .delete()
        .eq('id', categoryId)
        .eq('organization_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao deletar categoria local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'category',
          entity_id: categoryId,
          operation: 'delete',
          data: categoryData || {},
        });

      return categoryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-categories'] });
      toast.success('Categoria removida localmente e agendada para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover categoria', {
        description: error.message,
      });
    },
  });
};

// Get category tree (hierarchical structure)
export const useLocalCategoryTree = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-category-tree', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('parent', { ascending: true })
        .order('menu_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar árvore de categorias:', error);
        throw error;
      }

      // Build hierarchical structure
      const categories = data || [];
      const categoryMap = new Map();
      const roots: any[] = [];

      // First pass: create category map
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build tree
      categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id);
        
        if (category.parent && categoryMap.has(category.parent)) {
          const parent = categoryMap.get(category.parent);
          parent.children.push(categoryWithChildren);
        } else {
          roots.push(categoryWithChildren);
        }
      });

      return roots;
    },
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Get categories by parent
export const useLocalCategoriesByParent = (parentId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-categories-by-parent', parentId, currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('wc_product_categories')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('menu_order')
        .order('name');

      if (parentId) {
        query = query.eq('parent', parentId);
      } else {
        query = query.is('parent', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar categorias por parent:', error);
        throw error;
      }

      return data as LocalCategory[] || [];
    },
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};