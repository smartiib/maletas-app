import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

export interface CustomerSalesData {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string;
  order_frequency: number;
  maleta_purchases: number;
  wc_orders: number;
}

export const useCustomerSalesReport = (startDate?: string, endDate?: string) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['customer-sales-report', currentOrganization?.id, startDate, endDate],
    queryFn: async (): Promise<CustomerSalesData[]> => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      // Buscar dados do WooCommerce
      let wcQuery = supabase
        .from('wc_orders')
        .select('customer_id, total, date_created, billing')
        .eq('organization_id', currentOrganization.id)
        .neq('status', 'cancelled');

      if (startDate) {
        wcQuery = wcQuery.gte('date_created', startDate);
      }
      if (endDate) {
        wcQuery = wcQuery.lte('date_created', endDate);
      }

      const { data: wcOrders, error: wcError } = await wcQuery;
      if (wcError) throw wcError;

      // Buscar dados de maletas retornadas (vendas)
      let maletaQuery = supabase
        .from('maleta_returns')
        .select(`
          *,
          maleta:maletas(
            customer_name,
            customer_email
          )
        `)
        .eq('organization_id', currentOrganization.id);

      if (startDate) {
        maletaQuery = maletaQuery.gte('return_date', startDate);
      }
      if (endDate) {
        maletaQuery = maletaQuery.lte('return_date', endDate);
      }

      const { data: maletaReturns, error: maletaError } = await maletaQuery;
      if (maletaError) throw maletaError;

      // Buscar itens das maletas para calcular valores
      const { data: maletaItems, error: itemsError } = await supabase
        .from('maleta_items')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (itemsError) throw itemsError;

      // Processar dados por cliente
      const customerMap = new Map<string, CustomerSalesData>();

      // Processar pedidos WooCommerce
      wcOrders?.forEach(order => {
        const customerId = order.customer_id?.toString() || 'guest';
        const customerName = order.billing?.first_name && order.billing?.last_name 
          ? `${order.billing.first_name} ${order.billing.last_name}`
          : 'Cliente Convidado';
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customer_id: order.customer_id || 0,
            customer_name: customerName,
            customer_email: order.billing?.email || '',
            total_orders: 0,
            total_spent: 0,
            average_order_value: 0,
            last_order_date: order.date_created || '',
            order_frequency: 0,
            maleta_purchases: 0,
            wc_orders: 0
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.total_orders++;
        customer.wc_orders++;
        customer.total_spent += parseFloat(order.total || '0');
        
        if (order.date_created && order.date_created > customer.last_order_date) {
          customer.last_order_date = order.date_created;
        }
      });

      // Processar retornos de maletas
      maletaReturns?.forEach(returnItem => {
        const customerName = returnItem.maleta?.customer_name || 'Cliente Desconhecido';
        const customerEmail = returnItem.maleta?.customer_email || '';
        const customerId = `maleta_${customerEmail || customerName}`;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customer_id: 0,
            customer_name: customerName,
            customer_email: customerEmail,
            total_orders: 0,
            total_spent: 0,
            average_order_value: 0,
            last_order_date: returnItem.return_date || '',
            order_frequency: 0,
            maleta_purchases: 0,
            wc_orders: 0
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.total_orders++;
        customer.maleta_purchases++;

        // Calcular valor da venda baseado nos itens vendidos
        const soldItems = Array.isArray(returnItem.items_sold) ? returnItem.items_sold : [];
        const saleValue = soldItems.reduce((total: number, item: any) => {
          const maletaItem = maletaItems?.find(mi => mi.id === item.item_id);
          const price = maletaItem ? Number(maletaItem.price) || 0 : 0;
          const quantity = Number(item.quantity_sold) || 0;
          return total + (price * quantity);
        }, 0);

        customer.total_spent += saleValue;

        if (returnItem.return_date && returnItem.return_date > customer.last_order_date) {
          customer.last_order_date = returnItem.return_date;
        }
      });

      // Calcular métricas finais
      const customersArray = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        average_order_value: customer.total_orders > 0 ? customer.total_spent / customer.total_orders : 0,
        order_frequency: customer.total_orders // Pode ser melhorado com cálculo baseado em período
      }));

      // Ordenar por total gasto (maior primeiro)
      return customersArray.sort((a, b) => b.total_spent - a.total_spent);
    },
    enabled: !!currentOrganization && isConfigured,
    staleTime: 5 * 60 * 1000,
  });
};