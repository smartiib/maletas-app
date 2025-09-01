
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { logger } from '@/services/logger';

export interface StockAdjustment {
  id: string;
  product_id: number;
  variation_id?: number;
  adjustment_type: 'perda' | 'quebra' | 'troca' | 'devolucao' | 'correcao';
  quantity_before: number;
  quantity_after: number;
  quantity_adjusted: number;
  reason: string;
  notes?: string;
  user_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export const useStockAdjustments = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['stock-adjustments', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockAdjustment[];
    },
    enabled: !!currentOrganization,
  });
};

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (adjustment: Omit<StockAdjustment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não selecionada');
      
      const { data, error } = await supabase
        .from('stock_adjustments')
        .insert({
          ...adjustment,
          organization_id: currentOrganization.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      logger.success('Ajuste de Estoque', 'Ajuste registrado com sucesso');
    },
    onError: () => {
      logger.error('Erro', 'Falha ao registrar ajuste de estoque');
    }
  });
};
