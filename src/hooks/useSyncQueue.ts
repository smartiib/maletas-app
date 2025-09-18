import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ProcessQueueParams {
  batchSize?: number;
  maxRetries?: number;
}

export const useSyncQueue = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  // Query para buscar itens pendentes na queue
  const queueStatusQuery = useQuery({
    queryKey: ['sync-queue-status', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      
      const { data, error } = await supabase
        .from('sync_queue')
        .select('status, entity_type, operation')
        .eq('organization_id', currentOrganization.id);

      if (error) {
        throw new Error(error.message);
      }

      // Group by status and entity type
      const summary = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byEntityType: {
          products: { pending: 0, processing: 0, completed: 0, failed: 0 },
          customers: { pending: 0, processing: 0, completed: 0, failed: 0 },
          orders: { pending: 0, processing: 0, completed: 0, failed: 0 }
        }
      };

      data?.forEach(item => {
        if (item.status === 'pending') summary.pending++;
        else if (item.status === 'processing') summary.processing++;
        else if (item.status === 'completed') summary.completed++;
        else if (item.status === 'failed') summary.failed++;
        
        if (item.entity_type && summary.byEntityType[item.entity_type as keyof typeof summary.byEntityType]) {
          const entityType = item.entity_type as keyof typeof summary.byEntityType;
          if (item.status === 'pending') summary.byEntityType[entityType].pending++;
          else if (item.status === 'processing') summary.byEntityType[entityType].processing++;
          else if (item.status === 'completed') summary.byEntityType[entityType].completed++;
          else if (item.status === 'failed') summary.byEntityType[entityType].failed++;
        }
      });

      return summary;
    },
    enabled: !!currentOrganization?.id,
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  // Mutation para processar a queue
  const processQueueMutation = useMutation({
    mutationFn: async ({ batchSize = 10, maxRetries = 3 }: ProcessQueueParams) => {
      if (!currentOrganization?.id) {
        throw new Error('Organização não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('sync-manager', {
        body: {
          operation: 'process_queue',
          organizationId: currentOrganization.id,
          batchSize,
          maxRetries
        }
      });

      if (error) {
        throw new Error(`Erro ao processar queue: ${error.message}`);
      }

      return data as { processed: number; errors: number; skipped: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sync-queue-status', currentOrganization?.id] });
      
      if (result.processed > 0) {
        toast.success(
          `Queue processada: ${result.processed} itens`,
          { 
            description: result.errors > 0 ? `${result.errors} erros` : 'Todos os itens processados com sucesso'
          }
        );
      } else {
        toast.info('Nenhum item pendente na queue');
      }
    },
    onError: (error) => {
      toast.error('Erro ao processar queue', {
        description: error.message
      });
    }
  });

  // Helper para adicionar item à queue
  const addToQueue = async (entityType: string, entityId: number, operation: string, data: any) => {
    if (!currentOrganization?.id) return;

    const { error } = await supabase
      .from('sync_queue')
      .insert({
        organization_id: currentOrganization.id,
        entity_type: entityType,
        entity_id: entityId,
        operation,
        data,
        status: 'pending',
        priority: operation === 'delete' ? 10 : 0
      });

    if (error) {
      console.error('Erro ao adicionar à queue:', error);
      toast.error('Erro ao agendar sincronização');
    } else {
      queryClient.invalidateQueries({ queryKey: ['sync-queue-status', currentOrganization?.id] });
    }
  };

  return {
    queueStatus: queueStatusQuery.data,
    isLoadingQueue: queueStatusQuery.isLoading,
    processQueue: processQueueMutation.mutate,
    isProcessingQueue: processQueueMutation.isPending,
    addToQueue
  };
};