import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export const useImportJewelryMeta = () => {
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id) {
        throw new Error('Organization not found');
      }
      
      const { data, error } = await supabase.functions.invoke('import-jewelry-meta', {
        body: { organization_id: currentOrganization.id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Importação concluída! ${data.imported} produtos importados.`);
      if (data.errors > 0) {
        toast.warning(`${data.errors} produtos tiveram erros durante a importação.`);
      }
    },
    onError: (error) => {
      console.error('Error importing jewelry meta:', error);
      toast.error('Erro ao importar dados de joias do WooCommerce');
    },
  });
};