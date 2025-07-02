import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wooCommerceAPI, Product, Order, Customer, WooCommerceConfig, CreateOrderData } from '@/services/woocommerce';
import { authService } from '@/services/auth';
import { toast } from '@/hooks/use-toast';

// Products hooks
export const useProducts = (page = 1, search = '', status = '') => {
  return useQuery({
    queryKey: ['products', page, search, status],
    queryFn: () => wooCommerceAPI.getProducts(page, 20, search, status),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => wooCommerceAPI.getProduct(id),
    enabled: !!id && !!wooCommerceAPI.getConfig(),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product: Partial<Product>) => wooCommerceAPI.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar produto",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, product }: { id: number; product: Partial<Product> }) => 
      wooCommerceAPI.updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, newStock, variationId }: { productId: number; newStock: number; variationId?: number }) => 
      wooCommerceAPI.updateStock(productId, newStock, variationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sucesso",
        description: "Estoque atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estoque",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => wooCommerceAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Sucesso",
        description: "Produto deletado com sucesso!",
      });
    },
  });
};

// Orders hooks com informações de usuário
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: CreateOrderData) => {
      const user = authService.getUser();
      const enhancedOrder = {
        ...order,
        meta_data: [
          ...(order.meta_data || []),
          { key: 'order_source', value: 'platform' },
          { key: 'created_by_user_id', value: user?.id || 0 },
          { key: 'created_by_user_name', value: user?.display_name || 'Sistema' },
        ]
      };
      return wooCommerceAPI.createOrder(enhancedOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!",
      });
    },
  });
};

export const useOrders = (page = 1, status = '') => {
  return useQuery({
    queryKey: ['orders', page, status],
    queryFn: () => wooCommerceAPI.getOrders(page, 20, status),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => wooCommerceAPI.getOrder(id),
    enabled: !!id && !!wooCommerceAPI.getConfig(),
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      wooCommerceAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado!",
      });
    },
  });
};

// Customers hooks
export const useCustomers = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => wooCommerceAPI.getCustomers(page, 20, search),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useBirthdayCustomers = (month?: number) => {
  return useQuery({
    queryKey: ['birthday-customers', month],
    queryFn: () => wooCommerceAPI.getBirthdayCustomers(month),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useCustomer = (id: number) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => wooCommerceAPI.getCustomer(id),
    enabled: !!id && !!wooCommerceAPI.getConfig(),
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: Partial<Customer>) => wooCommerceAPI.createCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customer }: { id: number; customer: Partial<Customer> }) => 
      wooCommerceAPI.updateCustomer(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    },
  });
};

// Hook para buscar representantes do WordPress
export const useRepresentantes = () => {
  return useQuery({
    queryKey: ['representantes'],
    queryFn: () => authService.getRepresentantes(),
    enabled: !!authService.getToken(),
  });
};

// Configuration hooks
export const useWooCommerceConfig = () => {
  const queryClient = useQueryClient();
  
  const testConnection = useMutation({
    mutationFn: async (config: WooCommerceConfig) => {
      wooCommerceAPI.setConfig(config);
      const isConnected = await wooCommerceAPI.testConnection();
      if (!isConnected) {
        throw new Error('Falha na conexão com WooCommerce');
      }
      return isConnected;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Sucesso",
        description: "Conexão com WooCommerce estabelecida!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro de Conexão",
        description: error instanceof Error ? error.message : "Erro ao conectar com WooCommerce",
        variant: "destructive",
      });
    },
  });

  const saveConfig = (config: WooCommerceConfig) => {
    wooCommerceAPI.setConfig(config);
    toast({
      title: "Configuração Salva",
      description: "Configurações do WooCommerce foram salvas",
    });
  };

  return {
    config: wooCommerceAPI.getConfig(),
    testConnection,
    saveConfig,
    isConfigured: !!wooCommerceAPI.getConfig(),
  };
};
