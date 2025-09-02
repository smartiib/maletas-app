import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SalesComparisonData {
  period: string;
  store_sales: number;
  representative_sales: number;
  total_sales: number;
  store_orders: number;
  representative_orders: number;
  store_avg_ticket: number;
  representative_avg_ticket: number;
  commission_paid: number;
}

export const useSalesComparison = (monthsBack: number = 12) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['sales-comparison', currentOrganization?.id, monthsBack],
    queryFn: async (): Promise<SalesComparisonData[]> => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const endDate = new Date();
      const startDate = subMonths(endDate, monthsBack);
      const months = eachMonthOfInterval({ start: startDate, end: endDate });

      const comparisonData: SalesComparisonData[] = [];

      for (const month of months) {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const periodKey = format(month, 'yyyy-MM');
        const periodLabel = format(month, 'MMM yyyy', { locale: ptBR });

        // Buscar vendas da loja (WooCommerce)
        const { data: wcOrders, error: wcError } = await supabase
          .from('wc_orders')
          .select('total, date_created')
          .eq('organization_id', currentOrganization.id)
          .gte('date_created', monthStart.toISOString())
          .lte('date_created', monthEnd.toISOString())
          .neq('status', 'cancelled');

        if (wcError) throw wcError;

        // Buscar vendas de representantes (maletas)
        const { data: maletaReturns, error: maletaError } = await supabase
          .from('maleta_returns')
          .select(`
            *,
            maleta:maletas(
              commission_settings
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .gte('return_date', monthStart.toISOString())
          .lte('return_date', monthEnd.toISOString());

        if (maletaError) throw maletaError;

        // Buscar itens das maletas para este período
        const { data: maletaItems, error: itemsError } = await supabase
          .from('maleta_items')
          .select('*')
          .eq('organization_id', currentOrganization.id);

        if (itemsError) throw itemsError;

        // Calcular métricas da loja
        const storeSales = wcOrders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0;
        const storeOrders = wcOrders?.length || 0;
        const storeAvgTicket = storeOrders > 0 ? storeSales / storeOrders : 0;

        // Calcular métricas dos representantes
        let representativeSales = 0;
        let commissionPaid = 0;
        const representativeOrders = maletaReturns?.length || 0;

        maletaReturns?.forEach(returnItem => {
          const soldItems = Array.isArray(returnItem.items_sold) ? returnItem.items_sold : [];
          const saleValue = soldItems.reduce((total: number, item: any) => {
            const maletaItem = maletaItems?.find(mi => mi.id === item.item_id);
            const price = maletaItem ? Number(maletaItem.price) || 0 : 0;
            const quantity = Number(item.quantity_sold) || 0;
            return total + (price * quantity);
          }, 0);

          representativeSales += saleValue;

          // Calcular comissão
          const commissionSettings = returnItem.maleta?.commission_settings;
          if (commissionSettings && !commissionSettings.use_global) {
            const tiers = commissionSettings.custom_rates || [];
            for (const tier of tiers) {
              if (saleValue >= tier.min_amount && (tier.max_amount === null || saleValue <= tier.max_amount)) {
                commissionPaid += (saleValue * tier.percentage / 100) + (tier.bonus || 0);
                break;
              }
            }
          } else {
            // Usar configuração global
            if (saleValue > 200) {
              if (saleValue <= 1500) commissionPaid += saleValue * 0.20 + 50;
              else if (saleValue <= 3000) commissionPaid += saleValue * 0.30 + 100;
              else commissionPaid += saleValue * 0.40 + 200;
            }
          }
        });

        const representativeAvgTicket = representativeOrders > 0 ? representativeSales / representativeOrders : 0;
        const totalSales = storeSales + representativeSales;

        comparisonData.push({
          period: periodLabel,
          store_sales: storeSales,
          representative_sales: representativeSales,
          total_sales: totalSales,
          store_orders: storeOrders,
          representative_orders: representativeOrders,
          store_avg_ticket: storeAvgTicket,
          representative_avg_ticket: representativeAvgTicket,
          commission_paid: commissionPaid
        });
      }

      return comparisonData;
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 10 * 60 * 1000,
  });
};