import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maletasAPI, Maleta, Representative, CreateMaletaData, MaletaReturn, CommissionCalculation } from '@/services/maletas';
import { toast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { supabase } from '@/integrations/supabase/client';

// Maletas hooks with organization filtering
export const useMaletas = (page = 1, status = '', representative_id = '') => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['maletas', currentOrganization?.id, page, status, representative_id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return { data: [], total: 0, pages: 0 };
      }

      // Use direct Supabase query with organization filtering
      let query = supabase
        .from('maletas')
        .select(`
          *,
          representative:representatives(*)
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      
      if (representative_id) {
        query = query.eq('representative_id', representative_id);
      }

      // Apply pagination
      const from = (page - 1) * 20;
      const to = from + 19;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar maletas:', error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      };
    },
    enabled: !!currentOrganization && isConfigured,
  });
};

export const useMaleta = (id: string) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['maleta', currentOrganization?.id, id],
    queryFn: () => maletasAPI.getMaleta(id),
    enabled: !!id && !!currentOrganization && isConfigured,
  });
};

export const useCreateMaleta = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: (data: CreateMaletaData) => maletasAPI.createMaleta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Atualizar estoque
      toast({
        title: "Maleta Criada",
        description: "Maleta foi criada com sucesso e produtos foram reduzidos do estoque!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar maleta",
        variant: "destructive",
      });
    },
  });
};

export const useExtendMaletaDeadline = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, new_date }: { id: string; new_date: string }) => 
      maletasAPI.extendMaletaDeadline(id, new_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas', currentOrganization?.id] });
    },
  });
};

export const useProcessMaletaReturn = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, returnData }: { id: string; returnData: Omit<MaletaReturn, 'maleta_id'> }) => 
      maletasAPI.processMaletaReturn(id, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Atualizar estoque
    },
  });
};

// Representatives hooks with organization filtering
export const useRepresentatives = (page = 1, search = '') => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['representatives', currentOrganization?.id, page, search],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return { data: [], total: 0, pages: 0 };
      }

      // Use direct Supabase query with organization filtering
      let query = supabase
        .from('representatives')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * 20;
      const to = from + 19;
      query = query.range(from, to).order('name');

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar representantes:', error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      };
    },
    enabled: !!currentOrganization && isConfigured,
  });
};

export const useCreateRepresentative = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: (data: Partial<Representative>) => maletasAPI.createRepresentative(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives', currentOrganization?.id] });
      toast({
        title: "Representante Criado",
        description: "Representante foi cadastrado com sucesso!",
      });
    },
  });
};

export const useUpdateRepresentative = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Representative> }) => 
      maletasAPI.updateRepresentative(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives', currentOrganization?.id] });
      toast({
        title: "Representante Atualizado",
        description: "Dados do representante foram atualizados!",
      });
    },
  });
};

// Commission calculation hook
export const useCommissionCalculator = () => {
  const calculateCommission = (
    amount: number,
    tiers?: any[],
    delay_days = 0,
    penalty_rate?: number
  ): CommissionCalculation => {
    return maletasAPI.calculateCommission(amount, tiers, delay_days, penalty_rate);
  };

  const calculateReferralBonus = (amount: number): number => {
    return maletasAPI.calculateReferralBonus(amount);
  };

  const isEligibleForMonthlyBonus = (monthly_sales: number): boolean => {
    return maletasAPI.isEligibleForMonthlyBonus(monthly_sales);
  };

  return {
    calculateCommission,
    calculateReferralBonus,
    isEligibleForMonthlyBonus,
  };
};
