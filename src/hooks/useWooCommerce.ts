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
    queryFn: () => wooCommerceAPI.getProducts(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Products
export const useWooCommerceFilteredProducts = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id, page, perPage],
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
    queryFn: () => wooCommerceAPI.getOrders(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Orders
export const useWooCommerceFilteredOrders = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-orders', currentOrganization?.id, page, perPage],
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
    queryFn: () => wooCommerceAPI.getCustomers(perPage),
    enabled: !!currentOrganization,
  });
};

// Filtered Customers
export const useWooCommerceFilteredCustomers = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-customers', currentOrganization?.id, page, perPage],
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
      if (!currentOrganization) return null;

      console.log('[WooConfig] Fetching organization settings from Supabase...');
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganization.id)
        .single();

      if (error) {
        console.error('[WooConfig] Error fetching settings:', error);
        return {
          isConfigured: false,
          apiUrl: '',
          url: '',
          consumerKey: '',
          consumerSecret: '',
        };
      }

      const wooSettings = ((data?.settings ?? {}) as any) || {};
      const url = wooSettings?.woocommerce_url || '';
      const consumerKey = wooSettings?.woocommerce_consumer_key || '';
      const consumerSecret = wooSettings?.woocommerce_consumer_secret || '';
      const isConfigured = !!url && !!consumerKey && !!consumerSecret;

      return {
        isConfigured,
        apiUrl: url,
        url,
        consumerKey,
        consumerSecret,
      };
    },
    enabled: !!currentOrganization,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const testConnection = useMutation({
    mutationFn: async (config: { apiUrl: string; consumerKey: string; consumerSecret: string }) => {
      let lastError;
      
      // Try Basic Auth first
      try {
        const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/system_status`, {
          headers: {
            'Authorization': `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`
          }
        });
        
        if (response.ok) {
          toast.success('Conexão testada com sucesso!');
          return { success: true };
        }
        
        const errorBody = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorBody);
        } catch (e) {
          errorData = { message: errorBody };
        }
        
        lastError = `${response.status}: ${errorData?.message || response.statusText}`;
        
        // If auth error, try query params fallback
        if (response.status === 401 || response.status === 403) {
          const urlWithParams = new URL(`${config.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/system_status`);
          urlWithParams.searchParams.set('consumer_key', config.consumerKey);
          urlWithParams.searchParams.set('consumer_secret', config.consumerSecret);
          
          const fallbackResponse = await fetch(urlWithParams.toString());
          if (fallbackResponse.ok) {
            toast.success('Conexão testada com sucesso! (usando parâmetros de consulta)');
            return { success: true };
          }
          
          const fallbackErrorBody = await fallbackResponse.text();
          let fallbackErrorData;
          try {
            fallbackErrorData = JSON.parse(fallbackErrorBody);
          } catch (e) {
            fallbackErrorData = { message: fallbackErrorBody };
          }
          lastError = `${fallbackResponse.status}: ${fallbackErrorData?.message || fallbackResponse.statusText}`;
        }
      } catch (error) {
        lastError = error.message;
      }
      
      throw new Error(`Falha na conexão com WooCommerce: ${lastError}`);
    },
    meta: {
      onError: (error: any) => {
        console.error('[WooConfig] Test connection failed:', error);
      }
    }
  });

  const saveConfig = async (config: { apiUrl: string; consumerKey: string; consumerSecret: string }) => {
    if (!currentOrganization) return;

    // Carregar settings atuais do banco para mesclar e não sobrescrever outras configs
    const { data: currentData, error: loadError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', currentOrganization.id)
      .single();

    if (loadError) {
      console.error('[WooConfig] Erro ao carregar settings atuais:', loadError);
      toast.error('Erro ao carregar configurações atuais');
      return;
    }

    const baseSettings = ((currentData?.settings ?? {}) as any) || {};

    const updatedSettings = {
      ...baseSettings,
      woocommerce_url: config.apiUrl,
      woocommerce_consumer_key: config.consumerKey,
      woocommerce_consumer_secret: config.consumerSecret,
    };

    const { error } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', currentOrganization.id);

    if (error) {
      console.error('[WooConfig] Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
      return;
    }

    // Garantir que a UI reflita imediatamente
    await queryClient.invalidateQueries({ queryKey: ['woocommerce-config', currentOrganization.id] });
    toast.success('Configuração salva com sucesso!');
  };

  const webhooksQuery = useQuery({
    queryKey: ['woocommerce-webhooks', currentOrganization?.id],
    queryFn: async () => {
      const cfg = configQuery.data;
      if (!cfg?.isConfigured) return [];

      try {
        // Try Basic Auth first
        let response = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
          headers: {
            'Authorization': `Basic ${btoa(`${cfg.consumerKey}:${cfg.consumerSecret}`)}`
          }
        });

        // If auth error, try query params fallback
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          const urlWithParams = new URL(`${cfg.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`);
          urlWithParams.searchParams.set('consumer_key', cfg.consumerKey);
          urlWithParams.searchParams.set('consumer_secret', cfg.consumerSecret);
          response = await fetch(urlWithParams.toString());
        }

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorBody);
          } catch (e) {
            errorData = { message: errorBody };
          }
          throw new Error(`${response.status}: ${errorData?.message || 'Failed to fetch webhooks'}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching webhooks:', error);
        throw error;
      }
    },
    enabled: !!configQuery.data?.isConfigured,
  });

  const setupWebhook = useMutation({
    mutationFn: async () => {
      const cfg = configQuery.data;
      if (!cfg?.isConfigured) throw new Error('WooCommerce not configured');

      const webhookData = {
        name: 'Stock Sync Webhook',
        topic: 'product.updated',
        delivery_url: 'https://umrrchfsbazjqopaxkoi.supabase.co/functions/v1/woocommerce-stock-webhook',
        status: 'active'
      };

      const response = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/wp-json/wc/v3/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${cfg.consumerKey}:${cfg.consumerSecret}`)}`,
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['woocommerce-customers', currentOrganization?.id] });
      await queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'wc-customers-filtered',
      });
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

// Updated Stock hook with proper error handling and WooCommerce config check
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async ({
      productId,
      newStock,
      variationId,
    }: {
      productId: number;
      newStock: number;
      variationId?: number;
    }) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada. Não é possível salvar no Supabase.');
      }

      console.log(`[useUpdateStock] Iniciando atualização de estoque:`, {
        productId,
        variationId,
        newStock,
        organizationId: currentOrganization.id
      });

      const stockStatus = newStock > 0 ? 'instock' : 'outofstock';

      // 1) Buscar configuração do WooCommerce ANTES de tentar atualizar
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganization.id)
        .single();

      if (orgError) {
        console.error('[useUpdateStock] Erro ao buscar configurações da organização:', orgError);
        throw new Error('Erro ao buscar configurações da organização');
      }

      const settings = orgData?.settings as any;
      const wooConfig = {
        url: settings?.woocommerce_url || '',
        consumerKey: settings?.woocommerce_consumer_key || '',
        consumerSecret: settings?.woocommerce_consumer_secret || ''
      };

      const isWooConfigured = !!(wooConfig.url && wooConfig.consumerKey && wooConfig.consumerSecret);

      console.log('[useUpdateStock] Configuração WooCommerce:', {
        hasUrl: !!wooConfig.url,
        hasConsumerKey: !!wooConfig.consumerKey,
        hasConsumerSecret: !!wooConfig.consumerSecret,
        isConfigured: isWooConfigured
      });

      // 2) Persistir primeiro no Supabase (sempre funciona)
      if (variationId) {
        // Variação
        const { data: updatedVar, error: updateVarError } = await supabase
          .from('wc_product_variations')
          .update({
            stock_quantity: newStock,
            stock_status: stockStatus,
            updated_at: new Date().toISOString(),
            organization_id: currentOrganization.id,
          })
          .eq('id', variationId)
          .select('id')
          .maybeSingle();

        if (updateVarError || !updatedVar) {
          console.log('[useUpdateStock] Update variação falhou, tentando upsert...', {
            variationId,
            updateVarError,
          });

          const { error: upsertVarError } = await supabase
            .from('wc_product_variations')
            .upsert(
              {
                id: variationId,
                parent_id: productId,
                stock_quantity: newStock,
                stock_status: stockStatus,
                organization_id: currentOrganization.id,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (upsertVarError) {
            console.error('[useUpdateStock] Erro no upsert da variação:', upsertVarError);
            throw new Error(`Erro ao salvar variação no banco: ${upsertVarError.message}`);
          }
        }
      } else {
        // Produto simples
        const { data: updatedProd, error: updateProdError } = await supabase
          .from('wc_products')
          .update({
            stock_quantity: newStock,
            stock_status: stockStatus,
            updated_at: new Date().toISOString(),
            organization_id: currentOrganization.id,
          })
          .eq('id', productId)
          .select('id')
          .maybeSingle();

        if (updateProdError || !updatedProd) {
          console.log('[useUpdateStock] Update produto falhou, tentando upsert...', {
            productId,
            updateProdError,
          });

          const { error: upsertProdError } = await supabase
            .from('wc_products')
            .upsert(
              {
                id: productId,
                stock_quantity: newStock,
                stock_status: stockStatus,
                organization_id: currentOrganization.id,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (upsertProdError) {
            console.error('[useUpdateStock] Erro no upsert do produto:', upsertProdError);
            throw new Error(`Erro ao salvar produto no banco: ${upsertProdError.message}`);
          }
        }
      }

      console.log('[useUpdateStock] Salvo com sucesso no Supabase');

      // 3) Tentar sincronizar no WooCommerce (se configurado)
      if (isWooConfigured) {
        try {
          console.log('[useUpdateStock] Tentando sincronizar com WooCommerce...');
          const result = await wooCommerceAPI.updateStock(productId, newStock, variationId);
          console.log('[useUpdateStock] Sincronizado com WooCommerce com sucesso');
          return result;
        } catch (wooError: any) {
          console.warn('[useUpdateStock] Falha na sincronização com WooCommerce (não crítico):', wooError);
          // Não falha a operação, apenas avisa
          toast.warning('Estoque salvo localmente, mas falha na sincronização com WooCommerce: ' + wooError.message);
          return { success: true, warning: 'Sincronização WooCommerce falhou' };
        }
      } else {
        console.log('[useUpdateStock] WooCommerce não configurado, apenas salvo localmente');
        toast.success('Estoque atualizado localmente (WooCommerce não configurado)');
        return { success: true, localOnly: true };
      }
    },
    onSuccess: async (result) => {
      console.log('[useUpdateStock] Operação concluída:', result);
      
      // 4) Invalidar queries para refletir as mudanças na UI
      await queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'woocommerce-products',
      });
      
      await queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'wc-variations' || q.queryKey[0] === 'wc-variations-by-ids'),
      });

      if (!result?.warning && !result?.localOnly) {
        toast.success('Estoque atualizado com sucesso!');
      }
    },
    onError: (error: any) => {
      console.error('[useUpdateStock] Erro na operação:', error);
      toast.error(`Erro ao atualizar estoque: ${error.message}`);
    }
  });
};

// Representatives hook - Fixed parameter type
export const useRepresentantes = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['woocommerce-representantes', currentOrganization?.id],
    queryFn: () => wooCommerceAPI.getCustomers(100),
    enabled: !!currentOrganization,
  });
};

// Combined hook for compatibility
export const useWooCommerce = () => {
  const { data: products = [] } = useWooCommerceFilteredProducts();
  const { data: categories = [] } = useWooCommerceCategories();
  const { data: orders = [] } = useWooCommerceFilteredOrders();
  const { data: customers = [] } = useWooCommerceFilteredCustomers();
  
  return {
    products,
    categories,
    orders,
    customers
  };
};
