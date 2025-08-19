import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

// Create Customer
export const useCreateCustomer = () => {
  const { currentOrganization } = useOrganization();
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async (customerData: any) => {
      if (!config || !currentOrganization) {
        throw new Error('WooCommerce não configurado ou organização não selecionada');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar cliente');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
};

// Update Customer
export const useUpdateCustomer = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar cliente');
      }

      return response.json();
    },
  });
};

// Create Order
export const useCreateOrder = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pedido');
      }

      return response.json();
    },
  });
};

// Update Order Status
export const useUpdateOrderStatus = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status do pedido');
      }

      return response.json();
    },
  });
};

// Create Product
export const useCreateProduct = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async (productData: any) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar produto');
      }

      return response.json();
    },
  });
};

// Update Product
export const useUpdateProduct = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar produto');
      }

      return response.json();
    },
  });
};

// Update Stock - agora aceita produto simples e variação
export const useUpdateStock = () => {
  const { config } = useWooCommerceConfig();
  
  return useMutation({
    mutationFn: async ({ productId, newStock, variationId }: { productId: number; newStock: number; variationId?: number }) => {
      if (!config) {
        throw new Error('WooCommerce não configurado');
      }

      const baseUrl = config.apiUrl.replace(/\/$/, '');
      const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
      const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      };

      const body = JSON.stringify({ stock_quantity: newStock, manage_stock: true });

      const url = variationId
        ? `${baseUrl}/wp-json/wc/v3/products/${productId}/variations/${variationId}`
        : `${baseUrl}/wp-json/wc/v3/products/${productId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar estoque');
      }

      return response.json();
    },
  });
};

// Representatives (for compatibility)
export const useRepresentantes = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['representatives-wc', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization && isConfigured,
  });
};
