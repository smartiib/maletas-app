
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    console.log('Carregando organizações...');
    
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
    if (user) {
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
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const handleSetCurrentOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', org.id);
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
