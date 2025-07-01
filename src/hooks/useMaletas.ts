
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maletasAPI, Maleta, Representative, CreateMaletaData, MaletaReturn, CommissionCalculation } from '@/services/maletas';
import { toast } from '@/hooks/use-toast';

// Maletas hooks
export const useMaletas = (page = 1, status = '', representative_id = 0) => {
  return useQuery({
    queryKey: ['maletas', page, status, representative_id],
    queryFn: () => maletasAPI.getMaletas(page, 20, status, representative_id),
  });
};

export const useMaleta = (id: number) => {
  return useQuery({
    queryKey: ['maleta', id],
    queryFn: () => maletasAPI.getMaleta(id),
    enabled: !!id,
  });
};

export const useCreateMaleta = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMaletaData) => maletasAPI.createMaleta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
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
  
  return useMutation({
    mutationFn: ({ id, new_date }: { id: number; new_date: string }) => 
      maletasAPI.extendMaletaDeadline(id, new_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      toast({
        title: "Prazo Estendido",
        description: "Prazo da maleta foi estendido com sucesso!",
      });
    },
  });
};

export const useProcessMaletaReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, returnData }: { id: number; returnData: Omit<MaletaReturn, 'maleta_id'> }) => 
      maletasAPI.processMaletaReturn(id, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maletas'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Atualizar estoque
      toast({
        title: "Devolução Processada",
        description: "Devolução foi processada e pedido final foi criado!",
      });
    },
  });
};

// Representatives hooks
export const useRepresentatives = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['representatives', page, search],
    queryFn: () => maletasAPI.getRepresentatives(page, 20, search),
  });
};

export const useCreateRepresentative = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Representative>) => maletasAPI.createRepresentative(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
      toast({
        title: "Representante Criado",
        description: "Representante foi cadastrado com sucesso!",
      });
    },
  });
};

export const useUpdateRepresentative = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Representative> }) => 
      maletasAPI.updateRepresentative(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
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
