
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
  const { isOrganizationAuthenticated } = useOrganizationAuthContext();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se é super admin
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

  const refreshOrganizations = async () => {
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
    if (user && isSuperAdmin && !isOrganizationAuthenticated) {
      // Tentar restaurar organização do localStorage primeiro
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      
      if (savedOrgId) {
        supabase
          .from('organizations')
          .select('*')
          .eq('id', savedOrgId)
          .single()
          .then(({ data }) => {
            if (data) {
              setCurrentOrganization(data);
            }
          });
      }
      
      refreshOrganizations();
    } else {
      // Limpar dados para usuários organizacionais ou não autenticados
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user, isSuperAdmin, isOrganizationAuthenticated]);

  const handleSetCurrentOrganization = (org: Organization) => {
    // Apenas super admin pode trocar organização
    if (isSuperAdmin && !isOrganizationAuthenticated) {
      setCurrentOrganization(org);
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
