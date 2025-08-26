
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, TestTube2 } from 'lucide-react';
import { useWooCommerceConfig, useSaveWooCommerceConfig } from '@/hooks/useWooCommerce';

export const WooCommerceConfig: React.FC = () => {
  const { config, isLoading } = useWooCommerceConfig();
  const saveConfig = useSaveWooCommerceConfig();
  
  const [formData, setFormData] = useState({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: ''
  });

  React.useEffect(() => {
    if (config && !isLoading) {
      setFormData({
        apiUrl: config.apiUrl || '',
        consumerKey: config.consumerKey || '',
        consumerSecret: config.consumerSecret || ''
      });
    }
  }, [config, isLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.apiUrl || !formData.consumerKey || !formData.consumerSecret) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    try {
      await saveConfig.mutateAsync(formData);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const testConnection = async () => {
    if (!formData.apiUrl || !formData.consumerKey || !formData.consumerSecret) {
      alert('Preencha todos os campos antes de testar a conexão');
      return;
    }

    // Aqui você pode implementar um teste de conexão se desejar
    alert('Funcionalidade de teste em desenvolvimento');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração WooCommerce</CardTitle>
        <CardDescription>
          Configure as credenciais para integração com sua loja WooCommerce.
          Essas configurações serão compartilhadas com todos os usuários da organização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL da API</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://minhaloja.com.br/"
              value={formData.apiUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consumerKey">Consumer Key</Label>
            <Input
              id="consumerKey"
              type="text"
              placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.consumerKey}
              onChange={(e) => setFormData(prev => ({ ...prev, consumerKey: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consumerSecret">Consumer Secret</Label>
            <Input
              id="consumerSecret"
              type="password"
              placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.consumerSecret}
              onChange={(e) => setFormData(prev => ({ ...prev, consumerSecret: e.target.value }))}
              required
            />
          </div>

          {config.isConfigured && (
            <Alert>
              <AlertDescription>
                Configuração WooCommerce ativa. Todos os usuários da organização podem usar estas credenciais para sincronização.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saveConfig.isPending}
              className="flex items-center gap-2"
            >
              {saveConfig.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Configurações
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              className="flex items-center gap-2"
            >
              <TestTube2 className="h-4 w-4" />
              Testar Conexão
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
