import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Permission, UserPermissions } from '@/types/permissions';

/**
 * Hook para gerenciar permissões do usuário
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Super admin tem todas as permissões
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

  /**
   * Carregar permissões do usuário
   */
  const loadPermissions = useCallback(async () => {
    if (!user || !currentOrganization) {
      setPermissions({});
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Super admin tem acesso total
    if (isSuperAdmin) {
      setPermissions(getAllPermissions());
      setUserRole('admin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar role do usuário
      const { data: userOrg, error: userOrgError } = await supabase
        .from('user_organizations')
        .select(`
          role_id,
          roles (
            slug,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (userOrgError) {
        console.error('Erro ao buscar role do usuário:', userOrgError);
        setPermissions({});
        setUserRole(null);
        setLoading(false);
        return;
      }

      const roleSlug = (userOrg?.roles as any)?.slug || null;
      setUserRole(roleSlug);

      // Usar função do Supabase para obter permissões
      const { data: permsData, error: permsError } = await supabase
        .rpc('get_user_permissions', {
          p_user_id: user.id,
          p_organization_id: currentOrganization.id
        });

      if (permsError) {
        console.error('Erro ao buscar permissões:', permsError);
        setPermissions({});
        setLoading(false);
        return;
      }

      // Converter para objeto { 'module.action': true }
      const permsMap: UserPermissions = {};
      (permsData || []).forEach((perm: any) => {
        if (perm.granted) {
          permsMap[`${perm.module}.${perm.action}`] = true;
        }
      });

      setPermissions(permsMap);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setPermissions({});
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [user, currentOrganization, isSuperAdmin]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Verificar se usuário tem uma permissão específica
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    return permissions[permission] === true;
  }, [permissions, isSuperAdmin]);

  /**
   * Verificar se usuário tem TODAS as permissões da lista
   */
  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.every(perm => permissions[perm] === true);
  }, [permissions, isSuperAdmin]);

  /**
   * Verificar se usuário tem ALGUMA das permissões da lista
   */
  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.some(perm => permissions[perm] === true);
  }, [permissions, isSuperAdmin]);

  /**
   * Verificar se usuário pode acessar um módulo (tem qualquer permissão nele)
   */
  const canAccessModule = useCallback((module: string): boolean => {
    if (isSuperAdmin) return true;
    return Object.keys(permissions).some(perm => perm.startsWith(`${module}.`));
  }, [permissions, isSuperAdmin]);

  return {
    permissions,
    userRole,
    loading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessModule,
    isSuperAdmin,
    refreshPermissions: loadPermissions,
  };
};

/**
 * Retorna todas as permissões possíveis (para super admin)
 */
function getAllPermissions(): UserPermissions {
  const allPerms: UserPermissions = {};
  
  const modules = [
    'dashboard', 'produtos', 'pedidos', 'pdv', 'clientes',
    'maletas', 'financeiro', 'relatorios', 'configuracoes', 'usuarios'
  ];
  
  const actions = [
    'view', 'create', 'edit', 'delete', 'cancel', 'access',
    'create_order', 'discount', 'process_return', 'manage_stock',
    'export', 'manage_permissions'
  ];

  modules.forEach(module => {
    actions.forEach(action => {
      allPerms[`${module}.${action}`] = true;
    });
  });

  return allPerms;
}
