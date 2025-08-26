
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  is_active: boolean;
  organization_name: string;
  organization_slug: string;
}

interface OrganizationAuthContextValue {
  organizationUser: OrganizationUser | null;
  isOrganizationAuthenticated: boolean;
  setOrganizationUser: (user: OrganizationUser | null) => void;
  logoutOrganization: () => void;
}

const OrganizationAuthContext = createContext<OrganizationAuthContextValue | undefined>(undefined);

export const OrganizationAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizationUser, setOrganizationUserState] = useState<OrganizationUser | null>(null);

  // Consome o estado do Supabase Auth para criar a "ponte" de sessão
  const { isAuthenticated, loading: authLoading, login, logout } = useAuth();

  useEffect(() => {
    // Verificar se há usuário organizacional no localStorage
    const storedUser = localStorage.getItem('organization_user');
    const isAuthenticatedOrg = localStorage.getItem('organization_user_authenticated') === 'true';
    
    if (storedUser && isAuthenticatedOrg) {
      try {
        const user = JSON.parse(storedUser) as OrganizationUser;
        console.log('[OrganizationAuthContext] Carregando usuário do localStorage:', user);
        setOrganizationUserState(user);
      } catch (error) {
        console.error('Erro ao carregar usuário organizacional:', error);
        localStorage.removeItem('organization_user');
        localStorage.removeItem('organization_user_authenticated');
      }
    }
  }, []);

  // Se houve logout manual, limpar sessão organizacional e desabilitar bridge login
  useEffect(() => {
    const manualLogout = localStorage.getItem('manual_logout') === 'true';
    if (manualLogout) {
      console.log('[OrganizationAuthContext] Logout manual detectado: limpando sessão organizacional e desabilitando bridge login');
      setOrganizationUserState(null);
      localStorage.removeItem('organization_user');
      localStorage.removeItem('organization_user_authenticated');
      // Limpa a flag para que novos logins funcionem normalmente depois
      localStorage.removeItem('manual_logout');
    }
  }, [isAuthenticated]);

  // Bridge login: se há usuário organizacional e ainda não há sessão Supabase, efetua login técnico,
  // exceto quando houver um logout manual sinalizado
  useEffect(() => {
    const manualLogout = localStorage.getItem('manual_logout') === 'true';
    if (!authLoading && organizationUser && !isAuthenticated) {
      if (manualLogout) {
        console.log('[OrganizationAuthContext] Bridge login bloqueado por logout manual');
        return;
      }
      console.log('[OrganizationAuthContext] Bridge login: garantindo sessão Supabase para usuário organizacional');
      // Não aguardamos bloqueando a UI; se falhar, o AuthContext já exibe toast
      login();
    }
  }, [organizationUser, isAuthenticated, authLoading, login]);

  const setOrganizationUser = (user: OrganizationUser | null) => {
    console.log('[OrganizationAuthContext] Definindo usuário organizacional:', user);
    setOrganizationUserState(user);
    
    if (user) {
      localStorage.setItem('organization_user', JSON.stringify(user));
      localStorage.setItem('organization_user_authenticated', 'true');

      const manualLogout = localStorage.getItem('manual_logout') === 'true';
      // Bridge login imediato após autenticar organizacional, exceto se houve logout manual
      if (!isAuthenticated && !manualLogout) {
        console.log('[OrganizationAuthContext] Bridge login após autenticação organizacional');
        login();
      } else if (manualLogout) {
        console.log('[OrganizationAuthContext] Bridge login após autenticação bloqueado por logout manual');
      }
    } else {
      localStorage.removeItem('organization_user');
      localStorage.removeItem('organization_user_authenticated');
    }
  };

  const logoutOrganization = () => {
    console.log('[OrganizationAuthContext] Fazendo logout organizacional');
    setOrganizationUserState(null);
    localStorage.removeItem('organization_user');
    localStorage.removeItem('organization_user_authenticated');

    // Desloga também do Supabase para não deixar sessão técnica ativa
    logout();
  };

  const value = {
    organizationUser,
    isOrganizationAuthenticated: !!organizationUser,
    setOrganizationUser,
    logoutOrganization,
  };

  return (
    <OrganizationAuthContext.Provider value={value}>
      {children}
    </OrganizationAuthContext.Provider>
  );
};

export const useOrganizationAuthContext = () => {
  const context = useContext(OrganizationAuthContext);
  if (!context) {
    throw new Error('useOrganizationAuthContext deve ser usado dentro de OrganizationAuthProvider');
  }
  return context;
};
