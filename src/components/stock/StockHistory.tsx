import React from 'react';
import { Badge } from '@/components/ui/badge';
import { stockHistoryService } from './StockHistoryService';

interface StockHistoryProps {
  productId: number;
  variationId?: number;
}

export const StockHistory: React.FC<StockHistoryProps> = ({ productId, variationId }) => {
  const history = stockHistoryService.getProductHistory(productId, variationId);

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
      case 'sale': return 'Venda';
      case 'maleta': return 'Maleta';
      case 'return': return 'Devolução';
      default: return type;
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
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(entry.type)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span>{formatDate(entry.date)}</span>
              {entry.user && <span> • {entry.user}</span>}
              {entry.maleta_id && <span> • Maleta {entry.maleta_id}</span>}
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