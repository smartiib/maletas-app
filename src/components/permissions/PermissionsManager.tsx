import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Users, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  PERMISSIONS_MAP, 
  MODULE_LABELS, 
  ACTION_LABELS,
  PermissionModule,
  Role,
  PermissionRecord
} from '@/types/permissions';

interface PermissionsManagerProps {
  userId?: string;
  roleId?: string;
  mode: 'user' | 'role';
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  userId,
  roleId,
  mode
}) => {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, boolean>>({});
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(roleId || null);
  const [roles, setRoles] = useState<Role[]>([]);

  // Carregar roles disponíveis
  useEffect(() => {
    loadRoles();
  }, [currentOrganization]);

  // Carregar permissões quando role ou user mudar
  useEffect(() => {
    if (mode === 'role' && selectedRole) {
      loadRolePermissions(selectedRole);
    } else if (mode === 'user' && userId && currentOrganization) {
      loadUserPermissions(userId, currentOrganization.id);
    }
  }, [mode, selectedRole, userId, currentOrganization]);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${currentOrganization?.id}`)
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      setLoading(true);

      // Carregar todas as permissões disponíveis
      const { data: allPerms, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('module, action');

      if (permsError) throw permsError;
      setAllPermissions(allPerms || []);

      // Carregar permissões do role
      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (rolePermsError) throw rolePermsError;

      // Criar mapa de permissões
      const permsMap: Record<string, boolean> = {};
      const rolePermIds = new Set((rolePerms || []).map(rp => rp.permission_id));
      
      (allPerms || []).forEach(perm => {
        const key = `${perm.module}.${perm.action}`;
        permsMap[key] = rolePermIds.has(perm.id);
      });

      setPermissions(permsMap);
      setOriginalPermissions({ ...permsMap });
    } catch (error) {
      console.error('Erro ao carregar permissões do role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string, orgId: string) => {
    try {
      setLoading(true);

      // Carregar todas as permissões disponíveis
      const { data: allPerms, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('module, action');

      if (permsError) throw permsError;
      setAllPermissions(allPerms || []);

      // Usar função RPC para obter permissões efetivas do usuário
      const { data: userPerms, error: userPermsError } = await supabase
        .rpc('get_user_permissions', {
          p_user_id: userId,
          p_organization_id: orgId
        });

      if (userPermsError) throw userPermsError;

      // Criar mapa de permissões
      const permsMap: Record<string, boolean> = {};
      (userPerms || []).forEach((perm: any) => {
        const key = `${perm.module}.${perm.action}`;
        permsMap[key] = perm.granted;
      });

      setPermissions(permsMap);
      setOriginalPermissions({ ...permsMap });
    } catch (error) {
      console.error('Erro ao carregar permissões do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    const key = `${module}.${action}`;
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePermissions = async () => {
    if (!currentOrganization) return;

    try {
      setSaving(true);

      if (mode === 'role' && selectedRole) {
        await saveRolePermissions(selectedRole);
      } else if (mode === 'user' && userId) {
        await saveUserPermissions(userId, currentOrganization.id);
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões salvas com sucesso!',
      });

      setOriginalPermissions({ ...permissions });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as permissões',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveRolePermissions = async (roleId: string) => {
    // Deletar permissões antigas
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Inserir novas permissões
    const permsToInsert = allPermissions
      .filter(perm => permissions[`${perm.module}.${perm.action}`])
      .map(perm => ({
        role_id: roleId,
        permission_id: perm.id
      }));

    if (permsToInsert.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .insert(permsToInsert);

      if (error) throw error;
    }
  };

  const saveUserPermissions = async (userId: string, orgId: string) => {
    // Deletar permissões personalizadas antigas
    await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', orgId);

    // Inserir novas permissões personalizadas
    const permsToInsert = allPermissions
      .filter(perm => {
        const key = `${perm.module}.${perm.action}`;
        return permissions[key] !== originalPermissions[key];
      })
      .map(perm => ({
        user_id: userId,
        organization_id: orgId,
        permission_id: perm.id,
        granted: permissions[`${perm.module}.${perm.action}`]
      }));

    if (permsToInsert.length > 0) {
      const { error } = await supabase
        .from('user_permissions')
        .insert(permsToInsert);

      if (error) throw error;
    }
  };

  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Permissões</h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'role' ? 'Configure as permissões do grupo' : 'Personalize as permissões do usuário'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => mode === 'role' && selectedRole 
              ? loadRolePermissions(selectedRole)
              : userId && currentOrganization && loadUserPermissions(userId, currentOrganization.id)
            }
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button
            onClick={savePermissions}
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Seletor de Role (modo role) */}
      {mode === 'role' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecionar Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRole || ''} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.is_system && <Badge variant="outline" className="ml-2">Sistema</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Grid de Permissões por Módulo */}
      {(mode === 'user' || selectedRole) && (
        <div className="grid gap-4">
          {(Object.keys(PERMISSIONS_MAP) as PermissionModule[]).map(module => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="text-lg">{MODULE_LABELS[module]}</CardTitle>
                <CardDescription>
                  Permissões para o módulo {MODULE_LABELS[module].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {PERMISSIONS_MAP[module].map(action => {
                    const key = `${module}.${action}`;
                    const isEnabled = permissions[key] || false;

                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={isEnabled}
                          onCheckedChange={() => togglePermission(module, action)}
                        />
                        <Label
                          htmlFor={key}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {ACTION_LABELS[action]}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Indicador de mudanças */}
      {hasChanges && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <p className="text-sm text-warning-foreground">
              ⚠️ Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
