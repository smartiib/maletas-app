
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isConfigured: boolean;
}

export const useWooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();

  const { data: config, isLoading } = useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async (): Promise<WooCommerceConfig> => {
      if (!currentOrganization) {
        return {
          apiUrl: '',
          consumerKey: '',
          consumerSecret: '',
          isConfigured: false
        };
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('wc_base_url, wc_consumer_key, wc_consumer_secret')
        .eq('id', currentOrganization.id)
        .single();

      if (error) {
        console.error('Erro ao buscar configuração WooCommerce:', error);
        return {
          apiUrl: '',
          consumerKey: '',
          consumerSecret: '',
          isConfigured: false
        };
      }

      const isConfigured = !!(data?.wc_base_url && data?.wc_consumer_key && data?.wc_consumer_secret);

      return {
        apiUrl: data?.wc_base_url || '',
        consumerKey: data?.wc_consumer_key || '',
        consumerSecret: data?.wc_consumer_secret || '',
        isConfigured,
        url: data?.wc_base_url || '' // Para compatibilidade
      };
    },
    enabled: !!currentOrganization,
  });

  return {
    config: config || {
      apiUrl: '',
      consumerKey: '',
      consumerSecret: '',
      isConfigured: false
    },
    isConfigured: config?.isConfigured || false,
    isLoading
  };
};

export const useSaveWooCommerceConfig = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (config: {
      apiUrl: string;
      consumerKey: string;
      consumerSecret: string;
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          wc_base_url: config.apiUrl,
          wc_consumer_key: config.consumerKey,
          wc_consumer_secret: config.consumerSecret,
        })
        .eq('id', currentOrganization.id);

      if (error) {
        console.error('Erro ao salvar configuração WooCommerce:', error);
        throw new Error(error.message || 'Erro ao salvar configuração');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['woocommerce-config', currentOrganization?.id] 
      });
      toast.success('Configurações do WooCommerce salvas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  });
};
