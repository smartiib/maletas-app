
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { IncrementalSyncDashboard } from '@/components/sync/IncrementalSyncDashboard';
import SyncHeader from '@/components/sync/SyncHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Sync = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SyncHeader syncType="all" title="Sincronização de Dados" />
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Nova Sincronização Inteligente:</strong> O sistema agora identifica apenas os produtos que precisam ser atualizados, 
            eliminando duplicações e garantindo sincronização completa e eficiente.
          </AlertDescription>
        </Alert>

        <IncrementalSyncDashboard />
        
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona a Sincronização Incremental</CardTitle>
            <CardDescription>
              Entenda o novo processo de sincronização otimizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">1. Descoberta</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema compara os produtos do WooCommerce com os dados locais, 
                  identificando apenas produtos novos ou modificados.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Sincronização Direcionada</h4>
                <p className="text-sm text-muted-foreground">
                  Apenas os produtos identificados são sincronizados em lotes eficientes, 
                  eliminando processamento desnecessário.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Rastreamento Preciso</h4>
                <p className="text-sm text-muted-foreground">
                  O progresso é monitorado com precisão, garantindo que todos os produtos 
                  sejam processados sem duplicações.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Performance Otimizada</h4>
                <p className="text-sm text-muted-foreground">
                  Reduz significativamente o tempo de sincronização e o uso de recursos, 
                  especialmente em catálogos grandes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Sync;
