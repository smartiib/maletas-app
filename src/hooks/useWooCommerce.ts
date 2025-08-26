
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { wooCommerceService, Customer, Product, Order } from '@/services/woocommerce';

interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isConfigured: boolean;
}

export const useWooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();

  const { data: config, isLoading } = useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async (): Promise<WooCommerceConfig> => {
      if (!currentOrganization) {
        return {
          apiUrl: '',
          consumerKey: '',
          consumerSecret: '',
          isConfigured: false
        };
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('wc_base_url, wc_consumer_key, wc_consumer_secret')
        .eq('id', currentOrganization.id)
        .single();

      if (error) {
        console.error('Erro ao buscar configuração WooCommerce:', error);
        return {
          apiUrl: '',
          consumerKey: '',
          consumerSecret: '',
          isConfigured: false
        };
      }

      const isConfigured = !!(data?.wc_base_url && data?.wc_consumer_key && data?.wc_consumer_secret);

      return {
        apiUrl: data?.wc_base_url || '',
        consumerKey: data?.wc_consumer_key || '',
        consumerSecret: data?.wc_consumer_secret || '',
        isConfigured
      };
    },
    enabled: !!currentOrganization,
  });

  return {
    config: config || {
      apiUrl: '',
      consumerKey: '',
      consumerSecret: '',
      isConfigured: false
    },
    isConfigured: config?.isConfigured || false,
    isLoading
  };
};

export const useSaveWooCommerceConfig = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (config: {
      apiUrl: string;
      consumerKey: string;
      consumerSecret: string;
    }) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          wc_base_url: config.apiUrl,
          wc_consumer_key: config.consumerKey,
          wc_consumer_secret: config.consumerSecret,
        })
        .eq('id', currentOrganization.id);

      if (error) {
        console.error('Erro ao salvar configuração WooCommerce:', error);
        throw new Error(error.message || 'Erro ao salvar configuração');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['woocommerce-config', currentOrganization?.id] 
      });
      toast.success('Configurações do WooCommerce salvas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  });
};

// Customers hooks
export const useCustomers = (page: number = 1, perPage: number = 10) => {
  const { config } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['woocommerce-customers', page, perPage],
    queryFn: async () => {
      if (!config.isConfigured) return { data: [], total: 0 };
      return wooCommerceService.getCustomers(config, page, perPage);
    },
    enabled: config.isConfigured,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.createCustomer(config, customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Customer> }) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.updateCustomer(config, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-customers'] });
    },
  });
};

// Products hooks
export const useProducts = (page: number = 1, perPage: number = 10) => {
  const { config } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['woocommerce-products', page, perPage],
    queryFn: async () => {
      if (!config.isConfigured) return { data: [], total: 0 };
      return wooCommerceService.getProducts(config, page, perPage);
    },
    enabled: config.isConfigured,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.createProduct(config, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.updateProduct(config, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
  });
};

// Orders hooks
export const useOrders = (page: number = 1, perPage: number = 10) => {
  const { config } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['woocommerce-orders', page, perPage],
    queryFn: async () => {
      if (!config.isConfigured) return { data: [], total: 0 };
      return wooCommerceService.getOrders(config, page, perPage);
    },
    enabled: config.isConfigured,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.createOrder(config, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      return wooCommerceService.updateOrderStatus(config, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-orders'] });
    },
  });
};

// Stock hooks
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { config } = useWooCommerceConfig();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      variationId, 
      newStock 
    }: { 
      productId: number; 
      variationId?: number; 
      newStock: number; 
    }) => {
      if (!config.isConfigured) throw new Error('WooCommerce não configurado');
      
      if (variationId) {
        return wooCommerceService.updateVariationStock(config, productId, variationId, newStock);
      } else {
        return wooCommerceService.updateProductStock(config, productId, newStock);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-variations'] });
    },
  });
};

// Representatives hooks
export const useRepresentantes = () => {
  const { config } = useWooCommerceConfig();
  
  return useQuery({
    queryKey: ['woocommerce-representantes'],
    queryFn: async () => {
      if (!config.isConfigured) return [];
      // Buscar clientes que são representantes (têm meta_data is_representative = true)
      const customers = await wooCommerceService.getCustomers(config, 1, 100);
      return customers.data.filter((customer: Customer) => 
        customer.meta_data?.some((meta: any) => 
          meta.key === 'is_representative' && meta.value === true
        )
      );
    },
    enabled: config.isConfigured,
  });
};
