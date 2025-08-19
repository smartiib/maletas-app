
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationPage {
  id: string;
  organization_id: string;
  page_key: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useOrganizationPages(organizationId?: string) {
  const [pages, setPages] = useState<OrganizationPage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPages = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_pages' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('page_key');

      if (error) {
        console.error('Erro ao carregar páginas da organização:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar páginas da organização.',
          variant: 'destructive',
        });
        return;
      }

      setPages((data as unknown as OrganizationPage[]) || []);
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePageStatus = async (pageKey: string, isEnabled: boolean) => {
    if (!organizationId) return false;

    try {
      const { error } = await supabase
        .from('organization_pages' as any)
        .upsert({
          organization_id: organizationId,
          page_key: pageKey,
          is_enabled: isEnabled,
        }, {
          onConflict: 'organization_id,page_key'
        });

      if (error) {
        console.error('Erro ao atualizar página:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar página.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: `Página ${isEnabled ? 'habilitada' : 'desabilitada'} com sucesso!`,
      });

      await loadPages();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar página:', error);
      return false;
    }
  };

  useEffect(() => {
    loadPages();
  }, [organizationId]);

  return {
    pages,
    loading,
    loadPages,
    updatePageStatus,
  };
}
