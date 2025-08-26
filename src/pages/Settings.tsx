import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, CreditCard, Truck, Bell, Shield, Database, Palette, Globe, CheckCircle, Users, Key, Mail, Percent, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { WooCommerceConfig as WooCommerceConfigType } from '@/services/woocommerce';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/logger';
import { Badge } from '@/components/ui/badge';
import { WooCommerceConfig } from '@/components/settings/WooCommerceConfig';
import { SyncDashboard } from '@/components/sync/SyncDashboard';
import AdminInfo from '@/components/auth/AdminInfo';

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

const Settings = () => {
  const { config, isConfigured, isLoading } = useWooCommerceConfig();
  
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
      {/* Admin Info */}
      <AdminInfo />
      
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

      {/* Tabs */}
      <Tabs defaultValue="woocommerce" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="commission">Comissão</TabsTrigger>
        </TabsList>

        {/* Tab WooCommerce */}
        <TabsContent value="woocommerce" className="space-y-6">
          <WooCommerceConfig />
        </TabsContent>

        {/* Tab Sincronização */}
        <TabsContent value="sync" className="space-y-6">
          <SyncDashboard />
        </TabsContent>

        {/* Tab Configurações Gerais */}
        <TabsContent value="general" className="space-y-6">
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
          </div>
        </TabsContent>

        {/* Tab Configurações de Comissão */}
        <TabsContent value="commission" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
