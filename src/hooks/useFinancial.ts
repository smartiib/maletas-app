import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';

export interface FinancialTransaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category?: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: string;
  order_id: number;
  order_number?: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  installments_count: number;
  payment_type: 'installment' | 'future';
  status: 'active' | 'completed' | 'cancelled';
  interest_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstallment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  late_fee: number;
  discount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Hook para transações financeiras
export const useFinancialTransactions = () => {
  return useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FinancialTransaction[];
    }
  });
};

// Hook para criar transação
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      logger.success('Transação Criada', 'Transação financeira foi criada com sucesso');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao criar transação financeira');
    }
  });
};

// Hook para planos de pagamento
export const usePaymentPlans = () => {
  return useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentPlan[];
    }
  });
};

// Hook para criar plano de pagamento
export const useCreatePaymentPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (plan: Omit<PaymentPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payment_plans')
        .insert(plan)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      logger.success('Plano Criado', 'Plano de pagamento foi criado com sucesso');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao criar plano de pagamento');
    }
  });
};

// Hook para parcelas
export const usePaymentInstallments = (planId?: string) => {
  return useQuery({
    queryKey: ['payment-installments', planId],
    queryFn: async () => {
      let query = supabase
        .from('payment_installments')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (planId) {
        query = query.eq('payment_plan_id', planId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PaymentInstallment[];
    },
    enabled: !planId || !!planId
  });
};

// Hook para criar parcelas
export const useCreateInstallments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (installments: Omit<PaymentInstallment, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('payment_installments')
        .insert(installments)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-installments'] });
      logger.success('Parcelas Criadas', 'Parcelas foram criadas com sucesso');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao criar parcelas');
    }
  });
};

// Hook para dar baixa em parcela
export const usePayInstallment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      payment_date, 
      payment_method, 
      notes,
      late_fee = 0,
      discount = 0
    }: { 
      id: string; 
      payment_date: string; 
      payment_method?: string; 
      notes?: string;
      late_fee?: number;
      discount?: number;
    }) => {
      const { data, error } = await supabase
        .from('payment_installments')
        .update({ 
          status: 'paid',
          payment_date,
          payment_method,
          notes,
          late_fee,
          discount
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-installments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      logger.success('Parcela Paga', 'Parcela foi marcada como paga');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao registrar pagamento da parcela');
    }
  });
};

// Hook para dashboard financeiro
export const useFinancialDashboard = () => {
  return useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      // Buscar transações do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('date', startOfMonth.toISOString())
        .eq('status', 'completed');
      
      if (transError) throw transError;
      
      // Buscar parcelas vencidas
      const today = new Date().toISOString().split('T')[0];
      const { data: overdueInstallments, error: overdueError } = await supabase
        .from('payment_installments')
        .select('*')
        .lt('due_date', today)
        .eq('status', 'pending');
      
      if (overdueError) throw overdueError;
      
      // Buscar parcelas a vencer nos próximos 7 dias
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: upcomingInstallments, error: upcomingError } = await supabase
        .from('payment_installments')
        .select('*')
        .gte('due_date', today)
        .lte('due_date', nextWeek.toISOString().split('T')[0])
        .eq('status', 'pending');
      
      if (upcomingError) throw upcomingError;
      
      const entradas = transactions?.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const saidas = transactions?.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const saldo = entradas - saidas;
      
      return {
        entradas,
        saidas,
        saldo,
        parcelasVencidas: overdueInstallments?.length || 0,
        parcelasAVencer: upcomingInstallments?.length || 0,
        valorVencido: overdueInstallments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        valorAVencer: upcomingInstallments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      };
    }
  });
};