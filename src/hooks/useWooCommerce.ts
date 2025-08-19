
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

interface Webhook {
  id: number;
  name: string;
  status: string;
  topic: string;
  delivery_url: string;
}

export const useWooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Buscar configuração específica da organização
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      const { data, error } = await supabase
        .from('user_configurations')
        .select('config_data')
        .eq('config_type', 'woocommerce')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuração:', error);
        return null;
      }

      return data?.config_data as WooCommerceConfig | null;
    },
    enabled: !!currentOrganization,
  });

  // Testar conexão
  const testConnection = useMutation({
    mutationFn: async (config: WooCommerceConfig) => {
      if (!currentOrganization) throw new Error('Nenhuma organização selecionada');

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Falha na conexão com WooCommerce');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Conexão testada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro na conexão: ${error.message}`);
    },
  });

  // Salvar configuração específica da organização
  const saveConfig = async (newConfig: WooCommerceConfig) => {
    if (!currentOrganization) {
      toast.error('Nenhuma organização selecionada');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.user.id,
          config_type: 'woocommerce',
          config_data: newConfig,
          is_active: true
        }, {
          onConflict: 'user_id,config_type'
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['woocommerce-config', currentOrganization.id] });
      toast.success('Configuração salva com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  };

  // Buscar webhooks
  const webhooks = useQuery({
    queryKey: ['woocommerce-webhooks', currentOrganization?.id],
    queryFn: async () => {
      if (!config || !currentOrganization) return [];

      try {
        const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar webhooks');
        }

        return response.json() as Webhook[];
      } catch (error) {
        console.error('Erro ao buscar webhooks:', error);
        return [];
      }
    },
    enabled: !!config && !!currentOrganization,
    staleTime: 5 * 60 * 1000,
  });

  // Setup webhook
  const setupWebhook = useMutation({
    mutationFn: async () => {
      if (!config || !currentOrganization) throw new Error('Configuração ou organização não encontrada');

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const webhookData = {
        name: 'Stock Sync Webhook',
        topic: 'order.updated',
        delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
        status: 'active'
      };

      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Falha ao criar webhook: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      webhooks.refetch();
      toast.success('Webhook configurado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao configurar webhook: ${error.message}`);
    },
  });

  const isConfigured = !!config?.apiUrl && !!config?.consumerKey && !!config?.consumerSecret;

  return {
    config,
    isConfigured,
    configLoading,
    testConnection,
    saveConfig,
    webhooks,
    setupWebhook,
  };
};
