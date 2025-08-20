
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Verificar se há usuário organizacional no localStorage
    const storedUser = localStorage.getItem('organization_user');
    const isAuthenticated = localStorage.getItem('organization_user_authenticated') === 'true';
    
    if (storedUser && isAuthenticated) {
      try {
        const user = JSON.parse(storedUser);
        console.log('[OrganizationAuthContext] Carregando usuário do localStorage:', user);
        setOrganizationUserState(user);
      } catch (error) {
        console.error('Erro ao carregar usuário organizacional:', error);
        localStorage.removeItem('organization_user');
        localStorage.removeItem('organization_user_authenticated');
      }
    }
  }, []);

  const setOrganizationUser = (user: OrganizationUser | null) => {
    console.log('[OrganizationAuthContext] Definindo usuário organizacional:', user);
    setOrganizationUserState(user);
    
    if (user) {
      localStorage.setItem('organization_user', JSON.stringify(user));
      localStorage.setItem('organization_user_authenticated', 'true');
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
