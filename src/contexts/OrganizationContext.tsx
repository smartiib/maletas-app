
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationAuthContext } from '@/contexts/OrganizationAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  asaas_customer_id?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization) => void;
  loading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { isOrganizationAuthenticated, organizationUser } = useOrganizationAuthContext();
  
  // Carregar organização do localStorage SINCRONAMENTE no estado inicial
  const getInitialOrganization = (): Organization | null => {
    try {
      const savedOrg = localStorage.getItem('currentOrganization');
      if (savedOrg) {
        return JSON.parse(savedOrg);
      }
    } catch (error) {
      console.error('Erro ao carregar organização do localStorage:', error);
    }
    return null;
  };
  
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(getInitialOrganization);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se é super admin
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

  const refreshOrganizations = async () => {
    // Para usuários organizacionais, carregar apenas a organização deles SEM consultar o Supabase (não há sessão para RLS)
    if (isOrganizationAuthenticated && organizationUser) {
      console.log('Carregando organização para usuário organizacional (sem consulta ao Supabase)...', organizationUser);
      
      const userOrganization: Organization = {
        id: organizationUser.organization_id,
        name: organizationUser.organization_name,
        slug: organizationUser.organization_slug,
        // asaas_customer_id não vem do organizationUser; pode ser carregado depois se necessário
      };

      setOrganizations([userOrganization]);
      setCurrentOrganization(userOrganization);
      // Salvar no localStorage
      localStorage.setItem('currentOrganization', JSON.stringify(userOrganization));
      localStorage.setItem('currentOrganizationId', userOrganization.id);
      setLoading(false);
      return;
    }

    // Apenas carregar organizações para super admin
    if (!user || !isSuperAdmin || isOrganizationAuthenticated) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    console.log('Carregando organizações para super admin...');
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar organizações:', error);
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      console.log('Organizações carregadas:', data);
      setOrganizations(data || []);
      
      // Se não há organização atual e existem organizações, seleciona a primeira
      if (!currentOrganization && data && data.length > 0) {
        setCurrentOrganization(data[0]);
        localStorage.setItem('currentOrganization', JSON.stringify(data[0]));
        localStorage.setItem('currentOrganizationId', data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      setOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrganizationAuthenticated && organizationUser) {
      // Para usuários organizacionais, carregar automaticamente sua organização
      refreshOrganizations();
    } else if (user && isSuperAdmin && !isOrganizationAuthenticated) {
      // Para super admin, apenas atualizar a lista de organizações
      // A organização atual já foi carregada do localStorage no estado inicial
      refreshOrganizations();
    } else {
      // Limpar dados para usuários não autenticados
      setOrganizations([]);
      setCurrentOrganization(null);
      // Limpar localStorage
      localStorage.removeItem('currentOrganization');
      localStorage.removeItem('currentOrganizationId');
      setLoading(false);
    }
  }, [user, isSuperAdmin, isOrganizationAuthenticated, organizationUser]);

  const handleSetCurrentOrganization = (org: Organization) => {
    // Apenas super admin pode trocar organização
    if (isSuperAdmin && !isOrganizationAuthenticated) {
      setCurrentOrganization(org);
      // Salvar organização completa no localStorage
      localStorage.setItem('currentOrganization', JSON.stringify(org));
      localStorage.setItem('currentOrganizationId', org.id);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setCurrentOrganization: handleSetCurrentOrganization,
        loading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization deve ser usado dentro de OrganizationProvider');
  }
  return context;
}
