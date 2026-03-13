import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/permissions';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // Se true, requer TODAS as permissões. Se false, requer ALGUMA
  fallback?: React.ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

/**
 * Componente para proteger conteúdo baseado em permissões
 * 
 * @example
 * // Requer uma permissão específica
 * <PermissionGuard permission="produtos.edit">
 *   <EditButton />
 * </PermissionGuard>
 * 
 * @example
 * // Requer ALGUMA das permissões
 * <PermissionGuard permissions={["pedidos.view", "pedidos.edit"]}>
 *   <OrdersPage />
 * </PermissionGuard>
 * 
 * @example
 * // Requer TODAS as permissões
 * <PermissionGuard permissions={["usuarios.edit", "usuarios.manage_permissions"]} requireAll>
 *   <ManageUsersButton />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  redirectTo,
  showMessage = true,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();

  // Aguardar carregamento das permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar permissão
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // Se nenhuma permissão foi especificada, permitir acesso
    hasAccess = true;
  }

  // Se não tem acesso
  if (!hasAccess) {
    // Redirecionar se especificado
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Mostrar fallback personalizado
    if (fallback) {
      return <>{fallback}</>;
    }

    // Mostrar mensagem padrão
    if (showMessage) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Acesso Negado</h3>
                <p className="text-sm text-muted-foreground">
                  Você não tem permissão para acessar este recurso.
                  <br />
                  Entre em contato com o administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Não mostrar nada
    return null;
  }

  // Tem acesso, renderizar children
  return <>{children}</>;
};

/**
 * HOC para proteger páginas inteiras
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll = false
) {
  return function ProtectedComponent(props: P) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    return (
      <PermissionGuard 
        permissions={permissions} 
        requireAll={requireAll}
        redirectTo="/dashboard"
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
