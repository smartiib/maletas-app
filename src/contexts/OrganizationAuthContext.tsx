
import React, { createContext, useContext, useState, useEffect } from 'react';

interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  is_active: boolean;
}

interface OrganizationAuthContextValue {
  organizationUser: OrganizationUser | null;
  isOrganizationAuthenticated: boolean;
  setOrganizationUser: (user: OrganizationUser | null) => void;
  logoutOrganization: () => void;
}

const OrganizationAuthContext = createContext<OrganizationAuthContextValue | undefined>(undefined);

export const OrganizationAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizationUser, setOrganizationUser] = useState<OrganizationUser | null>(null);

  useEffect(() => {
    // Verificar se há usuário organizacional no localStorage
    const storedUser = localStorage.getItem('organization_user');
    const isAuthenticated = localStorage.getItem('organization_user_authenticated') === 'true';
    
    if (storedUser && isAuthenticated) {
      try {
        setOrganizationUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário organizacional:', error);
        localStorage.removeItem('organization_user');
        localStorage.removeItem('organization_user_authenticated');
      }
    }
  }, []);

  const logoutOrganization = () => {
    setOrganizationUser(null);
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
