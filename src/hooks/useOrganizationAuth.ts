
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const loginOrganizationUser = async (loginData: LoginData): Promise<OrganizationUser | null> => {
    setLoading(true);
    try {
      console.log('[useOrganizationAuth] Tentando login com:', loginData.email);

      // Usar Edge Function para autenticar usuário da organização
      const { data: result, error } = await supabase.functions.invoke('authenticate-organization-user', {
        body: loginData
      });

      console.log('[useOrganizationAuth] Resultado da Edge Function:', { result, error });

      if (error) {
        console.error('[useOrganizationAuth] Erro na Edge Function:', error);
        return null;
      }

      if (!result?.success) {
        console.log('[useOrganizationAuth] Login falhou:', result?.error || 'Credenciais inválidas');
        return null;
      }

      // Atualizar last_login
      if (result.user) {
        console.log('[useOrganizationAuth] Atualizando last_login para usuário:', result.user.id);
        const { error: updateError } = await supabase
          .from('organization_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', result.user.id);

        if (updateError) {
          console.warn('[useOrganizationAuth] Erro ao atualizar last_login:', updateError);
        }
      }

      console.log('[useOrganizationAuth] Login bem-sucedido:', result.user);
      return result.user;
    } catch (error: any) {
      console.error('[useOrganizationAuth] Erro inesperado:', error);
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
