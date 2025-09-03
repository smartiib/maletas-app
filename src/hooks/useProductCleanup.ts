import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from '@/hooks/use-toast';

export const useProductCleanup = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { data, error } = await supabase.functions.invoke('cleanup-products', {
        body: { organizationId: currentOrganization.id }
      });

      if (error) {
        console.error('Erro na limpeza dos produtos:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Limpeza de produtos concluída:', data);
      
      // Invalidar todas as queries relacionadas a produtos
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['wc-products'] });
      
      toast({
        title: "Limpeza Concluída",
        description: `Produtos USC removidos e organization_id corrigido. Total de produtos: ${data.finalProductCount}`,
      });
    },
    onError: (error) => {
      console.error('Erro na limpeza dos produtos:', error);
      toast({
        title: "Erro na Limpeza",
        description: "Falha ao limpar produtos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};