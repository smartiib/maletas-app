
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

export const useFinancialTransactions = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['financial-transactions', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentPlans = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['payment-plans', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .select(`
          *,
          installments:payment_installments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar planos de pagamento:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000,
  });
};
