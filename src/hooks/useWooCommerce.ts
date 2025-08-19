
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
    queryFn: async (): Promise<Webhook[]> => {
      if (!config || !currentOrganization) return [];

      try {
        const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
        // Buscar mais resultados por segurança
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar webhooks');
        }

        const data = await response.json();
        return data as Webhook[];
      } catch (error) {
        console.error('Erro ao buscar webhooks:', error);
        return [];
      }
    },
    enabled: !!config && !!currentOrganization,
    staleTime: 5 * 60 * 1000,
  });

  // Setup webhook - idempotente e completo
  const setupWebhook = useMutation({
    mutationFn: async () => {
      if (!config || !currentOrganization) throw new Error('Configuração ou organização não encontrada');

      const baseUrl = config.apiUrl.replace(/\/$/, '');
      const deliveryUrl = 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook';
      const desired: Array<{ name: string; topic: string }> = [
        { name: 'Stock Sync Webhook', topic: 'order.created' },
        { name: 'Stock Sync Webhook', topic: 'order.updated' },
        { name: 'Stock Sync Webhook', topic: 'order.refunded' },
        { name: 'Stock Sync Webhook', topic: 'product.updated' },
        { name: 'Customer Webhook - customer.created', topic: 'customer.created' },
      ];

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

      const listRes = await fetch(`${baseUrl}/wp-json/wc/v3/webhooks?per_page=100`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      if (!listRes.ok) {
        const errText = await listRes.text();
        throw new Error(`Falha ao listar webhooks: ${errText}`);
      }
      const existing: Webhook[] = await listRes.json();

      const ensureSingleWebhook = async (topic: string, name: string) => {
        // Webhooks existentes para o mesmo tópico e mesma URL de entrega
        const matches = existing.filter(w => w.topic === topic && w.delivery_url === deliveryUrl);

        // Se houver mais de um, apagar os extras
        if (matches.length > 1) {
          const extras = matches.slice(1);
          for (const w of extras) {
            await fetch(`${baseUrl}/wp-json/wc/v3/webhooks/${w.id}?force=true`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            });
          }
        }

        const current = matches[0];

        // Se não existir, criar
        if (!current) {
          const createRes = await fetch(`${baseUrl}/wp-json/wc/v3/webhooks`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name,
              topic,
              delivery_url: deliveryUrl,
              status: 'active'
            })
          });

          if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Falha ao criar webhook (${topic}): ${errText}`);
          }
          return;
        }

        // Se existir: garantir status ativo e nome correto
        const needsUpdate = current.status !== 'active' || current.name !== name;
        if (needsUpdate) {
          const updateRes = await fetch(`${baseUrl}/wp-json/wc/v3/webhooks/${current.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name,
              status: 'active',
              delivery_url: deliveryUrl
            })
          });

          if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error(`Falha ao atualizar webhook (${topic}): ${errText}`);
          }
        }
      };

      // Garantir cada tópico desejado
      for (const d of desired) {
        await ensureSingleWebhook(d.topic, d.name);
      }

      return true;
    },
    onSuccess: () => {
      webhooks.refetch();
      toast.success('Webhooks configurados/atualizados com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao configurar webhooks: ${error.message}`);
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

// Re-export all the operations from the new hook file
export * from './useWooCommerceOperations';
