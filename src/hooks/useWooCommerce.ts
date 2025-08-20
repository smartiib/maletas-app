
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

  // Buscar configuração específica da organização/usuário
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      // Verificar se há usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Nenhum usuário autenticado encontrado - usando fallback localStorage');
        const localKey = `woocommerce_config_${currentOrganization.id}`;
        const raw = localStorage.getItem(localKey);
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw) as WooCommerceConfig | null;
          console.log('Configuração (localStorage) encontrada:', parsed);
          return parsed;
        } catch (e) {
          console.warn('Falha ao ler configuração do localStorage:', e);
          return null;
        }
      }

      console.log('Buscando configuração WooCommerce para usuário:', user.id);

      const { data, error } = await supabase
        .from('user_configurations')
        .select('config_data')
        .eq('config_type', 'woocommerce')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuração:', error);
        return null;
      }

      console.log('Configuração encontrada:', data);
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

  // Salvar configuração específica da organização/usuário
  const saveConfig = async (newConfig: WooCommerceConfig) => {
    if (!currentOrganization) {
      toast.error('Nenhuma organização selecionada');
      return;
    }

    // Tenta usar Supabase se houver sessão; caso contrário salva no localStorage (por organização)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const localKey = `woocommerce_config_${currentOrganization.id}`;
      localStorage.setItem(localKey, JSON.stringify(newConfig));
      // Atualiza cache para refletir na UI e liberar a seção de webhooks
      queryClient.setQueryData(['woocommerce-config', currentOrganization.id], newConfig);
      queryClient.invalidateQueries({ queryKey: ['woocommerce-webhooks', currentOrganization.id] });
      toast.success('Configuração salva localmente para esta organização!');
      return;
    }

    try {
      console.log('Salvando configuração WooCommerce para usuário:', user.id);

      const { error } = await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.id,
          config_type: 'woocommerce',
          config_data: newConfig,
          is_active: true
        }, {
          onConflict: 'user_id,config_type'
        });

      if (error) {
        console.error('Erro ao salvar configuração:', error);
        throw error;
      }

      console.log('Configuração salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['woocommerce-config', currentOrganization.id] });
      toast.success('Configuração salva com sucesso!');
    } catch (error: any) {
      console.error('Erro completo ao salvar configuração:', error);
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  };

  // Buscar webhooks
  const webhooks = useQuery({
    queryKey: ['woocommerce-webhooks', currentOrganization?.id, config],
    queryFn: async (): Promise<Webhook[]> => {
      if (!config || !currentOrganization) {
        console.log('Config ou organização não disponível para buscar webhooks');
        return [];
      }

      try {
        const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Erro ao buscar webhooks:', response.status);
          throw new Error('Falha ao buscar webhooks');
        }

        const data = await response.json();
        console.log('Webhooks encontrados:', data);
        return data as Webhook[];
      } catch (error) {
        console.error('Erro ao buscar webhooks:', error);
        return [];
      }
    },
    enabled: !!config && !!currentOrganization && !!config.apiUrl && !!config.consumerKey && !!config.consumerSecret,
    staleTime: 5 * 60 * 1000,
  });

  // Setup webhook - corrigido para remover order.refunded inválido
  const setupWebhook = useMutation({
    mutationFn: async () => {
      if (!config || !currentOrganization) throw new Error('Configuração ou organização não encontrada');

      const baseUrl = config.apiUrl.replace(/\/$/, '');
      const deliveryUrl = 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook';
      
      // Removido order.refunded que não é válido - reembolsos são capturados por order.updated
      const desired: Array<{ name: string; topic: string }> = [
        { name: 'Stock Sync Webhook', topic: 'order.created' },
        { name: 'Stock Sync Webhook', topic: 'order.updated' },
        { name: 'Stock Sync Webhook', topic: 'product.updated' },
        { name: 'Customer Webhook - customer.created', topic: 'customer.created' },
      ];

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

      // Buscar webhooks existentes
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
        // Encontrar webhooks existentes para o mesmo tópico e URL
        const matches = existing.filter(w => w.topic === topic && w.delivery_url === deliveryUrl);

        // Se houver mais de um, deletar os extras
        if (matches.length > 1) {
          const extras = matches.slice(1);
          for (const w of extras) {
            try {
              await fetch(`${baseUrl}/wp-json/wc/v3/webhooks/${w.id}?force=true`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Basic ${auth}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log(`Webhook duplicado removido: ${w.id}`);
            } catch (error) {
              console.warn(`Erro ao remover webhook duplicado ${w.id}:`, error);
            }
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
          
          console.log(`Webhook criado: ${topic}`);
          return;
        }

        // Se existir, garantir que está ativo e com nome correto
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
          
          console.log(`Webhook atualizado: ${topic}`);
        }
      };

      // Configurar cada webhook desejado
      for (const d of desired) {
        await ensureSingleWebhook(d.topic, d.name);
      }

      return true;
    },
    onSuccess: () => {
      webhooks.refetch();
      toast.success('Webhooks configurados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao configurar webhooks:', error);
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
