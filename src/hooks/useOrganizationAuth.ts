
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginData {
  email: string;
  password: string;
}

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

export function useOrganizationAuth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loginOrganizationUser = async (loginData: LoginData): Promise<OrganizationUser | null> => {
    setLoading(true);
    try {
      // Usar Edge Function para autenticar usuário da organização
      const { data: result, error } = await supabase.functions.invoke('authenticate-organization-user', {
        body: loginData
      });

      if (error) {
        console.error('Erro ao autenticar:', error);
        toast({
          title: 'Erro',
          description: 'Falha na autenticação.',
          variant: 'destructive',
        });
        return null;
      }

      if (!result?.success) {
        toast({
          title: 'Erro',
          description: result?.error || 'Credenciais inválidas.',
          variant: 'destructive',
        });
        return null;
      }

      // Atualizar last_login
      if (result.user) {
        await supabase
          .from('organization_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', result.user.id);
      }

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!',
      });

      return result.user;
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado no login.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loginOrganizationUser,
    loading,
  };
}
