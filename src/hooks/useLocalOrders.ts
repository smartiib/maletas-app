import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

// Types
export interface LocalOrder {
  id: number;
  order_number: string;
  status: string;
  currency?: string;
  total: number;
  customer_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: any;
  shipping_address?: any;
  payment_method?: string;
  payment_methods?: any;
  notes?: string;
  line_items?: any[];
  metadata?: any;
  date_created?: string;
  date_modified?: string;
  organization_id?: string;
}

// Fetch all orders
export const useLocalOrders = (filters?: { 
  status?: string; 
  customer_id?: number;
  page?: number;
  perPage?: number;
}) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-orders', currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('wc_orders')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('date_created', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      // Pagination
      if (filters?.page && filters?.perPage) {
        const from = (filters.page - 1) * filters.perPage;
        const to = from + filters.perPage - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos locais:', error);
        throw error;
      }

      return data as LocalOrder[] || [];
    },
    enabled: !!currentOrganization,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Fetch single order
export const useLocalOrder = (orderId?: number) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-order', orderId, currentOrganization?.id],
    queryFn: async () => {
      if (!orderId || !currentOrganization) return null;

      const { data, error } = await supabase
        .from('wc_orders')
        .select('*')
        .eq('id', orderId)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar pedido local:', error);
        throw error;
      }

      return data as LocalOrder;
    },
    enabled: !!orderId && !!currentOrganization,
  });
};

// Create order
export const useCreateLocalOrder = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (orderData: Omit<LocalOrder, 'id' | 'organization_id'>) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Generate a temporary ID and order number
      const tempId = Math.floor(Math.random() * 1000000) + Date.now();
      const orderNumber = `ORD${String(tempId).slice(-6)}`;
      
      const newOrder = {
        ...orderData,
        id: tempId,
        number: orderNumber,
        organization_id: currentOrganization.id,
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
        status: orderData.status || 'pending',
        currency: orderData.currency || 'BRL',
        total: orderData.total || 0,
      };

      // Insert into local database
      const { data, error } = await supabase
        .from('wc_orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar pedido local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'order',
          entity_id: data.id,
          operation: 'create',
          data: newOrder,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      toast.success('Pedido criado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar pedido', {
        description: error.message,
      });
    },
  });
};

// Update order
export const useUpdateLocalOrder = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LocalOrder> }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      const updatedData = {
        ...data,
        date_modified: new Date().toISOString(),
      };

      // Update in local database
      const { data: result, error } = await supabase
        .from('wc_orders')
        .update(updatedData)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar pedido local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'order',
          entity_id: id,
          operation: 'update',
          data: { id, ...updatedData },
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      queryClient.invalidateQueries({ queryKey: ['local-order'] });
      toast.success('Pedido atualizado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar pedido', {
        description: error.message,
      });
    },
  });
};

// Update order status
export const useUpdateLocalOrderStatus = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      const updatedData = {
        status,
        date_modified: new Date().toISOString(),
        // Set completion date if status is completed
        ...(status === 'completed' && { date_completed: new Date().toISOString() }),
      };

      // Update in local database
      const { data: result, error } = await supabase
        .from('wc_orders')
        .update(updatedData)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status do pedido local:', error);
        throw error;
      }

      // Add to sync queue with high priority for status updates
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'order',
          entity_id: id,
          operation: 'update',
          data: { id, status },
          priority: 1, // High priority for status updates
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      queryClient.invalidateQueries({ queryKey: ['local-order'] });
      toast.success('Status do pedido atualizado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status do pedido', {
        description: error.message,
      });
    },
  });
};

// Delete order (cancel)
export const useDeleteLocalOrder = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (orderId: number) => {
      if (!currentOrganization) throw new Error('Organização não encontrada');

      // Get order data before deletion for sync queue
      const { data: orderData } = await supabase
        .from('wc_orders')
        .select('*')
        .eq('id', orderId)
        .eq('organization_id', currentOrganization.id)
        .single();

      // Mark as cancelled (soft delete)
      const { error } = await supabase
        .from('wc_orders')
        .update({ 
          status: 'cancelled',
          date_modified: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('organization_id', currentOrganization.id);

      if (error) {
        console.error('Erro ao cancelar pedido local:', error);
        throw error;
      }

      // Add to sync queue
      await supabase
        .from('sync_queue')
        .insert({
          organization_id: currentOrganization.id,
          entity_type: 'order',
          entity_id: orderId,
          operation: 'update',
          data: { ...orderData, status: 'cancelled' },
        });

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-orders'] });
      toast.success('Pedido cancelado localmente e agendado para sincronização');
    },
    onError: (error: any) => {
      toast.error('Erro ao cancelar pedido', {
        description: error.message,
      });
    },
  });
};

// Get order statistics
export const useLocalOrderStats = (dateRange?: { from: string; to: string }) => {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['local-order-stats', currentOrganization?.id, dateRange],
    queryFn: async () => {
      if (!currentOrganization) return null;

      let query = supabase
        .from('wc_orders')
        .select('status, total, date_created')
        .eq('organization_id', currentOrganization.id);

      if (dateRange) {
        query = query
          .gte('date_created', dateRange.from)
          .lte('date_created', dateRange.to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas de pedidos:', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        total_orders: data?.length || 0,
        total_revenue: data?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0,
        pending: data?.filter(order => order.status === 'pending').length || 0,
        processing: data?.filter(order => order.status === 'processing').length || 0,
        completed: data?.filter(order => order.status === 'completed').length || 0,
        cancelled: data?.filter(order => order.status === 'cancelled').length || 0,
      };

      return stats;
    },
    enabled: !!currentOrganization,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};