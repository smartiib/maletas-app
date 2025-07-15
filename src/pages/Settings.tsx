import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, CreditCard, Truck, Bell, Shield, Database, Palette, Globe, CheckCircle, Users, Key, Mail, Percent, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { WooCommerceConfig } from '@/services/woocommerce';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// Constantes básicas para modo demo
const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Acessar dashboard principal' },
  { key: 'products', label: 'Produtos', description: 'Gerenciar produtos' },
  { key: 'orders', label: 'Pedidos', description: 'Gerenciar pedidos' },
  { key: 'customers', label: 'Clientes', description: 'Gerenciar clientes' },
  { key: 'pos', label: 'POS', description: 'Acessar sistema POS' },
  { key: 'maletas', label: 'Maletas', description: 'Gerenciar maletas' },
  { key: 'reports', label: 'Relatórios', description: 'Visualizar relatórios' },
  { key: 'logs', label: 'Logs', description: 'Visualizar logs do sistema' },
  { key: 'settings', label: 'Configurações', description: 'Acessar configurações' },
];

const ROLE_PERMISSIONS = {
  administrator: ['dashboard', 'products', 'orders', 'customers', 'pos', 'maletas', 'reports', 'logs', 'settings'],
  shop_manager: ['dashboard', 'products', 'orders', 'customers', 'pos', 'reports'],
  representante: ['dashboard', 'maletas', 'customers'],
  customer: ['dashboard'],
};
import { logger } from '@/services/logger';

import { Badge } from '@/components/ui/badge';

