
import React, { useState } from 'react';
import { Settings as SettingsIcon, Store, CreditCard, Truck, Bell, Shield, Database, Palette, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Minha Loja',
    storeUrl: 'https://minhaloja.com',
    storeEmail: 'contato@minhaloja.com',
    storePhone: '(11) 99999-9999',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  });

  const [wooSettings, setWooSettings] = useState({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: '',
    webhookSecret: ''
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    lowStock: true,
    systemUpdates: false,
    customerMessages: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    pixEnabled: true,
    creditCardEnabled: true,
    boletoEnabled: false,
    paypalEnabled: false
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure as preferências do sistema e integrações
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações da Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nome da Loja</Label>
              <Input
                id="storeName"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storeUrl">URL da Loja</Label>
              <Input
                id="storeUrl"
                value={storeSettings.storeUrl}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeUrl: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email de Contato</Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeSettings.storeEmail}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storePhone">Telefone</Label>
              <Input
                id="storePhone"
                value={storeSettings.storePhone}
                onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
              />
            </div>
            
            <Button className="w-full bg-gradient-primary hover:opacity-90">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Integração WooCommerce */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Integração WooCommerce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                placeholder="https://suaurl.com/wp-json/wc/v3/"
                value={wooSettings.apiUrl}
                onChange={(e) => setWooSettings({ ...wooSettings, apiUrl: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consumerKey">Consumer Key</Label>
              <Input
                id="consumerKey"
                type="password"
                placeholder="ck_xxxxxxxxxx"
                value={wooSettings.consumerKey}
                onChange={(e) => setWooSettings({ ...wooSettings, consumerKey: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consumerSecret">Consumer Secret</Label>
              <Input
                id="consumerSecret"
                type="password"
                placeholder="cs_xxxxxxxxxx"
                value={wooSettings.consumerSecret}
                onChange={(e) => setWooSettings({ ...wooSettings, consumerSecret: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="webhook_secret"
                value={wooSettings.webhookSecret}
                onChange={(e) => setWooSettings({ ...wooSettings, webhookSecret: e.target.value })}
              />
            </div>
            
            <Button className="w-full bg-gradient-success hover:opacity-90">
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Métodos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>PIX</Label>
                <p className="text-sm text-slate-500">Habilitar pagamentos via PIX</p>
              </div>
              <Switch
                checked={paymentSettings.pixEnabled}
                onCheckedChange={(checked) => 
                  setPaymentSettings({ ...paymentSettings, pixEnabled: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cartão de Crédito</Label>
                <p className="text-sm text-slate-500">Aceitar cartões de crédito</p>
              </div>
              <Switch
                checked={paymentSettings.creditCardEnabled}
                onCheckedChange={(checked) => 
                  setPaymentSettings({ ...paymentSettings, creditCardEnabled: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Boleto Bancário</Label>
                <p className="text-sm text-slate-500">Gerar boletos bancários</p>
              </div>
              <Switch
                checked={paymentSettings.boletoEnabled}
                onCheckedChange={(checked) => 
                  setPaymentSettings({ ...paymentSettings, boletoEnabled: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>PayPal</Label>
                <p className="text-sm text-slate-500">Integração com PayPal</p>
              </div>
              <Switch
                checked={paymentSettings.paypalEnabled}
                onCheckedChange={(checked) => 
                  setPaymentSettings({ ...paymentSettings, paypalEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Novos Pedidos</Label>
                <p className="text-sm text-slate-500">Notificar sobre novos pedidos</p>
              </div>
              <Switch
                checked={notifications.newOrders}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, newOrders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Estoque Baixo</Label>
                <p className="text-sm text-slate-500">Alertas de produtos com pouco estoque</p>
              </div>
              <Switch
                checked={notifications.lowStock}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, lowStock: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Atualizações do Sistema</Label>
                <p className="text-sm text-slate-500">Notificações sobre atualizações</p>
              </div>
              <Switch
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, systemUpdates: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mensagens de Clientes</Label>
                <p className="text-sm text-slate-500">Notificar sobre mensagens de clientes</p>
              </div>
              <Switch
                checked={notifications.customerMessages}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, customerMessages: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button className="bg-gradient-primary hover:opacity-90">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
        <Button variant="outline">
          Restaurar Padrões
        </Button>
      </div>
    </div>
  );
};

export default Settings;
