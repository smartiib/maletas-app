import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export interface ProductImage {
  id: string;
  organization_id: string;
  product_id: number;
  image_url: string;
  storage_path?: string;
  alt_text?: string;
  is_featured: boolean;
  display_order: number;
  wc_image_id?: number;
  created_at: string;
  updated_at: string;
}

export const useProductImages = (productId?: number) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['product-images', currentOrganization?.id, productId],
    queryFn: async () => {
      if (!currentOrganization || !productId) return [];

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!currentOrganization && !!productId,
  });
};

export const useUploadProductImage = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      productId, 
      altText, 
      isFeatured = false 
    }: { 
      file: File; 
      productId: number; 
      altText?: string; 
      isFeatured?: boolean; 
    }) => {
      if (!currentOrganization) throw new Error('No organization selected');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrganization.id}/${productId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Get current max display order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingImages?.[0]?.display_order ? existingImages[0].display_order + 1 : 0;

      // If this is set as featured, remove featured from other images
      if (isFeatured) {
        await supabase
          .from('product_images')
          .update({ is_featured: false })
          .eq('product_id', productId);
      }

      // Save image record to database
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          organization_id: currentOrganization.id,
          product_id: productId,
          image_url: publicUrl,
          storage_path: fileName,
          alt_text: altText,
          is_featured: isFeatured,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: "Imagem enviada",
        description: "Imagem do produto enviada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      productId, 
      ...updateData 
    }: Partial<ProductImage> & { id: string; productId?: number }) => {
      // If setting as featured, remove featured from other images of the same product
      if (updateData.is_featured && productId) {
        await supabase
          .from('product_images')
          .update({ is_featured: false })
          .eq('product_id', productId)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('product_images')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: "Imagem atualizada",
        description: "Imagem atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar imagem",
        description: "Não foi possível atualizar a imagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get image data to delete from storage
      const { data: image } = await supabase
        .from('product_images')
        .select('storage_path')
        .eq('id', id)
        .single();

      // Delete from storage if path exists
      if (image?.storage_path) {
        await supabase.storage
          .from('product-images')
          .remove([image.storage_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: "Imagem excluída",
        description: "Imagem excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir imagem",
        description: "Não foi possível excluir a imagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useReorderProductImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (images: { id: string; display_order: number }[]) => {
      const updates = images.map(({ id, display_order }) =>
        supabase
          .from('product_images')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: "Ordem atualizada",
        description: "Ordem das imagens atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível reordenar as imagens. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};