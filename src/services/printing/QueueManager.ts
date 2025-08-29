
import { supabase } from '@/integrations/supabase/client';
import { PrintJob, PrintJobStatus } from '@/types/printing';

export class QueueManager {
  /**
   * Adicionar job à fila de impressão
   */
  async addJob(jobData: Omit<PrintJob, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      console.log('QueueManager.addJob called with:', jobData);
      
      const { data, error } = await supabase
        .from('print_queue')
        .insert({
          ...jobData,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao adicionar job à fila: ${error.message}`);
      }
      
      console.log('Job adicionado à fila:', data.id);
      return data.id;
    } catch (error) {
      console.error('Erro ao adicionar job à fila:', error);
      throw error;
    }
  }

  /**
   * Buscar jobs da fila
   */
  async getQueue(status?: PrintJobStatus): Promise<PrintJob[]> {
    try {
      let query = supabase
        .from('print_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Erro ao buscar fila de impressão: ${error.message}`);
      }
      
      return data as PrintJob[];
    } catch (error) {
      console.error('Erro ao buscar fila de impressão:', error);
      return [];
    }
  }

  /**
   * Atualizar status do job
   */
  async updateJobStatus(
    jobId: string, 
    status: PrintJobStatus, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'processing') {
        updateData.processing_started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        updateData.processing_completed_at = new Date().toISOString();
      }
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const { error } = await supabase
        .from('print_queue')
        .update(updateData)
        .eq('id', jobId);
      
      if (error) {
        throw new Error(`Erro ao atualizar status do job: ${error.message}`);
      }
      
      console.log(`Job ${jobId} atualizado para status: ${status}`);
    } catch (error) {
      console.error('Erro ao atualizar status do job:', error);
      throw error;
    }
  }

  /**
   * Processar fila de impressão
   */
  async processQueue(): Promise<void> {
    try {
      console.log('Processando fila de impressão...');
      
      const pendingJobs = await this.getQueue('pending');
      
      if (pendingJobs.length === 0) {
        console.log('Nenhum job pendente na fila');
        return;
      }
      
      console.log(`Processando ${pendingJobs.length} jobs pendentes`);
      
      for (const job of pendingJobs) {
        try {
          await this.updateJobStatus(job.id, 'processing');
          
          // Simular processamento do job
          await this.processJob(job);
          
          await this.updateJobStatus(job.id, 'completed');
          
          console.log(`Job ${job.id} processado com sucesso`);
        } catch (jobError) {
          console.error(`Erro ao processar job ${job.id}:`, jobError);
          await this.updateJobStatus(job.id, 'failed', jobError.message);
        }
      }
    } catch (error) {
      console.error('Erro ao processar fila:', error);
      throw error;
    }
  }

  /**
   * Processar job individual
   */
  private async processJob(job: PrintJob): Promise<void> {
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Aqui será implementada a lógica específica de cada tipo de impressão
    console.log(`Processando job tipo: ${job.template_type}`);
    
    // Na Fase 2, aqui será adicionada a lógica real de impressão
    // baseada no tipo de impressora e template
  }

  /**
   * Cancelar job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'cancelled');
      console.log(`Job ${jobId} cancelado`);
    } catch (error) {
      console.error(`Erro ao cancelar job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Limpar jobs antigos
   */
  async cleanupOldJobs(daysOld: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { error } = await supabase
        .from('print_queue')
        .delete()
        .in('status', ['completed', 'failed', 'cancelled'])
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) {
        throw new Error(`Erro ao limpar jobs antigos: ${error.message}`);
      }
      
      console.log(`Jobs antigos (>${daysOld} dias) removidos da fila`);
    } catch (error) {
      console.error('Erro ao limpar jobs antigos:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas da fila
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('print_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h
      
      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }
      
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: data.length
      };
      
      data.forEach(job => {
        stats[job.status as keyof typeof stats]++;
      });
      
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas da fila:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };
    }
  }
}
