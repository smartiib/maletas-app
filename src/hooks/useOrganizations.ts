
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  slug: string;
  asaas_customer_id?: string;
  created_at: string;
  updated_at: string;
}

interface CreateOrganizationData {
  name: string;
  slug: string;
}

export function useOrganizations() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization | null> => {
    setLoading(true);
    try {
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar organização:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao criar organização. Verifique se o slug não está em uso.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Sucesso',
        description: 'Organização criada com sucesso!',
      });

      return newOrg;
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar organização.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (id: string, data: Partial<CreateOrganizationData>): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar organização:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar organização.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Organização atualizada com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar organização:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar organização.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrganization,
    updateOrganization,
    loading,
  };
}
