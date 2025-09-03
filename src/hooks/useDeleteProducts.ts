import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export const useDeleteProducts = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: number[]) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      if (!productIds.length) {
        throw new Error('Nenhum produto selecionado');
      }

      const { data, error } = await supabase.functions.invoke('delete-products', {
        body: { 
          productIds,
          organizationId: currentOrganization.id 
        }
      });

      if (error) {
        console.error('Erro na exclusão dos produtos:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Exclusão de produtos concluída:', data);
      
      // Invalidar todas as queries relacionadas a produtos
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Produtos Excluídos",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error('Erro na exclusão dos produtos:', error);
      toast({
        title: "Erro na Exclusão",
        description: "Falha ao excluir produtos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};