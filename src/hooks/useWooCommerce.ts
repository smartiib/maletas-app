import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wooCommerceAPI } from '@/services/woocommerce';
import { useOrganization } from '@/contexts/OrganizationContext';

// Products
export const useWooCommerceProducts = (page = 1, perPage = 10) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id, page, perPage],
    queryFn: () => wooCommerceAPI.getProducts({ page, per_page: perPage }),
    enabled: !!currentOrganization,
  });
};

// Filtered Products
export const useWooCommerceFilteredProducts = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-products', currentOrganization?.id, page, perPage],
    queryFn: () => wooCommerceAPI.getProducts({ page, per_page: perPage }),
    enabled: !!currentOrganization,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
};

// Single Product
export const useWooCommerceProduct = (id: string) => {
  return useQuery({
    queryKey: ['woocommerce-product', id],
    queryFn: () => wooCommerceAPI.getProduct(id),
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
    queryFn: () => wooCommerceAPI.getOrders({ page, per_page: perPage }),
    enabled: !!currentOrganization,
  });
};

// Filtered Orders
export const useWooCommerceFilteredOrders = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-orders', currentOrganization?.id, page, perPage],
    queryFn: () => wooCommerceAPI.getOrders({ page, per_page: perPage }),
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
    queryFn: () => wooCommerceAPI.getCustomers({ page, per_page: perPage }),
    enabled: !!currentOrganization,
  });
};

// Filtered Customers
export const useWooCommerceFilteredCustomers = (page = 1, perPage = 20) => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-customers', currentOrganization?.id, page, perPage],
    queryFn: () => wooCommerceAPI.getCustomers({ page, per_page: perPage }),
    enabled: !!currentOrganization,
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: false,
  });
};

// WooCommerce Config
export const useWooCommerceConfig = () => {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['woocommerce-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return null;
      }
      return {
        url: currentOrganization.woocommerce_url,
        consumerKey: currentOrganization.woocommerce_consumer_key,
        consumerSecret: currentOrganization.woocommerce_consumer_secret,
      };
    },
    enabled: !!currentOrganization,
    staleTime: Infinity, // Never refetch
    refetchOnWindowFocus: false,
    select: (data) => {
      if (!data) {
        return {
          isConfigured: false,
          url: '',
          consumerKey: '',
          consumerSecret: '',
        };
      }
      const isConfigured = !!data.url && !!data.consumerKey && !!data.consumerSecret;
      return {
        isConfigured,
        url: data.url || '',
        consumerKey: data.consumerKey || '',
        consumerSecret: data.consumerSecret || '',
      };
    },
  });
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

// Representatives hook
export const useRepresentantes = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['woocommerce-representantes', currentOrganization?.id],
    queryFn: () => wooCommerceAPI.getCustomers({ role: 'representative' }),
    enabled: !!currentOrganization,
  });
};
