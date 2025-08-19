
import React, { useState } from 'react';
import { useMasterAuth } from '@/hooks/useMasterAuth';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, LogIn } from 'lucide-react';

interface ConfigGuardProps {
  children: React.ReactNode;
}

const ConfigGuard: React.FC<ConfigGuardProps> = ({ children }) => {
  const { isMasterAuthenticated, isLoading, loginMaster } = useMasterAuth();
  const { user, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa fazer login para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LogIn className="h-4 w-4" />
              <AlertDescription>
                Faça login na sua conta para acessar o sistema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMasterAuthenticated) {
    const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

    if (!isSuperAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta área
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Apenas o super administrador pode acessar as configurações do sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Acesso Super Admin</CardTitle>
            <CardDescription>
              Você está logado como super administrador. Clique para ativar o modo admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Logado como: <strong>{user?.email}</strong>
              </AlertDescription>
            </Alert>
            
            <Button onClick={loginMaster} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Ativar Modo Super Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ConfigGuard;
