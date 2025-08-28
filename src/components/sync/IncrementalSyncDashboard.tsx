
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
  AlertCircle
} from 'lucide-react';
import { useIncrementalSync } from '@/hooks/useIncrementalSync';
import { useWooCommerce } from '@/hooks/useWooCommerce';
import { SyncProgressDialog } from './SyncProgressDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const IncrementalSyncDashboard = () => {
  const { config, isConfigured } = useWooCommerce();
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
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída</Badge>;
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
    return missingIds.length + changedIds.length;
  };

  const getSyncProgress = () => {
    if (!syncStatus || !syncStatus.total_items) return 0;
    return Math.round((syncStatus.processed_items / syncStatus.total_items) * 100);
  };

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
              Estado atual da sincronização de produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncStatus?.total_items && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Progresso geral</span>
                    <span>{syncStatus.processed_items}/{syncStatus.total_items}</span>
                  </div>
                  <Progress value={getSyncProgress()} className="mt-1" />
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
              Produtos que precisam ser sincronizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-primary">
                {getProductsToSync()}
              </div>
              
              {syncStatus?.metadata && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Novos: {syncStatus.metadata.missingIds?.length || 0}</div>
                  <div>Modificados: {syncStatus.metadata.changedIds?.length || 0}</div>
                  <div>Total WC: {syncStatus.total_items || 0}</div>
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
              Gerenciar sincronização de produtos
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
                    Sincronização Completa
                  </>
                )}
              </Button>

              {getProductsToSync() > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  {getProductsToSync()} produtos serão processados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SyncProgressDialog
        isOpen={progressState.isOpen}
        onClose={closeProgress}
        progressState={progressState}
      />
    </>
  );
};
