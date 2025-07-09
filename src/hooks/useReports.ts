import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReportsData = () => {
  // Buscar todas as maletas
  const { data: maletas = [] } = useQuery({
    queryKey: ['maletas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maletas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar todos os retornos
  const { data: returns = [] } = useQuery({
    queryKey: ['maleta-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_returns')
        .select('*')
        .order('return_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar todos os representantes
  const { data: representatives = [] } = useQuery({
    queryKey: ['representatives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar itens das maletas
  const { data: maletaItems = [] } = useQuery({
    queryKey: ['maleta-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_items')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  return {
    maletas,
    returns,
    representatives,
    maletaItems
  };
};