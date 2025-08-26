
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      console.log('[useSuppliers] Fetching suppliers from Supabase...');
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[useSuppliers] Error fetching suppliers:', error);
        throw error;
      }

      console.log(`[useSuppliers] Found ${data?.length || 0} suppliers`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
