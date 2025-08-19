
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maletasAPI, Maleta, Representative, CreateMaletaData, MaletaReturn, CommissionCalculation } from '@/services/maletas';
import { toast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

// Maletas hooks with organization filtering
export const useMaletas = (page = 1, status = '', representative_id = '') => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['maletas', currentOrganization?.id, page, status, representative_id],
    queryFn: () => maletasAPI.getMaletas(page, status, representative_id),
    enabled: !!currentOrganization && isConfigured,
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Maleta Criada",
        description: "Maleta foi criada com sucesso e produtos foram reduzidos do estoque!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar maleta:', error);
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
      toast({
        title: "Prazo Estendido",
        description: "Prazo da maleta foi estendido com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao estender prazo:', error);
      toast({
        title: "Erro",
        description: "Erro ao estender prazo da maleta",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Devolução Processada",
        description: "Devolução foi processada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao processar devolução:', error);
      toast({
        title: "Erro", 
        description: "Erro ao processar devolução",
        variant: "destructive",
      });
    },
  });
};

// Representatives hooks with organization filtering
export const useRepresentatives = (page = 1, search = '') => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['representatives', currentOrganization?.id, page, search],
    queryFn: () => maletasAPI.getRepresentatives(page, search),
    enabled: !!currentOrganization && isConfigured,
    staleTime: 60000, // 1 minuto
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
    onError: (error) => {
      console.error('Erro ao criar representante:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar representante",
        variant: "destructive",
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
    onError: (error) => {
      console.error('Erro ao atualizar representante:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar representante",
        variant: "destructive",
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
