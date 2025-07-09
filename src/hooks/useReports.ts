import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllOrders } from '@/hooks/useWooCommerce';

export const useReportsData = () => {
  // Buscar todas as maletas com representantes
  const { data: maletas = [] } = useQuery({
    queryKey: ['maletas-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maletas')
        .select(`
          *,
          representative:representatives(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar todos os retornos com maletas e representantes
  const { data: returns = [] } = useQuery({
    queryKey: ['maleta-returns-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_returns')
        .select(`
          *,
          maleta:maletas(
            *,
            representative:representatives(*)
          )
        `)
        .order('return_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar todos os representantes
  const { data: representatives = [] } = useQuery({
    queryKey: ['representatives-reports'],
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
    queryKey: ['maleta-items-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maleta_items')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar pedidos da loja (WooCommerce)
  const { data: orders = [] } = useAllOrders();

  // Função para calcular comissão baseada nos tiers
  const calculateCommission = (amount: number, commissionSettings: any) => {
    if (!commissionSettings || commissionSettings.use_global !== false) {
      // Usar configuração global de comissão
      if (amount <= 200) return 0;
      if (amount <= 1500) return amount * 0.20 + 50;
      if (amount <= 3000) return amount * 0.30 + 100;
      return amount * 0.40 + 200;
    }
    
    // Usar configuração personalizada do representante
    const tiers = commissionSettings.custom_rates || [];
    for (const tier of tiers) {
      if (amount >= tier.min_amount && (tier.max_amount === null || amount <= tier.max_amount)) {
        return (amount * tier.percentage / 100) + (tier.bonus || 0);
      }
    }
    return 0;
  };

  // Processar retornos com cálculos corretos
  const processedReturns = returns.map(returnItem => {
    const soldItems = Array.isArray(returnItem.items_sold) ? returnItem.items_sold : [];
    const finalAmount = soldItems.reduce((total: number, item: any) => {
      const maletaItem = maletaItems.find(mi => mi.id === item.item_id);
      const price = maletaItem ? Number(maletaItem.price) || 0 : 0;
      const quantity = Number(item.quantity_sold) || 0;
      return total + (price * quantity);
    }, 0);

    const commissionSettings = returnItem.maleta?.commission_settings;
    const commissionAmount = typeof finalAmount === 'number' ? calculateCommission(finalAmount, commissionSettings) : 0;

    return {
      ...returnItem,
      final_amount: finalAmount,
      commission_amount: commissionAmount
    };
  });

  return {
    maletas,
    returns: processedReturns,
    representatives,
    maletaItems,
    orders
  };
};