import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Types
export interface LocalCustomer {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  username?: string;
  billing?: any;
  shipping?: any;
  is_paying_customer?: boolean;
  avatar_url?: string;
  meta_data?: any[];
  orders_count?: number;
  total_spent?: number;
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
}

// Fetch all customers
export const useLocalCustomers = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-customers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('first_name');

      if (error) {
        console.error('Erro ao buscar clientes locais:', error);
        throw error;
      }

      return data as LocalCustomer[] || [];
    },
    enabled: !!currentOrganization,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Fetch single customer
export const useLocalCustomer = (customerId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-customer', customerId, currentOrganization?.id],
    queryFn: async () => {
      if (!customerId || !currentOrganization) return null;

      const { data, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar cliente local:', error);
        throw error;
      }

      return data as LocalCustomer;
    },
    enabled: !!customerId && !!currentOrganization,
  });
};

// Create customer
export const useCreateLocalCustomer = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (customerData: Omit<LocalCustomer, 'id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Generate a temporary ID for local storage
      const tempId = Math.floor(Math.random() * 1000000) + Date.now();
      
      const newCustomer = {
        ...customerData,
        id: tempId,
        organization_id: currentOrganization.id,
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
      };

      // Insert into local database
      const { data, error } = await supabase
        .from('wc_customers')
        .insert(newCustomer)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'customer',
          entity_id: data.id,
          operation: 'create',
          data: newCustomer,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-customers'] });
      toast.success('Cliente criado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cliente', {
        description: error.message,
      });
    },
  });
};

// Update customer
export const useUpdateLocalCustomer = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocalCustomer> }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      const updatedData = {
        ...data,
        date_modified: new Date().toISOString(),
      };

      // Update in local database
      const { data: result, error } = await supabase
        .from('wc_customers')
        .update(updatedData)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'customer',
          entity_id: id,
          operation: 'update',
          data: { id, ...updatedData },
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-customers'] });
      queryClient.invalidateQueries({ queryKey: ['local-customer'] });
      toast.success('Cliente atualizado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar cliente', {
        description: error.message,
      });
    },
  });
};

// Delete customer
export const useDeleteLocalCustomer = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (customerId: number) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Get customer data before deletion for sync queue
      const { data: customerData } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', currentOrganization.id)
        .single();

      // Mark as deleted in local database (soft delete)
      const { error } = await supabase
        .from('wc_customers')
        .update({ 
          role: 'deleted',
          date_modified: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('organization_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao deletar cliente local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'customer',
          entity_id: customerId,
          operation: 'delete',
          data: customerData || {},
        });

      return customerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-customers'] });
      toast.success('Cliente removido localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover cliente', {
        description: error.message,
      });
    },
  });
};

// Get representatives (customers with is_representative meta)
export const useLocalRepresentatives = () => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-representatives', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('wc_customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('first_name');

      if (error) {
        console.error('Erro ao buscar representantes locais:', error);
        throw error;
      }

      // Filter representatives based on meta_data
      return (data || []).filter((customer: LocalCustomer) => {
        const metaData = customer.meta_data || [];
        return metaData.some((meta: any) => 
          meta.key === 'is_representative' && meta.value === true
        );
      });
    },
    enabled: !!currentOrganization,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};