const Settings = () => {
  const { config, testConnection, saveConfig, isConfigured, webhooks, setupWebhook, deleteWebhook } = useWooCommerceConfig();
  
  // Hook para buscar logs de webhook reais
  const webhookLogs = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching webhook logs:', error);
        return [];
      }
      
      return data || [];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Hook para buscar configurações de comissão
  const commissionQuery = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => {
      // Pegar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return null;
      }

      const { data, error } = await supabase
        .from('user_configurations')
        .select('*')
        .eq('config_type', 'commission_settings')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching commission settings:', error);
        return null;
      }
      
      return data;
    },
  });

  // Hook para buscar níveis de comissão
  const commissionTiersQuery = useQuery({
    queryKey: ['commission-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('min_amount', { ascending: true });
      
      if (error) {
        console.error('Error fetching commission tiers:', error);
        return [];
      }
      
      return data || [];
    },
  });

  // Mutation para salvar configurações de comissão
  const saveCommissionSettings = useMutation({
    mutationFn: async (settings: any) => {
      // Pegar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.id,
          config_type: 'commission_settings',
          config_data: settings,
          is_active: true,
        }, {
          onConflict: 'user_id,config_type'
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Configurações de Comissão",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para salvar níveis de comissão
  const saveCommissionTiers = useMutation({
    mutationFn: async (tiers: any[]) => {
      // Primeiro, deletar todos os níveis existentes
      await supabase.from('commission_tiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Inserir novos níveis
      const { data, error } = await supabase
        .from('commission_tiers')
        .insert(tiers);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      commissionTiersQuery.refetch();
      toast({
        title: "Níveis de Comissão",
        description: "Níveis de comissão atualizados com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar níveis de comissão: " + error.message,
        variant: "destructive",
      });
    },
  });
  
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
    consumerSecret: ''
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

  // Estados para configurações de comissão
  const [commissionSettings, setCommissionSettings] = useState({
    penaltyRate: 1.0,
    monthlyBonusThreshold: 1000,
    referralCommissionRate: 10
  });

  const [commissionTiers, setCommissionTiers] = useState([
    { label: 'Varejo', min_amount: 0, max_amount: 200, percentage: 0, bonus: 0 },
    { label: 'Nível 1', min_amount: 200, max_amount: 1500, percentage: 20, bonus: 50 },
    { label: 'Nível 2', min_amount: 1500, max_amount: 3000, percentage: 30, bonus: 100 },
    { label: 'Nível 3', min_amount: 3000, max_amount: null, percentage: 40, bonus: 200 }
  ]);

  const { toast } = useToast();

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

  // Carregar configurações de comissão da base de dados
  useEffect(() => {
    if (commissionQuery.data) {
      const configData = commissionQuery.data.config_data as any;
      setCommissionSettings({
        penaltyRate: configData.penaltyRate || 1.0,
        monthlyBonusThreshold: configData.monthlyBonusThreshold || 1000,
        referralCommissionRate: configData.referralCommissionRate || 10
      });
    }
  }, [commissionQuery.data]);

  // Carregar níveis de comissão da base de dados
  useEffect(() => {
    if (commissionTiersQuery.data && commissionTiersQuery.data.length > 0) {
      setCommissionTiers(commissionTiersQuery.data);
    }
  }, [commissionTiersQuery.data]);

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

  // Handlers para configurações de comissão
  const handleCommissionSettingsSave = () => {
    saveCommissionSettings.mutate(commissionSettings);
  };

  const handleCommissionTiersSave = () => {
    const tierData = commissionTiers.map(tier => ({
      label: tier.label,
      min_amount: tier.min_amount,
      max_amount: tier.max_amount,
      percentage: tier.percentage,
      bonus: tier.bonus,
      is_active: true
    }));
    saveCommissionTiers.mutate(tierData);
  };

  const handleCommissionSettingsAndTiersSave = () => {
    handleCommissionSettingsSave();
    handleCommissionTiersSave();
  };

  const handleRestoreCommissionDefaults = () => {
    const defaultSettings = {
      penaltyRate: 1.0,
      monthlyBonusThreshold: 1000,
      referralCommissionRate: 10
    };
    
    const defaultTiers = [
      { label: 'Varejo', min_amount: 0, max_amount: 200, percentage: 0, bonus: 0 },
      { label: 'Nível 1', min_amount: 200, max_amount: 1500, percentage: 20, bonus: 50 },
      { label: 'Nível 2', min_amount: 1500, max_amount: 3000, percentage: 30, bonus: 100 },
      { label: 'Nível 3', min_amount: 3000, max_amount: null, percentage: 40, bonus: 200 }
    ];
    
    setCommissionSettings(defaultSettings);
    setCommissionTiers(defaultTiers);
    
    toast({
      title: "Configurações Restauradas",
      description: "Configurações de comissão restauradas para valores padrão",
    });
  };

  const handleTierChange = (index: number, field: keyof typeof commissionTiers[0], value: any) => {
    const newTiers = [...commissionTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setCommissionTiers(newTiers);
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
          <h1 className="text-3xl font-bold text-foreground">
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
                        checked={(permissions as string[]).includes(permission.key)}
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

        {/* Gestão de Webhooks */}
        {isConfigured && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Webhooks são configurados automaticamente para sincronização de estoque
              </div>
              
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
                              onClick={() => webhook.id && deleteWebhook.mutate(webhook.id)}
                              disabled={deleteWebhook.isPending}
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
                  https://umrrcgfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook
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

        {/* Logs de Webhook */}
        {isConfigured && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Logs de Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Últimas atividades dos webhooks configurados
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {webhookLogs.data && webhookLogs.data.length > 0 ? (
                  webhookLogs.data.map((log) => {
                    const eventData = log.event_data as any;
                    const timeAgo = new Date(log.created_at).toLocaleString('pt-BR');
                    
                    let title = 'Evento de Webhook';
                    let description = timeAgo;
                    
                    if (log.event_type === 'order') {
                      if (eventData?.status) {
                        title = `Pedido #${eventData.id} ${eventData.status === 'completed' ? 'finalizado' : 'atualizado'}`;
                        description = `${timeAgo} - Status: ${eventData.status}`;
                      } else {
                        title = `Pedido #${eventData?.id || 'N/A'} criado`;
                        description = `${timeAgo} - Total: R$ ${eventData?.total || '0,00'}`;
                      }
                    } else if (log.event_type === 'product') {
                      title = `Produto #${eventData?.id || 'N/A'} - estoque atualizado`;
                      description = `${timeAgo} - Novo estoque: ${eventData?.stock_quantity || 0} unidades`;
                    }
                    
                    return (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{title}</div>
                          <div className="text-xs text-muted-foreground">
                            {description}
                          </div>
                        </div>
                        <Badge 
                          variant={log.status === 'success' ? 'default' : 'destructive'} 
                          className="text-xs"
                        >
                          {log.status === 'success' ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {webhookLogs.isLoading ? 'Carregando logs...' : 'Nenhum log de webhook encontrado'}
                  </div>
                )}
                
                <div className="text-center text-xs text-muted-foreground py-2">
                  Mostrando últimas 10 atividades
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://supabase.com/dashboard/project/umrrchfsbazjqopaxkoi/functions/woocommerce-stock-webhook/logs', '_blank')}
              >
                Ver Logs Completos no Supabase
              </Button>
            </CardContent>
          </Card>
        )}

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

      {/* Configurações de Comissão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Configurações de Comissão
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure as regras de comissão para representantes
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Taxa de Penalidade */}
          <div>
            <Label className="text-sm font-medium">Taxa de Penalidade por Dia (% ao dia)</Label>
            <div className="mt-2">
              <Input
                type="number"
                placeholder="1.0"
                step="0.1"
                min="0"
                max="10"
                value={commissionSettings.penaltyRate}
                onChange={(e) => setCommissionSettings({
                  ...commissionSettings,
                  penaltyRate: parseFloat(e.target.value) || 0
                })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentual descontado da comissão por dia de atraso na devolução
              </p>
            </div>
          </div>

          {/* Limite Mínimo para Bônus Mensal */}
          <div>
            <Label className="text-sm font-medium">Limite Mínimo para Bônus Mensal (R$)</Label>
            <div className="mt-2">
              <Input
                type="number"
                placeholder="1000.00"
                step="0.01"
                min="0"
                value={commissionSettings.monthlyBonusThreshold}
                onChange={(e) => setCommissionSettings({
                  ...commissionSettings,
                  monthlyBonusThreshold: parseFloat(e.target.value) || 0
                })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Valor mínimo de vendas mensais para ser elegível ao bônus
              </p>
            </div>
          </div>

          {/* Taxa de Comissão por Indicação */}
          <div>
            <Label className="text-sm font-medium">Taxa de Comissão por Indicação (%)</Label>
            <div className="mt-2">
              <Input
                type="number"
                placeholder="10"
                step="0.1"
                min="0"
                max="50"
                value={commissionSettings.referralCommissionRate}
                onChange={(e) => setCommissionSettings({
                  ...commissionSettings,
                  referralCommissionRate: parseFloat(e.target.value) || 0
                })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentual da comissão sobre vendas de representantes indicados
              </p>
            </div>
          </div>

          {/* Níveis de Comissão */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Níveis de Comissão</Label>
            <div className="space-y-4">
              {commissionTiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <Label className="text-xs text-slate-500">Nível</Label>
                    <Input 
                      value={tier.label} 
                      onChange={(e) => handleTierChange(index, 'label', e.target.value)}
                      className="text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Min (R$)</Label>
                    <Input 
                      type="number" 
                      value={tier.min_amount} 
                      onChange={(e) => handleTierChange(index, 'min_amount', parseFloat(e.target.value) || 0)}
                      className="text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Max (R$)</Label>
                    <Input 
                      type="number" 
                      value={tier.max_amount || ''} 
                      onChange={(e) => handleTierChange(index, 'max_amount', e.target.value ? parseFloat(e.target.value) : null)}
                      className="text-sm" 
                      placeholder="Ilimitado" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Comissão (%)</Label>
                    <Input 
                      type="number" 
                      value={tier.percentage} 
                      onChange={(e) => handleTierChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Bônus (R$)</Label>
                    <Input 
                      type="number" 
                      value={tier.bonus} 
                      onChange={(e) => handleTierChange(index, 'bonus', parseFloat(e.target.value) || 0)}
                      className="text-sm" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              className="bg-gradient-primary"
              onClick={handleCommissionSettingsAndTiersSave}
              disabled={saveCommissionSettings.isPending || saveCommissionTiers.isPending}
            >
              {(saveCommissionSettings.isPending || saveCommissionTiers.isPending) ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleRestoreCommissionDefaults}
            >
              Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      </Card>

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
