
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, Globe, Activity, CheckCircle, Building2, Trash2, RefreshCw } from 'lucide-react';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { WooCommerceConfig as WooCommerceConfigType } from '@/services/woocommerce';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

// Configuração padrão dos webhooks necessários
const REQUIRED_WEBHOOKS = [
  {
    name: 'Stock Sync - Product Updated',
    topic: 'product.updated',
    delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
    status: 'active'
  },
  {
    name: 'Stock Sync - Order Created',
    topic: 'order.created', 
    delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
    status: 'active'
  },
  {
    name: 'Stock Sync - Order Updated',
    topic: 'order.updated',
    delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook', 
    status: 'active'
  },
  {
    name: 'Customer Sync - Customer Created',
    topic: 'customer.created',
    delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
    status: 'active'
  },
  {
    name: 'Customer Sync - Customer Updated', 
    topic: 'customer.updated',
    delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
    status: 'active'
  }
];

export const WooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();
  const { config, testConnection, saveConfig, isConfigured, webhooks, setupWebhook } = useWooCommerceConfig();
  
  const [wooSettings, setWooSettings] = useState<WooCommerceConfigType>({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: ''
  });

  useEffect(() => {
    if (config) {
      setWooSettings(config);
    }
  }, [config]);

  // Se não há organização selecionada, mostrar aviso
  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Activity className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">
            Selecione uma organização para configurar o WooCommerce
          </span>
        </div>
      </div>
    );
  }

  const handleTest = () => {
    if (!wooSettings.apiUrl || !wooSettings.consumerKey || !wooSettings.consumerSecret) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    testConnection.mutate(wooSettings);
  };

  const handleSave = () => {
    if (!wooSettings.apiUrl || !wooSettings.consumerKey || !wooSettings.consumerSecret) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveConfig(wooSettings);
  };

  // Função para deletar webhook individual
  const handleDeleteWebhook = async (id?: number | string) => {
    try {
      if (!id) return;
      if (!wooSettings.apiUrl || !wooSettings.consumerKey || !wooSettings.consumerSecret) {
        toast.error('Configure a URL e as chaves do WooCommerce antes.');
        return;
      }
      
      const auth = btoa(`${wooSettings.consumerKey}:${wooSettings.consumerSecret}`);
      const url = `${wooSettings.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks/${id}?force=true`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Erro ao deletar webhook:', text);
        toast.error('Falha ao remover webhook. Verifique logs.');
      } else {
        toast.success('Webhook removido com sucesso.');
        webhooks.refetch();
      }
    } catch (err: any) {
      console.error('Erro inesperado ao remover webhook:', err);
      toast.error('Erro inesperado ao remover webhook.');
    }
  };

  // Função para limpar todos os webhooks
  const handleCleanAllWebhooks = async () => {
    if (!webhooks.data || webhooks.data.length === 0) {
      toast.info('Nenhum webhook para limpar');
      return;
    }

    if (!confirm(`Tem certeza que deseja remover todos os ${webhooks.data.length} webhooks?`)) {
      return;
    }

    for (const webhook of webhooks.data) {
      await handleDeleteWebhook(webhook.id);
      // Pequena pausa entre deletions para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success('Todos os webhooks foram removidos');
  };

  // Função para criar webhooks corretos
  const handleCreateCorrectWebhooks = async () => {
    if (!wooSettings.apiUrl || !wooSettings.consumerKey || !wooSettings.consumerSecret) {
      toast.error('Configure as credenciais do WooCommerce primeiro');
      return;
    }

    try {
      const auth = btoa(`${wooSettings.consumerKey}:${wooSettings.consumerSecret}`);
      let created = 0;
      let errors = 0;

      for (const webhookConfig of REQUIRED_WEBHOOKS) {
        try {
          const response = await fetch(`${wooSettings.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookConfig)
          });

          if (response.ok) {
            created++;
            console.log(`Webhook criado: ${webhookConfig.name}`);
          } else {
            errors++;
            console.error(`Erro ao criar webhook ${webhookConfig.name}:`, await response.text());
          }
          
          // Pausa entre criações
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors++;
          console.error(`Erro ao criar webhook ${webhookConfig.name}:`, error);
        }
      }

      if (created > 0) {
        toast.success(`${created} webhooks criados com sucesso!`);
        webhooks.refetch();
      }
      
      if (errors > 0) {
        toast.warning(`${errors} webhooks falharam. Verifique os logs.`);
      }
    } catch (error) {
      console.error('Erro ao criar webhooks:', error);
      toast.error('Erro ao criar webhooks');
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Building2 className="w-5 h-5 text-blue-600" />
        <span className="text-blue-800 font-medium">
          Configurando para: {currentOrganization.name}
        </span>
      </div>

      {/* Status Header */}
      {isConfigured && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">WooCommerce conectado com sucesso!</span>
        </div>
      )}

      {/* Configuração Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Credenciais do WooCommerce
          </CardTitle>
          <CardDescription>
            Configure as credenciais para conectar com sua loja WooCommerce
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL da API *</Label>
            <Input
              id="apiUrl"
              placeholder="https://minhaloja.com.br"
              value={wooSettings.apiUrl}
              onChange={(e) => setWooSettings({ ...wooSettings, apiUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua loja (sem /wp-json/wc/v3/)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consumerKey">Consumer Key *</Label>
            <Input
              id="consumerKey"
              type="password"
              placeholder="ck_xxxxxxxxxx"
              value={wooSettings.consumerKey}
              onChange={(e) => setWooSettings({ ...wooSettings, consumerKey: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consumerSecret">Consumer Secret *</Label>
            <Input
              id="consumerSecret"
              type="password"
              placeholder="cs_xxxxxxxxxx"
              value={wooSettings.consumerSecret}
              onChange={(e) => setWooSettings({ ...wooSettings, consumerSecret: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTest} 
              className="flex-1 bg-gradient-success hover:opacity-90"
              disabled={testConnection.isPending}
            >
              {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button 
              onClick={handleSave}
              variant="outline"
              className="flex-1"
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Webhooks */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Webhooks para sincronização automática entre WooCommerce e o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status dos Webhooks */}
            {webhooks.isLoading ? (
              <div className="text-center py-4">Carregando webhooks...</div>
            ) : webhooks.error ? (
              <div className="text-center py-4 text-destructive">
                Erro ao carregar webhooks
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.data && webhooks.data.length > 0 ? (
                  webhooks.data.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{webhook.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {webhook.topic} - {webhook.delivery_url}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                          {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum webhook configurado
                  </div>
                )}
              </div>
            )}
            
            {/* Ações de Webhook */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCorrectWebhooks}
                  className="flex-1"
                  disabled={!isConfigured}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Criar Webhooks Corretos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => webhooks.refetch()}
                  disabled={webhooks.isRefetching}
                >
                  {webhooks.isRefetching ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
              
              {webhooks.data && webhooks.data.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleCleanAllWebhooks}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Todos os Webhooks
                </Button>
              )}
            </div>
            
            {/* Informações dos Webhooks */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div><strong>URL do Webhook:</strong></div>
              <div className="font-mono bg-muted p-2 rounded mt-1 break-all">
                https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook
              </div>
              <div className="mt-2">
                <div><strong>Webhooks Necessários:</strong></div>
                <div className="text-xs space-x-2 mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">product.updated</Badge>
                  <Badge variant="secondary" className="text-xs">order.created</Badge>
                  <Badge variant="secondary" className="text-xs">order.updated</Badge>
                  <Badge variant="secondary" className="text-xs">customer.created</Badge>
                  <Badge variant="secondary" className="text-xs">customer.updated</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
