
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, Globe, Activity, CheckCircle, Building2 } from 'lucide-react';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { WooCommerceConfig as WooCommerceConfigType } from '@/services/woocommerce';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

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

  // Exclusão de webhook com force=true para evitar erro 501
  const handleDeleteWebhookForce = async (id?: number | string) => {
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
        console.error('Erro ao deletar webhook (force=true):', text);
        toast.error('Falha ao remover webhook. Verifique logs.');
      } else {
        toast.success('Webhook removido com sucesso.');
        // Atualiza a lista
        webhooks.refetch();
      }
    } catch (err: any) {
      console.error('Erro inesperado ao remover webhook:', err);
      toast.error('Erro inesperado ao remover webhook.');
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
              Webhooks são configurados automaticamente para sincronização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webhooks.isLoading ? (
              <div className="text-center py-4">Carregando webhooks...</div>
            ) : webhooks.error ? (
              <div className="text-center py-4 text-destructive">
                Erro ao carregar webhooks
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.data && webhooks.data.length > 0 ? (
                  webhooks.data
                    .filter(webhook => webhook.delivery_url.includes('woocommerce-stock-webhook'))
                    .map((webhook) => (
                      <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {webhook.topic} - {webhook.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                            {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWebhookForce(webhook.id)}
                          >
                            Remover
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
            
            <div className="flex gap-2">
              <Button
                onClick={() => setupWebhook.mutate()}
                disabled={setupWebhook.isPending}
                className="flex-1"
              >
                {setupWebhook.isPending ? 'Criando...' : 'Criar/Recriar Webhook'}
              </Button>
              <Button
                variant="outline"
                onClick={() => webhooks.refetch()}
                disabled={webhooks.isRefetching}
                className="flex-1"
              >
                {webhooks.isRefetching ? 'Atualizando...' : 'Atualizar Status'}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div><strong>URL do Webhook:</strong></div>
              <div className="font-mono bg-muted p-2 rounded mt-1 break-all">
                https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook
              </div>
              <div className="mt-2">
                <div><strong>Eventos Monitorados:</strong></div>
                <div className="text-xs space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">order.created</Badge>
                  <Badge variant="secondary" className="text-xs">order.updated</Badge>
                  <Badge variant="secondary" className="text-xs">order.refunded</Badge>
                  <Badge variant="secondary" className="text-xs">product.updated</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
