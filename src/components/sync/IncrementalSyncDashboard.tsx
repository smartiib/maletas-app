
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Search, 
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useIncrementalSync } from '@/hooks/useIncrementalSync';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { SyncProgressDialog } from './SyncProgressDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const IncrementalSyncDashboard = () => {
  const { config, isConfigured } = useWooCommerceConfig();
  const {
    syncStatus,
    isLoadingSyncStatus,
    discoverProducts,
    fullSync,
    isDiscovering,
    isSyncing,
    progressState,
    closeProgress
  } = useIncrementalSync();

  if (!isConfigured) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">WooCommerce não configurado</h3>
            <p className="text-muted-foreground mb-4">
              Configure sua integração com WooCommerce nas configurações antes de sincronizar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDiscover = () => {
    if (config) {
      discoverProducts({
        url: config.url,
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret
      });
    }
  };

  const handleFullSync = () => {
    if (config) {
      fullSync({
        url: config.url,
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    const isFullyCompleted = syncStatus?.metadata?.isFullyCompleted === true;
    
    switch (status) {
      case 'completed':
        return isFullyCompleted 
          ? <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída</Badge>
          : <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'syncing':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sincronizando</Badge>;
      case 'discovering':
        return <Badge variant="secondary"><Search className="h-3 w-3 mr-1" />Descobrindo</Badge>;
      case 'ready':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pronta</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  const getProductsToSync = () => {
    if (!syncStatus?.metadata) return 0;
    const { missingIds = [], changedIds = [] } = syncStatus.metadata;
    const totalDiscovered = missingIds.length + changedIds.length;
    const processed = syncStatus.processed_items || 0;
    
    // Return remaining items to sync
    return Math.max(0, totalDiscovered - processed);
  };

  const getSyncProgress = () => {
    if (!syncStatus?.metadata) return 0;
    const { missingIds = [], changedIds = [] } = syncStatus.metadata;
    const totalToSync = missingIds.length + changedIds.length;
    const processed = syncStatus.processed_items || 0;
    
    if (totalToSync === 0) return 100;
    return Math.round((processed / totalToSync) * 100);
  };

  const getPassInfo = () => {
    if (!syncStatus?.metadata?.totalPasses) return null;
    return {
      passes: syncStatus.metadata.totalPasses,
      avgPerPass: Math.round((syncStatus.processed_items || 0) / syncStatus.metadata.totalPasses),
      batchSize: 25
    };
  };

  const passInfo = getPassInfo();
  const remainingItems = getProductsToSync();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status da Sincronização
              {getStatusBadge(syncStatus?.status)}
            </CardTitle>
            <CardDescription>
              Sistema multi-pass com lotes otimizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStatus?.metadata && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Progresso geral</span>
                    <span>{syncStatus.processed_items || 0}/{(syncStatus.metadata.missingIds?.length || 0) + (syncStatus.metadata.changedIds?.length || 0)}</span>
                  </div>
                  <Progress value={getSyncProgress()} className="mt-1" />
                </div>
              )}
              
              {passInfo && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  <Layers className="h-3 w-3 inline mr-1" />
                  {passInfo.passes} passes • Média: {passInfo.avgPerPass} por pass • Lote: {passInfo.batchSize}
                </div>
              )}
              
              {syncStatus?.last_sync_at && (
                <div className="text-sm text-muted-foreground">
                  Última sincronização: {formatDistanceToNow(new Date(syncStatus.last_sync_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              )}
              
              {syncStatus?.last_discover_at && (
                <div className="text-sm text-muted-foreground">
                  Última descoberta: {formatDistanceToNow(new Date(syncStatus.last_discover_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Produtos para Sincronizar */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Pendentes</CardTitle>
            <CardDescription>
              Processamento otimizado em lotes de 25
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-primary">
                {remainingItems}
              </div>
              
              {syncStatus?.metadata && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Processados: {syncStatus.processed_items || 0}</div>
                  <div>Total descobertos: {(syncStatus.metadata.missingIds?.length || 0) + (syncStatus.metadata.changedIds?.length || 0)}</div>
                  <div>Total WC: {syncStatus.total_items || 0}</div>
                  
                  {syncStatus.metadata.failedIds?.length > 0 && (
                    <div className="text-red-600">
                      Falharam: {syncStatus.metadata.failedIds.length}
                    </div>
                  )}
                </div>
              )}

              {remainingItems > 0 && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
                  <Zap className="h-3 w-3 inline mr-1" />
                  Estimativa: ~{Math.ceil(remainingItems / 25)} lotes • ~{Math.ceil(remainingItems / 25 * 0.5)}min
                </div>
              )}

              {remainingItems === 0 && syncStatus?.metadata && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border">
                  <CheckCircle2 className="h-3 w-3 inline mr-1" />
                  Todos os produtos estão sincronizados!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Sincronização inteligente com multi-pass
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering || isSyncing}
                className="w-full"
                variant="outline"
              >
                {isDiscovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Descobrindo...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Descobrir Produtos
                  </>
                )}
              </Button>

              <Button
                onClick={handleFullSync}
                disabled={isDiscovering || isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    <div className="flex flex-col items-center">
                      <span>Sincronização Multi-Pass</span>
                      <span className="text-xs opacity-75">Lotes de 25 produtos</span>
                    </div>
                  </>
                )}
              </Button>

              {remainingItems > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  {remainingItems} produtos em ~{Math.ceil(remainingItems / 25)} lotes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </>
  );
};
