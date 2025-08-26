
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { useUpdateStock } from '@/hooks/useWooCommerce';
import { Product } from '@/types';

interface SimpleProductStockEditorProps {
  product: Product;
}

const SimpleProductStockEditor: React.FC<SimpleProductStockEditorProps> = ({ product }) => {
  const updateStockMutation = useUpdateStock();
  const [tempStock, setTempStock] = React.useState<string>('');

  if (!product?.id || product.type === 'variable') return null;

  const currentStock = Number(product.stock_quantity || 0);
  const displayValue = tempStock !== '' ? tempStock : String(currentStock);

  const handleChange = (value: string) => {
    setTempStock(value);
  };

  const commit = async (newValue: number) => {
    if (currentStock === newValue) return;

    await updateStockMutation.mutateAsync({
      productId: Number(product.id),
      newStock: Math.max(0, Number(newValue) || 0),
    });

    // Limpa valor temporário após salvar
    setTempStock('');
  };

  const inc = async (delta: number) => {
    const next = Math.max(0, currentStock + delta);
    await commit(next);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Gerenciar Estoque</div>
      <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium">Produto Simples</div>
          <div className="text-xs text-muted-foreground">SKU: {product.sku || `Produto-${product.id}`}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => inc(-1)}
            disabled={updateStockMutation.isPending || currentStock <= 0}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            className="w-16 text-center h-7 text-sm"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = parseInt(displayValue) || 0;
                commit(val);
              }
            }}
            onBlur={() => {
              const val = parseInt(displayValue) || 0;
              commit(val);
            }}
            disabled={updateStockMutation.isPending}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => inc(1)}
            disabled={updateStockMutation.isPending}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleProductStockEditor;
