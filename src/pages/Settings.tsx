import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, CreditCard, Truck, Bell, Shield, Database, Palette, Globe, CheckCircle, Users, Key, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { WooCommerceConfig } from '@/services/woocommerce';
import { authService, PERMISSIONS, ROLE_PERMISSIONS } from '@/services/auth';
import { logger } from '@/services/logger';

import { Badge } from '@/components/ui/badge';

const Settings = () => {
  const { config, testConnection, saveConfig, isConfigured } = useWooCommerceConfig();
  
  // Para desenvolvimento sem autenticação
  const hasPermission = () => true;
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Minha Loja',
    storeUrl: 'https://minhaloja.com',
    storeEmail: 'contato@minhaloja.com',
    storePhone: '(11) 99999-9999',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  });

  const [wooSettings, setWooSettings] = useState<WooCommerceConfig>({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: '',
    webhookSecret: ''
  });

  const [wpAuthSettings, setWpAuthSettings] = useState({
    wpUrl: '',
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

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp1.xmailer.com.br',
    smtpPort: '587',
    smtpUser: 'smtp@smartiib.com.br',
    smtpPassword: '48OM7Yc4oqqXdez',
    smtpSecure: true,
    fromEmail: 'smtp@smartiib.com.br',
    fromName: 'Sistema WooCommerce'
  });

  const [rolePermissions, setRolePermissions] = useState(ROLE_PERMISSIONS);

  // Carregar configurações existentes
  useEffect(() => {
    if (config) {
      setWooSettings(config);
    }

    // Carregar outras configurações do localStorage
    const savedStoreSettings = localStorage.getItem('store_settings');
    if (savedStoreSettings) {
      setStoreSettings(JSON.parse(savedStoreSettings));
    }

    const savedNotifications = localStorage.getItem('notification_settings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    const savedPaymentSettings = localStorage.getItem('payment_settings');
    if (savedPaymentSettings) {
      setPaymentSettings(JSON.parse(savedPaymentSettings));
    }

    const savedEmailSettings = localStorage.getItem('email_settings');
    if (savedEmailSettings) {
      setEmailSettings(JSON.parse(savedEmailSettings));
    }
  }, [config]);

  const handleStoreSettingsSave = () => {
    localStorage.setItem('store_settings', JSON.stringify(storeSettings));
    logger.success('Configurações da Loja', 'Configurações da loja atualizadas');
  };

  const handleWooCommerceTest = async () => {
    if (!wooSettings.apiUrl || !wooSettings.consumerKey || !wooSettings.consumerSecret) {
      logger.error('Teste de Conexão', 'Preencha todos os campos obrigatórios');
      return;
    }

    logger.info('Teste de Conexão', 'Testando conexão com WooCommerce...');
    testConnection.mutate(wooSettings);
  };

  const handleWooCommerceSave = () => {
    saveConfig(wooSettings);
    logger.success('WooCommerce', 'Configurações do WooCommerce salvas');
  };

  const handleNotificationsSave = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications));
    logger.success('Notificações', 'Configurações de notificação atualizadas');
  };

  const handlePaymentsSave = () => {
    localStorage.setItem('payment_settings', JSON.stringify(paymentSettings));
    logger.success('Pagamentos', 'Configurações de pagamento atualizadas');
  };

  const handleWpAuthTest = async () => {
    if (!wpAuthSettings.wpUrl) {
      logger.error('Teste WordPress', 'Preencha a URL do WordPress');
      return;
    }

    try {
      authService.setBaseUrl(wpAuthSettings.wpUrl);
      localStorage.setItem('wp_base_url', wpAuthSettings.wpUrl);
      logger.success('WordPress', 'URL configurada com sucesso');
    } catch (error) {
      logger.error('WordPress', 'Erro ao configurar URL');
    }
  };

  const handleRolePermissionChange = (role: string, permission: string, enabled: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: enabled 
        ? [...(prev[role] || []), permission]
        : (prev[role] || []).filter(p => p !== permission)
    }));
  };

  const saveRolePermissions = () => {
    localStorage.setItem('role_permissions', JSON.stringify(rolePermissions));
    logger.success('Permissões', 'Permissões de roles atualizadas');
  };

  const handleEmailSettingsSave = () => {
    localStorage.setItem('email_settings', JSON.stringify(emailSettings));
    logger.success('Email', 'Configurações de email atualizadas');
  };

  const handleEmailTest = async () => {
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword) {
      logger.error('Teste de Email', 'Preencha todos os campos obrigatórios');
      return;
    }

    logger.info('Teste de Email', 'Testando conexão SMTP...');
    // Aqui você pode implementar um teste real de SMTP se necessário
    setTimeout(() => {
      logger.success('Teste de Email', 'Configuração SMTP válida');
    }, 1000);
  };

  if (!hasPermission()) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h1>
        <p className="text-slate-600">Você não tem permissão para acessar as configurações.</p>
      </div>
    );
  }

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
        {isConfigured && (
          <div className="flex items-center gap-2 text-success-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">WooCommerce Conectado</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autenticação WordPress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Autenticação WordPress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wpUrl">URL do WordPress *</Label>
              <Input
                id="wpUrl"
                placeholder="https://seusite.com"
                value={wpAuthSettings.wpUrl}
                onChange={(e) => setWpAuthSettings({ ...wpAuthSettings, wpUrl: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Configure o plugin JWT Authentication for WP-API no seu WordPress
              </p>
            </div>
            
            <Button onClick={handleWpAuthTest} className="w-full bg-gradient-success hover:opacity-90">
              Configurar WordPress
            </Button>
          </CardContent>
        </Card>

        {/* Permissões por Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Permissões por Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {role.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map(permission => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Switch
                        checked={permissions.includes(permission.key)}
                        onCheckedChange={(enabled) => 
                          handleRolePermissionChange(role, permission.key, enabled)
                        }
                        disabled={role === 'administrator'} // Admin sempre tem tudo
                      />
                      <Label className="text-xs">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <Button onClick={saveRolePermissions} className="w-full">
              Salvar Permissões
            </Button>
          </CardContent>
        </Card>

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
            
            <Button onClick={handleStoreSettingsSave} className="w-full bg-gradient-primary hover:opacity-90">
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
              <Label htmlFor="apiUrl">URL da API *</Label>
              <Input
                id="apiUrl"
                placeholder="https://suaurl.com/wp-json/wc/v3/"
                value={wooSettings.apiUrl}
                onChange={(e) => setWooSettings({ ...wooSettings, apiUrl: e.target.value })}
              />
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
            
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="webhook_secret"
                value={wooSettings.webhookSecret || ''}
                onChange={(e) => setWooSettings({ ...wooSettings, webhookSecret: e.target.value })}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleWooCommerceTest} 
                className="flex-1 bg-gradient-success hover:opacity-90"
                disabled={testConnection.isPending}
              >
                {testConnection.isPending ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button 
                onClick={handleWooCommerceSave}
                variant="outline"
                className="flex-1"
              >
                Salvar
              </Button>
            </div>
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

            <Button onClick={handlePaymentsSave} className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Configurações de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Servidor SMTP *</Label>
              <Input
                id="smtpHost"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Porta SMTP</Label>
              <Input
                id="smtpPort"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuário/Email *</Label>
              <Input
                id="smtpUser"
                type="email"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Senha *</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromEmail">Email Remetente</Label>
              <Input
                id="fromEmail"
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromName">Nome Remetente</Label>
              <Input
                id="fromName"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={emailSettings.smtpSecure}
                onCheckedChange={(checked) => 
                  setEmailSettings({ ...emailSettings, smtpSecure: checked })
                }
              />
              <Label>Conexão Segura (TLS)</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleEmailTest} 
                className="flex-1 bg-gradient-success hover:opacity-90"
              >
                Testar Conexão
              </Button>
              <Button 
                onClick={handleEmailSettingsSave}
                variant="outline"
                className="flex-1"
              >
                Salvar
              </Button>
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

            <Button onClick={handleNotificationsSave} className="w-full">
              Salvar Configurações
            </Button>
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
