import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, Settings, TrendingUp } from 'lucide-react';
import { useSyncStats, useSyncStatus, useTimeSinceLastSync, useSyncLogs, useSyncConfig, useSaveSyncConfig, useManualSync } from '@/hooks/useSupabaseSync';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { toast } from 'sonner';
import { SyncProgressDialog } from './SyncProgressDialog';
import { useSyncProgress } from '@/hooks/useSyncProgress';

interface SyncDashboardProps {
  className?: string;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({ className }) => {
  const { data: stats, isLoading: statsLoading } = useSyncStats();
  const { data: syncStatus } = useSyncStatus();
  const timeSinceLastSync = useTimeSinceLastSync();
  const { data: logs } = useSyncLogs();
  const { data: configs } = useSyncConfig();
  const saveSyncConfig = useSaveSyncConfig();
  const manualSync = useManualSync();
  const { config: wooConfig, isConfigured } = useWooCommerceConfig();
  
  const { progressState, startSync, updateProgress, completeSync, closeProgress } = useSyncProgress();

  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  // Configuração padrão para produtos
  const productConfig = configs?.find(c => c.sync_type === 'products') || {
    sync_type: 'products',
    is_active: true,
    sync_interval: 'manual',
    auto_sync_enabled: false,
    sync_on_startup: false,
    config_data: {}
  };

  const handleSaveConfig = (newConfig: any) => {
    saveSyncConfig.mutate(newConfig);
  };

  const handleManualSync = async (syncType: 'products' | 'categories' | 'orders' | 'customers' | 'full') => {
    if (!isConfigured) {
      toast.error('Configure as credenciais do WooCommerce na aba WooCommerce antes de sincronizar');
      return;
    }

    console.log('Iniciando sincronização:', syncType, 'com config:', wooConfig);

    // Iniciar o progresso visual
    startSync(syncType);
    
    try {
      // Simular progresso inicial
      updateProgress({
        progress: 10,
        currentStep: 'Conectando com WooCommerce...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateProgress({
        progress: 20,
        currentStep: 'Validando credenciais...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress({
        progress: 30,
        currentStep: `Iniciando sincronização de ${syncType}...`
      });

      const result = await manualSync.mutateAsync({
        sync_type: syncType,
        config: {
          url: wooConfig.apiUrl,
          consumer_key: wooConfig.consumerKey,
          consumer_secret: wooConfig.consumerSecret
        },
        batch_size: 50,
        force_full_sync: false
      });

      // Simular progresso durante a sincronização
      for (let i = 40; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        updateProgress({
          progress: i,
          currentStep: `Processando ${syncType}...`,
          itemsProcessed: Math.floor((i - 30) / 60 * 100),
          totalItems: 100
        });
      }

      updateProgress({
        progress: 100,
        currentStep: 'Finalizando sincronização...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      completeSync(true);
      
      setTimeout(() => {
        closeProgress();
        toast.success(`Sincronização de ${syncType} concluída com sucesso!`);
      }, 2000);

    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      completeSync(false, error.message);
      
      setTimeout(() => {
        closeProgress();
        toast.error(`Erro na sincronização: ${error.message}`);
      }, 3000);
    }
  };

  const isSyncDisabled = !isConfigured || manualSync.isPending || syncStatus?.is_syncing;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alert quando WooCommerce não está configurado */}
      {!isConfigured && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              WooCommerce não configurado
            </span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Configure as credenciais do WooCommerce na aba "WooCommerce" para habilitar as sincronizações.
          </p>
        </div>
      )}

      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products_count || 0}</div>
            <p className="text-xs text-muted-foreground">sincronizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categories_count || 0}</div>
            <p className="text-xs text-muted-foreground">sincronizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders_count || 0}</div>
            <p className="text-xs text-muted-foreground">sincronizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customers_count || 0}</div>
            <p className="text-xs text-muted-foreground">sincronizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{timeSinceLastSync}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.last_sync?.status === 'success' ? 'Sucesso' : 'Com erro'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {syncStatus?.is_syncing ? (
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {syncStatus?.is_syncing ? 'Sincronizando...' : 'Pronto'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_configs?.length || 0} config{stats?.active_configs?.length !== 1 ? 's' : ''} ativa{stats?.active_configs?.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principal */}
      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Tab de Sincronização Manual */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sincronização Manual</CardTitle>
              <CardDescription>
                Execute sincronizações manuais ou configure sincronizações automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleManualSync('products')}
                    disabled={isSyncDisabled}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    {progressState.isOpen && progressState.syncType === 'products' ? 'Sincronizando...' : 'Sincronizar Produtos'}
                  </Button>

                  <Button
                    onClick={() => handleManualSync('categories')}
                    disabled={isSyncDisabled}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {progressState.isOpen && progressState.syncType === 'categories' ? 'Sincronizando...' : 'Sincronizar Categorias'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleManualSync('orders')}
                    disabled={isSyncDisabled}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    {progressState.isOpen && progressState.syncType === 'orders' ? 'Sincronizando...' : 'Sincronizar Pedidos'}
                  </Button>

                  <Button
                    onClick={() => handleManualSync('customers')}
                    disabled={isSyncDisabled}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {progressState.isOpen && progressState.syncType === 'customers' ? 'Sincronizando...' : 'Sincronizar Clientes'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleManualSync('full')}
                    disabled={isSyncDisabled}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {progressState.isOpen && progressState.syncType === 'full' ? 'Sincronizando...' : 'Sincronização Completa'}
                  </Button>
                </div>
              </div>

              {syncStatus?.is_syncing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-blue-700 font-medium">
                      Sincronização em andamento...
                    </span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Iniciada em {new Date(syncStatus.started_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configurações */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
              <CardDescription>
                Configure quando e como os dados devem ser sincronizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuração de Produtos */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Produtos</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-interval">Intervalo de Sincronização</Label>
                    <Select
                      value={productConfig.sync_interval}
                      onValueChange={(value) => 
                        handleSaveConfig({
                          ...productConfig,
                          sync_interval: value
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o intervalo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="15min">A cada 15 minutos</SelectItem>
                        <SelectItem value="30min">A cada 30 minutos</SelectItem>
                        <SelectItem value="1h">A cada 1 hora</SelectItem>
                        <SelectItem value="2h">A cada 2 horas</SelectItem>
                        <SelectItem value="6h">A cada 6 horas</SelectItem>
                        <SelectItem value="12h">A cada 12 horas</SelectItem>
                        <SelectItem value="24h">A cada 24 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-sync"
                        checked={productConfig.auto_sync_enabled}
                        onCheckedChange={(checked) =>
                          handleSaveConfig({
                            ...productConfig,
                            auto_sync_enabled: checked
                          })
                        }
                      />
                      <Label htmlFor="auto-sync">Sincronização Automática</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sync-startup"
                        checked={productConfig.sync_on_startup}
                        onCheckedChange={(checked) =>
                          handleSaveConfig({
                            ...productConfig,
                            sync_on_startup: checked
                          })
                        }
                      />
                      <Label htmlFor="sync-startup">Sincronizar ao Iniciar</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sincronizações</CardTitle>
              <CardDescription>
                Visualize o histórico detalhado de todas as sincronizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum log de sincronização encontrado
                  </p>
                ) : (
                  logs?.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : log.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        )}
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                              {log.sync_type}
                            </Badge>
                            <span className="text-sm font-medium">{log.operation}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{log.message}</p>
                          
                          {log.items_processed > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {log.items_processed} itens processados
                              {log.items_failed > 0 && `, ${log.items_failed} falhas`}
                              {log.duration_ms && ` em ${(log.duration_ms / 1000).toFixed(1)}s`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Progresso */}
      <SyncProgressDialog
        isOpen={progressState.isOpen}
        onClose={closeProgress}
        syncType={progressState.syncType}
        status={progressState.status}
        progress={progressState.progress}
        currentStep={progressState.currentStep}
        itemsProcessed={progressState.itemsProcessed}
        totalItems={progressState.totalItems}
        errorMessage={progressState.errorMessage}
      />
    </div>
  );
};
