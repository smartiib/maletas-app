import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wooCommerceAPI, Product, Order, Customer, WooCommerceConfig, CreateOrderData, WooCommerceTestResult } from '@/services/woocommerce';
import { toast } from '@/hooks/use-toast';

// Products hooks
export const useProducts = (page = 1, search = '', status = '', category = '') => {
  return useQuery({
    queryKey: ['products', page, search, status, category],
    queryFn: () => wooCommerceAPI.getProducts(page, 20, search, status, category),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useAllProducts = (search = '', status = '', category = '') => {
  return useQuery({
    queryKey: ['all-products', search, status, category],
    queryFn: async () => {
      if (!search) {
        return wooCommerceAPI.getAllProducts('', status, category);
      }
      
      // Para SKUs (formato com letras seguidas de números), buscar por SKU parcial também
      const isSKUFormat = /^[A-Z]+\d*$/i.test(search);
      if (isSKUFormat) {
        console.log('Detectado formato SKU (parcial ou completo), buscando:', search);
        // Primeiro tenta busca por SKU exato
        const skuResults = await wooCommerceAPI.searchProductsBySku(search);
        if (skuResults.length > 0) {
          return skuResults;
        }
        // Se não encontrar exato, busca parcial no search geral (inclui SKUs parciais)
        return wooCommerceAPI.searchProducts(search);
      }
      
      return wooCommerceAPI.searchProducts(search);
    },
    enabled: !!wooCommerceAPI.getConfig(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => wooCommerceAPI.getCategories(),
    enabled: !!wooCommerceAPI.getConfig(),
    staleTime: 60 * 60 * 1000, // 60 minutos
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
    onMutate: async ({ productId, newStock, variationId }) => {
      // Cancelar queries pendentes para evitar conflitos
      await queryClient.cancelQueries({ queryKey: ['all-products'] });
      
      // Atualização otimista - atualizar o cache imediatamente
      queryClient.setQueryData(['all-products'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((product: any) => {
          if (product.id === productId) {
            if (variationId && product.variations) {
              // Atualizar variação específica
              return {
                ...product,
                variations: product.variations.map((variation: any) => 
                  variation.id === variationId 
                    ? { ...variation, stock_quantity: newStock }
                    : variation
                )
              };
            } else {
              // Atualizar produto principal
              return { ...product, stock_quantity: newStock };
            }
          }
          return product;
        });
      });
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a produtos para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast({
        title: "Sucesso",
        description: "Estoque atualizado com sucesso!",
      });
    },
    onError: (error) => {
      // Em caso de erro, invalidar para reverter mudanças otimistas
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
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
      const enhancedOrder = {
        ...order,
        meta_data: [
          ...(order.meta_data || []),
          { key: 'order_source', value: 'platform' },
          { key: 'created_by_user_id', value: 0 },
          { key: 'created_by_user_name', value: 'Sistema' },
        ]
      };
      return wooCommerceAPI.createOrder(enhancedOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
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

export const useAllOrders = (status = '') => {
  return useQuery({
    queryKey: ['all-orders', status],
    queryFn: () => wooCommerceAPI.getAllOrders(status),
    enabled: !!wooCommerceAPI.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutos
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
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado!",
      });
    },
  });
};

// Customers hooks - usa paginação da API
export const useCustomers = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => wooCommerceAPI.getCustomers(page, 20, search),
    enabled: !!wooCommerceAPI.getConfig(),
  });
};

export const useAllCustomers = (search = '') => {
  return useQuery({
    queryKey: ['all-customers', search],
    queryFn: () => wooCommerceAPI.getAllCustomers(search),
    enabled: !!wooCommerceAPI.getConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutos
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
      queryClient.invalidateQueries({ queryKey: ['all-customers'] });
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
      queryClient.invalidateQueries({ queryKey: ['all-customers'] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    },
  });
};

// Hook para buscar representantes - Modo demo
export const useRepresentantes = () => {
  return useQuery({
    queryKey: ['representantes'],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Desabilitado no modo demo
  });
};

// Configuration hooks melhorados
export const useWooCommerceConfig = () => {
  const queryClient = useQueryClient();
  
  // Teste de conexão básico (compatibilidade)
  const testConnection = useMutation({
    mutationFn: async (config: WooCommerceConfig) => {
      const result = await wooCommerceAPI.testConnectionDetailed(config);
      if (!result.success) {
        throw new Error(result.message);
      }
      wooCommerceAPI.setConfig(config);
      
      // Após conexão bem-sucedida, criar webhook automaticamente
      try {
        const { webhook, secret } = await wooCommerceAPI.setupStockWebhook();
        console.log('Webhook criado automaticamente:', webhook.id);
        
        // Salvar o secret gerado no Supabase via Edge Function
        await fetch('https://umrrcgfsbazjqopaxkoi.supabase.co/functions/v1/save-webhook-secret', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ secret }),
        });
        
        result.webhook_created = true;
      } catch (error) {
        console.error('Erro ao criar webhook:', error);
        result.webhook_error = error instanceof Error ? error.message : 'Erro desconhecido';
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      const webhookMessage = result.webhook_created 
        ? ' Webhook configurado automaticamente.'
        : result.webhook_error 
        ? ` Aviso: ${result.webhook_error}` 
        : '';
      
      toast({
        title: "Conexão Estabelecida",
        description: `${result.message} ${result.store_info?.name ? `Loja: ${result.store_info.name}` : ''}${webhookMessage}`,
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

  // Teste detalhado conforme documentação
  const testConnectionDetailed = useMutation({
    mutationFn: (config: WooCommerceConfig) => wooCommerceAPI.testConnectionDetailed(config),
  });

  // Validação de configuração
  const validateConfig = (config: WooCommerceConfig) => {
    return wooCommerceAPI.validateConfig(config);
  };

  const saveConfig = (config: WooCommerceConfig) => {
    const validation = validateConfig(config);
    if (validation) {
      toast({
        title: "Configuração Inválida",
        description: validation.message,
        variant: "destructive",
      });
      return false;
    }

    wooCommerceAPI.setConfig(config);
    toast({
      title: "Configuração Salva",
      description: "Configurações do WooCommerce foram salvas com sucesso",
    });
    return true;
  };

  const disconnect = () => {
    wooCommerceAPI.setConfig(null as any);
    queryClient.invalidateQueries();
    toast({
      title: "Desconectado",
      description: "WooCommerce foi desconectado com sucesso",
    });
  };

  // Webhooks hooks
  const webhooks = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => wooCommerceAPI.getWebhooks(),
    enabled: !!wooCommerceAPI.getConfig(),
  });

  const setupWebhook = useMutation({
    mutationFn: () => wooCommerceAPI.setupStockWebhook(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: "Webhook Criado",
        description: "Webhook configurado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no Webhook",
        description: error instanceof Error ? error.message : "Erro ao configurar webhook",
        variant: "destructive",
      });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: (id: number) => wooCommerceAPI.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: "Webhook Removido",
        description: "Webhook removido com sucesso!",
      });
    },
  });

  return {
    config: wooCommerceAPI.getConfig(),
    testConnection,
    testConnectionDetailed,
    validateConfig,
    saveConfig,
    disconnect,
    isConfigured: !!wooCommerceAPI.getConfig(),
    // Webhook management
    webhooks,
    setupWebhook,
    deleteWebhook,
  };
};
