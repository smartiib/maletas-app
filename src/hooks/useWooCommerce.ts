
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wooCommerceAPI } from '@/services/woocommerce';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Products
export const useWooCommerceProducts = (page = 1, perPage = 10) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getProducts(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Products
export const useWooCommerceFilteredProducts = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getProducts(perPage),
    enabled: !!currentOrganization,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
};

// Single Product
export const useWooCommerceProduct = (id: string) => {
  return useQuery({
    queryKey: ['woocommerce-product', id],
    queryFn: () => wooCommerceAPI.getProduct(parseInt(id)),
    enabled: !!id,
  });
};

// Categories
export const useWooCommerceCategories = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-categories', currentOrganization?.id],
    queryFn: () => wooCommerceAPI.getCategories(),
    enabled: !!currentOrganization,
  });
};

// Orders
export const useWooCommerceOrders = (page = 1, perPage = 10) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-orders', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getOrders(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Orders
export const useWooCommerceFilteredOrders = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-orders', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getOrders(perPage),
    enabled: !!currentOrganization,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
};

// Customers
export const useWooCommerceCustomers = (page = 1, perPage = 10) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-customers', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getCustomers(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Customers
export const useWooCommerceFilteredCustomers = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-customers', currentOrganization?.id, page, perPage],
    // Ajuste: serviço espera number, não objeto
    queryFn: () => wooCommerceAPI.getCustomers(perPage),
    enabled: !!currentOrganization,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
};

// WooCommerce Config with full functionality
export const useWooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return null;
      }
      
      // Access WooCommerce settings from organization metadata or settings
      const wooSettings = (currentOrganization as any).settings as any;
      
      return {
        url: wooSettings?.woocommerce_url || '',
        consumerKey: wooSettings?.woocommerce_consumer_key || '',
        consumerSecret: wooSettings?.woocommerce_consumer_secret || '',
      };
    },
    enabled: !!currentOrganization,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    select: (data) => {
      if (!data) {
        return {
          isConfigured: false,
          apiUrl: '',
          url: '',
          consumerKey: '',
          consumerSecret: '',
        };
      }
      const isConfigured = !!data.url && !!data.consumerKey && !!data.consumerSecret;
      return {
        isConfigured,
        apiUrl: data.url || '',
        url: data.url || '',
        consumerKey: data.consumerKey || '',
        consumerSecret: data.consumerSecret || '',
      };
    },
  });

  const testConnection = useMutation({
    mutationFn: async (config: { apiUrl: string; consumerKey: string; consumerSecret: string }) => {
      try {
        // Test the connection by making a simple API call
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/system_status`, {
          headers: {
            'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Falha na conexão com WooCommerce');
        }
        
        toast.success('Conexão testada com sucesso!');
        return { success: true };
      } catch (error) {
        toast.error('Erro ao testar conexão');
        throw error;
      }
    }
  });

  const saveConfig = async (config: { apiUrl: string; consumerKey: string; consumerSecret: string }) => {
    if (!currentOrganization) return;

    try {
      const updatedSettings = {
        ...(currentOrganization as any).settings,
        woocommerce_url: config.apiUrl,
        woocommerce_consumer_key: config.consumerKey,
        woocommerce_consumer_secret: config.consumerSecret,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      // Update organization in context if available
      queryClient.invalidateQueries({ queryKey: ['woocommerce-config'] });
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const webhooksQuery = useQuery({
    queryKey: ['woocommerce-webhooks', currentOrganization?.id],
    queryFn: async () => {
      const config = configQuery.data;
      if (!config?.isConfigured) return [];

      try {
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
          headers: {
            'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch webhooks');
        return await response.json();
      } catch (error) {
        console.error('Error fetching webhooks:', error);
        return [];
      }
    },
    enabled: !!configQuery.data?.isConfigured,
  });

  const setupWebhook = useMutation({
    mutationFn: async () => {
      const config = configQuery.data;
      if (!config?.isConfigured) throw new Error('WooCommerce not configured');

      const webhookData = {
        name: 'Stock Sync Webhook',
        topic: 'product.updated',
        delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
        status: 'active'
      };

      const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) throw new Error('Failed to create webhook');
      return await response.json();
    },
    onSuccess: () => {
      webhooksQuery.refetch();
      toast.success('Webhook criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating webhook:', error);
      toast.error('Erro ao criar webhook');
    }
  });

  return {
    config: configQuery.data,
    isConfigured: configQuery.data?.isConfigured || false,
    testConnection,
    saveConfig,
    webhooks: webhooksQuery,
    setupWebhook,
    isLoading: configQuery.isLoading
  };
};

// Customer hooks
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: (customerData: any) => wooCommerceAPI.createCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers', currentOrganization?.id] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => wooCommerceAPI.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers', currentOrganization?.id] });
    },
  });
};

// Order hooks
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: (orderData: any) => wooCommerceAPI.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders', currentOrganization?.id] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => wooCommerceAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders', currentOrganization?.id] });
    },
  });
};

// Product hooks
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: (productData: any) => wooCommerceAPI.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => wooCommerceAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
    },
  });
};

// Stock hook
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: ({ productId, newStock, variationId }: { productId: number; newStock: number; variationId?: number }) => 
      wooCommerceAPI.updateStock(productId, newStock, variationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
    },
  });
};

// Representatives hook - Fixed parameter type
export const useRepresentantes = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['woocommerce-representantes', currentOrganization?.id],
    // Ajuste: remover objeto, serviço espera number; usar um limite razoável
    queryFn: () => wooCommerceAPI.getCustomers(100),
    enabled: !!currentOrganization,
  });
};
