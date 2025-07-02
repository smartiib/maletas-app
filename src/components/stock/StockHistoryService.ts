export interface StockHistoryEntry {
  id: string;
  productId: number;
  variationId?: number;
  date: string;
  type: 'adjustment' | 'sale' | 'maleta' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  user?: string;
  maleta_id?: string;
}

class StockHistoryService {
  private readonly STORAGE_KEY = 'stock_history';

  private getHistory(): StockHistoryEntry[] {
    const history = localStorage.getItem(this.STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  }

  private saveHistory(history: StockHistoryEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  addEntry(entry: Omit<StockHistoryEntry, 'id' | 'date'>): void {
    const history = this.getHistory();
    const newEntry: StockHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    
    history.unshift(newEntry); // Adiciona no início para ordem cronológica
    
    // Manter apenas os últimos 1000 registros para não sobrecarregar o localStorage
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    this.saveHistory(history);
  }

  getProductHistory(productId: number, variationId?: number): StockHistoryEntry[] {
    const history = this.getHistory();
    return history.filter(entry => 
      entry.productId === productId && 
      (variationId ? entry.variationId === variationId : !entry.variationId)
    );
  }

  getLastChange(productId: number, variationId?: number): StockHistoryEntry | null {
    const productHistory = this.getProductHistory(productId, variationId);
    return productHistory.length > 0 ? productHistory[0] : null;
  }

  getAllHistory(): StockHistoryEntry[] {
    return this.getHistory();
  }
}

export const stockHistoryService = new StockHistoryService();