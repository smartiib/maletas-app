
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WooCommerceConfig } from '@/components/settings/WooCommerceConfig';
import { IncrementalSyncDashboard } from '@/components/sync/IncrementalSyncDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações e integrações
          </p>
        </div>

        <Tabs defaultValue="woocommerce" className="space-y-4">
          <TabsList>
            <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
            <TabsTrigger value="sync">Sincronização</TabsTrigger>
          </TabsList>

          <TabsContent value="woocommerce" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integração WooCommerce</CardTitle>
                <CardDescription>
                  Configure sua conexão com a API do WooCommerce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WooCommerceConfig />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <IncrementalSyncDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
