import React from 'react';
import { RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useManualSync, useSyncStats, useSyncStatus } from '@/hooks/useSupabaseSync';
import { toast } from '@/hooks/use-toast';

interface SyncHeaderProps {
  syncType: 'products' | 'customers' | 'orders' | 'all';
  title?: string;
}

const SyncHeader: React.FC<SyncHeaderProps> = ({ syncType, title }) => {
  const { data: stats } = useSyncStats();
  const { data: syncStatus } = useSyncStatus();
  const manualSync = useManualSync();

  const getSyncInfo = () => {
    switch (syncType) {
      case 'products':
        return {
          count: stats?.products_count || 0,
          lastSync: stats?.last_sync_time,
          label: 'produtos'
        };
      case 'customers':
        return {
          count: stats?.customers_count || 0,
          lastSync: stats?.last_sync_time,
          label: 'clientes'
        };
      case 'orders':
        return {
          count: stats?.orders_count || 0,
          lastSync: stats?.last_sync_time,
          label: 'pedidos'
        };
      case 'all':
        return {
          count: (stats?.products_count || 0) + (stats?.customers_count || 0) + (stats?.orders_count || 0),
          lastSync: stats?.last_sync_time,
          label: 'itens'
        };
      default:
        return {
          count: 0,
          lastSync: null,
          label: 'itens'
        };
    }
  };

  const syncInfo = getSyncInfo();
  const isSyncing = syncStatus?.is_syncing;

  const handleManualSync = async () => {
    try {
      let syncTypes = [];
      
      switch (syncType) {
        case 'products':
          syncTypes = ['products'];
          break;
        case 'customers':
          syncTypes = ['customers'];
          break;
        case 'orders':
          syncTypes = ['orders'];
          break;
        case 'all':
          syncTypes = ['products', 'customers', 'orders'];
          break;
      }

      for (const type of syncTypes) {
        await manualSync.mutateAsync(type);
      }

      toast({
        title: "Sincronização Iniciada",
        description: `Sincronização de ${syncInfo.label} iniciada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: "Erro ao iniciar sincronização",
        variant: "destructive"
      });
    }
  };

  const getLastSyncText = () => {
    if (!syncInfo.lastSync) return "Nunca sincronizado";
    
    const lastSyncDate = new Date(syncInfo.lastSync);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSyncDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Sincronizado agora";
    if (diffInMinutes < 60) return `Há ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `Há ${Math.floor(diffInMinutes / 60)} horas`;
    return `Há ${Math.floor(diffInMinutes / 1440)} dias`;
  };

  const getSyncStatusBadge = () => {
    if (isSyncing) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Sincronizando...
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Atualizado
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Última sincronização:</span>
                <span className="ml-1 text-muted-foreground">
                  {getLastSyncText()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{syncInfo.count} {syncInfo.label}</span>
              {getSyncStatusBadge()}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing || manualSync.isPending}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(isSyncing || manualSync.isPending) ? 'animate-spin' : ''}`} />
            {isSyncing || manualSync.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncHeader;