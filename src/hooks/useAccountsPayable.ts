
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { logger } from '@/services/logger';

export interface AccountPayable {
  id: string;
  supplier_id?: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category?: string;
  payment_method?: string;
  notes?: string;
  organization_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useAccountsPayable = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['accounts-payable', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization,
  });
};

export const useCreateAccountPayable = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (account: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não selecionada');
      
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert({
          ...account,
          organization_id: currentOrganization.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      logger.success('Conta a Pagar', 'Conta registrada com sucesso');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao registrar conta a pagar');
    }
  });
};

export const usePayAccountPayable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payment_date, payment_method, notes }: { 
      id: string; 
      payment_date: string; 
      payment_method?: string; 
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          payment_date,
          payment_method,
          notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      logger.success('Pagamento', 'Conta marcada como paga');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao registrar pagamento');
    }
  });
};
