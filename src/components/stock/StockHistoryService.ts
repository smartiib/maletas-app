import { supabase } from '@/integrations/supabase/client';

export interface StockHistoryEntry {
  id: string;
  productId: number;
  variationId?: number;
  date: string;
  type: 'adjustment' | 'sale' | 'refund' | 'manual_adjustment' | 'webhook_sync' | 'maleta' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  source?: 'internal' | 'woocommerce' | 'webhook';
  user?: string;
  userId?: string;
  maleta_id?: string;
  wcOrderId?: number;
  metadata?: any;
}

class StockHistoryService {
  private readonly STORAGE_KEY = 'stock_history';

  async addEntry(entry: Omit<StockHistoryEntry, 'id' | 'date' | 'source'>): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('add_stock_history_entry', {
        p_product_id: entry.productId,
        p_variation_id: entry.variationId || null,
        p_type: entry.type,
        p_quantity_change: entry.quantity,
        p_previous_stock: entry.previousStock,
        p_new_stock: entry.newStock,
        p_reason: entry.reason,
        p_source: 'internal',
        p_user_name: entry.user || 'Sistema',
        p_wc_order_id: entry.wcOrderId || null,
        p_metadata: {
          ...entry.metadata,
          maleta_id: entry.maleta_id
        }
      });

      if (error) {
        console.error('Error adding stock history entry:', error);
        // Fallback para localStorage em caso de erro
        this.addEntryToLocalStorage(entry);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addEntry:', error);
      // Fallback para localStorage em caso de erro
      this.addEntryToLocalStorage(entry);
      return null;
    }
  }

  async getProductHistory(productId: number, variationId?: number): Promise<StockHistoryEntry[]> {
    try {
      let query = supabase
        .from('stock_history')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (variationId) {
        query = query.eq('variation_id', variationId);
      } else {
        query = query.is('variation_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stock history:', error);
        return this.getProductHistoryFromLocalStorage(productId, variationId);
      }

      return (data || []).map(this.transformDbEntry);
    } catch (error) {
      console.error('Error in getProductHistory:', error);
      return this.getProductHistoryFromLocalStorage(productId, variationId);
    }
  }

  getLastChange(productId: number, variationId?: number): StockHistoryEntry | null {
    // Usar localStorage como cache rápido para última alteração
    const localHistory = this.getProductHistoryFromLocalStorage(productId, variationId);
    return localHistory.length > 0 ? localHistory[0] : null;
  }

  async getAllHistory(): Promise<StockHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching all stock history:', error);
        return this.getHistoryFromLocalStorage();
      }

      return (data || []).map(this.transformDbEntry);
    } catch (error) {
      console.error('Error in getAllHistory:', error);
      return this.getHistoryFromLocalStorage();
    }
  }

  private transformDbEntry(dbEntry: any): StockHistoryEntry {
    return {
      id: dbEntry.id,
      productId: dbEntry.product_id,
      variationId: dbEntry.variation_id,
      date: dbEntry.created_at,
      type: dbEntry.type,
      quantity: dbEntry.quantity_change,
      previousStock: dbEntry.previous_stock,
      newStock: dbEntry.new_stock,
      reason: dbEntry.reason || '',
      source: dbEntry.source,
      user: dbEntry.user_name || 'Sistema',
      userId: dbEntry.user_id,
      wcOrderId: dbEntry.wc_order_id,
      maleta_id: dbEntry.metadata?.maleta_id,
      metadata: dbEntry.metadata
    };
  }

  // Métodos de fallback para localStorage
  private addEntryToLocalStorage(entry: Omit<StockHistoryEntry, 'id' | 'date' | 'source'>): void {
    const history = this.getHistoryFromLocalStorage();
    const newEntry: StockHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      source: 'internal'
    };
    
    history.unshift(newEntry);
    
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    this.saveHistoryToLocalStorage(history);
  }

  private getHistoryFromLocalStorage(): StockHistoryEntry[] {
    const history = localStorage.getItem(this.STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  }

  private getProductHistoryFromLocalStorage(productId: number, variationId?: number): StockHistoryEntry[] {
    const history = this.getHistoryFromLocalStorage();
    return history.filter(entry => 
      entry.productId === productId && 
      (variationId ? entry.variationId === variationId : !entry.variationId)
    );
  }

  private saveHistoryToLocalStorage(history: StockHistoryEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  // Método para migrar dados do localStorage para o banco (execução única)
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const localHistory = this.getHistoryFromLocalStorage();
      if (localHistory.length === 0) return;

      console.log(`Migrando ${localHistory.length} registros do localStorage para o banco...`);
      
      for (const entry of localHistory) {
        await supabase.rpc('add_stock_history_entry', {
          p_product_id: entry.productId,
          p_variation_id: entry.variationId || null,
          p_type: entry.type,
          p_quantity_change: entry.quantity,
          p_previous_stock: entry.previousStock,
          p_new_stock: entry.newStock,
          p_reason: entry.reason,
          p_source: 'internal',
          p_user_name: entry.user || 'Sistema Migrado',
          p_metadata: { 
            migrated_from_local: true, 
            original_date: entry.date,
            maleta_id: entry.maleta_id 
          }
        });
      }

      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Migração do histórico concluída com sucesso!');
    } catch (error) {
      console.error('Erro durante migração do histórico:', error);
    }
  }
}

export const stockHistoryService = new StockHistoryService();