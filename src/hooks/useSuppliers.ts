
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';

// Define types for the suppliers table
interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  cnpj?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
  is_active: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

interface SupplierInsert {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  cnpj?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
  is_active?: boolean;
  organization_id: string;
}

interface SupplierUpdate {
  name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  cnpj?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
  is_active?: boolean;
}

interface ProductSupplier {
  id: string;
  supplier_id: string;
  product_id: number;
  supplier_sku?: string;
  cost_price?: number;
  minimum_order_quantity: number;
  lead_time_days?: number;
  is_primary: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

interface ProductSupplierInsert {
  supplier_id: string;
  product_id: number;
  supplier_sku?: string;
  cost_price?: number;
  minimum_order_quantity?: number;
  lead_time_days?: number;
  is_primary?: boolean;
  organization_id: string;
}

interface ProductSupplierUpdate {
  supplier_sku?: string;
  cost_price?: number;
  minimum_order_quantity?: number;
  lead_time_days?: number;
  is_primary?: boolean;
}

export const useSuppliers = () => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['suppliers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('suppliers' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      return data as unknown as Supplier[];
    },
    enabled: !!currentOrganization && isConfigured,
  });
};

export const useSupplier = (id: string) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['supplier', currentOrganization?.id, id],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured) {
        return null;
      }

      const { data, error } = await supabase
        .from('suppliers' as any)
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .single();

      if (error) throw error;
      return data as unknown as Supplier;
    },
    enabled: !!id && !!currentOrganization && isConfigured,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (supplier: Omit<SupplierInsert, 'organization_id'>) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { data, error } = await supabase
        .from('suppliers' as any)
        .insert({
          ...supplier,
          organization_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentOrganization?.id] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: SupplierUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers' as any)
        .update(supplier)
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentOrganization?.id] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers' as any)
        .delete()
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', currentOrganization?.id] });
    },
  });
};

// Product-Supplier relationships
export const useProductSuppliers = (productId?: number) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['product-suppliers', currentOrganization?.id, productId],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured || !productId) {
        return [];
      }

      let query = supabase
        .from('product_suppliers' as any)
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('product_id', productId)
        .eq('organization_id', currentOrganization.id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!productId && !!currentOrganization && isConfigured,
  });
};

export const useSupplierProducts = (supplierId?: string) => {
  const { currentOrganization } = useOrganization();
  const { isConfigured } = useWooCommerceConfig();

  return useQuery({
    queryKey: ['supplier-products', currentOrganization?.id, supplierId],
    queryFn: async () => {
      if (!currentOrganization || !isConfigured || !supplierId) {
        return [];
      }

      const { data, error } = await supabase
        .from('product_suppliers' as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ProductSupplier[];
    },
    enabled: !!supplierId && !!currentOrganization && isConfigured,
  });
};

export const useCreateProductSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: Omit<ProductSupplierInsert, 'organization_id'>) => {
      if (!currentOrganization) {
        throw new Error('Nenhuma organização selecionada');
      }

      const { data: result, error } = await supabase
        .from('product_suppliers' as any)
        .insert({
          ...data,
          organization_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;
      return result as unknown as ProductSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', currentOrganization?.id] });
    },
  });
};

export const useUpdateProductSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, ...data }: ProductSupplierUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('product_suppliers' as any)
        .update(data)
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as ProductSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', currentOrganization?.id] });
    },
  });
};

export const useDeleteProductSupplier = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_suppliers' as any)
        .delete()
        .eq('id', id)
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products', currentOrganization?.id] });
    },
  });
};
