import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

interface SyncProductDataRequest {
  productId: number;
  includeImages?: boolean;
  includeTags?: boolean;
  includeCategories?: boolean;
}

export const useSyncProductData = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      includeImages = true, 
      includeTags = true, 
      includeCategories = true 
    }: SyncProductDataRequest) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { data, error } = await supabase.functions.invoke('sync-product-data', {
        body: {
          productId,
          organizationId: currentOrganization.id,
          includeImages,
          includeTags,
          includeCategories,
        },
      });

      if (error) {
        console.error('Erro na sincronização:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Sincronização concluída:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      
      toast({
        title: "Sincronização Concluída",
        description: "Dados do produto sincronizados com o WooCommerce com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na Sincronização",
        description: error.message || "Não foi possível sincronizar os dados. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

// Hook for bulk sync
export const useBulkSyncProductData = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productIds, 
      includeImages = true, 
      includeTags = true, 
      includeCategories = true 
    }: {
      productIds: number[];
      includeImages?: boolean;
      includeTags?: boolean;
      includeCategories?: boolean;
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const productId of productIds) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-product-data', {
            body: {
              productId,
              organizationId: currentOrganization.id,
              includeImages,
              includeTags,
              includeCategories,
            },
          });

          if (error) throw error;
          
          results.push({ productId, success: true, data });
          successCount++;
        } catch (error) {
          results.push({ productId, success: false, error: error.message });
          failureCount++;
        }
      }

      return {
        results,
        successCount,
        failureCount,
        total: productIds.length,
      };
    },
    onSuccess: (data) => {
      console.log('Sincronização em lote concluída:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
      
      toast({
        title: "Sincronização em Lote Concluída",
        description: `${data.successCount}/${data.total} produtos sincronizados com sucesso!`,
      });
    },
    onError: (error: any) => {
      console.error('Erro na sincronização em lote:', error);
      toast({
        title: "Erro na Sincronização",
        description: error.message || "Não foi possível sincronizar os produtos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};