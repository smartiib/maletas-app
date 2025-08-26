import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WooCommerceConfig } from '@/components/settings/WooCommerceConfig';
import { WooCommerceConfig as WooCommerceConfigType } from '@/services/woocommerce';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Settings() {
  const { config, isConfigured, isLoading } = useWooCommerceConfig();

  const renderConnectionStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <Badge variant="destructive">
              Não Configurado
            </Badge>
          </>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua organização e integrações.
          </p>
        </div>

        <Tabs defaultValue="woocommerce" className="space-y-4">
          <TabsList>
            <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="woocommerce" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Status da Integração WooCommerce</CardTitle>
                    <CardDescription>
                      Status atual da conexão com sua loja WooCommerce
                    </CardDescription>
                  </div>
                  {renderConnectionStatus()}
                </div>
              </CardHeader>
              <CardContent>
                {isConfigured && (
                  <Alert>
                    <AlertDescription>
                      Integração ativa! Sua loja está conectada e pronta para sincronização.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <WooCommerceConfig />
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações gerais da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure suas preferências de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
