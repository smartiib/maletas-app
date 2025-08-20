
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface CreateOrganizationUserData {
  email: string;
  name: string;
  password: string;
}

interface UpdateOrganizationUserData {
  email?: string;
  name?: string;
  is_active?: boolean;
}

interface ChangePasswordData {
  userId: string;
  newPassword: string;
}

export function useOrganizationUsers() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (organizationId: string, userData: CreateOrganizationUserData): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-organization-user', {
        body: {
          organizationId,
          email: userData.email,
          name: userData.name,
          password: userData.password,
        }
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o usuário.',
          variant: 'destructive',
        });
        return false;
      }

      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.error || 'Erro ao criar usuário.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateOrganizationUserData): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organization_users')
        .update(userData)
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar usuário.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('change-organization-user-password', {
        body: data
      });

      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao alterar senha.',
          variant: 'destructive',
        });
        return false;
      }

      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.error || 'Erro ao alterar senha.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao alterar senha.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Usar Edge Function para deletar usuário (evita problemas com RLS)
      const { data: result, error } = await supabase.functions.invoke('delete-organization-user', {
        body: { userId }
      });

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir usuário.',
          variant: 'destructive',
        });
        return false;
      }

      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.error || 'Erro ao excluir usuário.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (organizationId: string): Promise<OrganizationUser[]> => {
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        return [];
      }

      return (data as unknown as OrganizationUser[]) || [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar usuário.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  };

  return {
    createUser,
    updateUser,
    changePassword,
    deleteUser,
    loadUsers,
    updateUserStatus,
    loading,
  };
}
