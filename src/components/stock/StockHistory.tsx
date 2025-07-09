import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { stockHistoryService, StockHistoryEntry } from './StockHistoryService';

interface StockHistoryProps {
  productId: number;
  variationId?: number;
}

export const StockHistory: React.FC<StockHistoryProps> = ({ productId, variationId }) => {
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const historyData = await stockHistoryService.getProductHistory(productId, variationId);
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading stock history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [productId, variationId]);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando histórico...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum histórico de movimentação encontrado.
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'adjustment': return 'Ajuste';
      case 'manual_adjustment': return 'Ajuste Manual';
      case 'sale': return 'Venda';
      case 'refund': return 'Reembolso';
      case 'webhook_sync': return 'Sync WooCommerce';
      case 'maleta': return 'Maleta';
      case 'return': return 'Devolução';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'destructive';
      case 'refund': return 'default';
      case 'webhook_sync': return 'secondary';
      case 'maleta': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Badge variant={entry.quantity > 0 ? 'default' : 'secondary'}>
                {entry.quantity > 0 ? '+' : ''}{entry.quantity}
              </Badge>
              <span className="font-medium">{entry.reason}</span>
              <Badge variant={getTypeColor(entry.type) as any} className="text-xs">
                {getTypeLabel(entry.type)}
              </Badge>
              {entry.source && entry.source !== 'internal' && (
                <Badge variant="outline" className="text-xs">
                  {entry.source === 'woocommerce' ? 'WooCommerce' : entry.source}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span>{formatDate(entry.date)}</span>
              {entry.user && <span> • {entry.user}</span>}
              {entry.maleta_id && <span> • Maleta {entry.maleta_id}</span>}
              {entry.wcOrderId && <span> • Pedido #{entry.wcOrderId}</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Estoque: {entry.previousStock} → {entry.newStock}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};