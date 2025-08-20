
import React from 'react';
import { useMasterAuth } from '@/hooks/useMasterAuth';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationAuthContext } from '@/contexts/OrganizationAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, LogIn, Building2 } from 'lucide-react';

interface ConfigGuardProps {
  children: React.ReactNode;
}

const ConfigGuard: React.FC<ConfigGuardProps> = ({ children }) => {
  const { isMasterAuthenticated, isLoading, loginMaster } = useMasterAuth();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { organizationUser, isOrganizationAuthenticated, logoutOrganization } = useOrganizationAuthContext();

  console.log('[ConfigGuard] Estado atual:', {
    isAuthenticated,
    loading,
    user: user?.email,
    isMasterAuthenticated,
    isLoading,
    organizationUser: organizationUser?.email,
    isOrganizationAuthenticated
  });

  // Se ainda está carregando a autenticação base, mostrar loading
  if (loading) {
    console.log('[ConfigGuard] Carregando autenticação base...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar se é usuário organizacional autenticado
  if (isOrganizationAuthenticated && organizationUser) {
    console.log('[ConfigGuard] Usuário organizacional autenticado:', organizationUser.email);
    return <>{children}</>;
  }

  // Se não está autenticado no sistema base E não é usuário organizacional, redirecionar para login
  if (!isAuthenticated && !isOrganizationAuthenticated) {
    console.log('[ConfigGuard] Usuário não autenticado, redirecionando...');
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
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full mt-4"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se ainda está carregando o estado master, mostrar loading
  if (isLoading) {
    console.log('[ConfigGuard] Carregando estado master...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';
  console.log('[ConfigGuard] Verificação super admin:', { 
    userEmail: user?.email, 
    isSuperAdmin,
    isMasterAuthenticated 
  });

  // Se é usuário Supabase mas não é super admin, negar acesso às configurações
  if (isAuthenticated && !isSuperAdmin) {
    console.log('[ConfigGuard] Usuário Supabase não é super admin');
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
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline"
                onClick={async () => {
                  console.log('[ConfigGuard] Forçando logout para trocar de conta autorizada...');
                  await logout();
                  window.location.href = '/auth';
                }}
                className="w-full"
              >
                Fazer Login com Conta Autorizada
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('[ConfigGuard] Redirecionando para login organizacional...');
                  window.location.href = '/auth';
                }}
                className="w-full"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Login Organizacional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é super admin mas não ativou o modo master, mostrar opção para ativar
  if (isSuperAdmin && !isMasterAuthenticated) {
    console.log('[ConfigGuard] Super admin não ativou modo master');
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

  // Se chegou até aqui, usuário tem acesso (super admin com modo master OU usuário organizacional)
  console.log('[ConfigGuard] Acesso liberado');
  return <>{children}</>;
};

export default ConfigGuard;
