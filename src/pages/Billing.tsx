// Billing functionality temporarily disabled for non-SaaS mode
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const Billing = () => {
  // Simplified for non-SaaS mode

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Funcionalidade Temporariamente Desabilitada</h1>
      </div>

      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="w-5 h-5" />
            Recursos SaaS Pausados
          </CardTitle>
          <CardDescription>
            As funcionalidades de assinatura e billing estão temporariamente desabilitadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Esta página contém funcionalidades SaaS que foram pausadas para finalizar o desenvolvimento da aplicação principal.
            </p>
            <p className="text-muted-foreground">
              As funcionalidades incluem:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Gestão de planos e assinaturas</li>
              <li>Sistema de billing integrado</li>
              <li>Organizações multi-tenant</li>
              <li>Limites por organização</li>
            </ul>
            <p className="text-muted-foreground">
              Essas funcionalidades serão reativadas quando o desenvolvimento SaaS for retomado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;