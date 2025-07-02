import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Minus, ChevronDown, ChevronRight, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateStock } from '@/hooks/useWooCommerce';
import { stockHistoryService, StockHistoryEntry } from './StockHistoryService';
import { StockHistory } from './StockHistory';

interface StockRowProps {
  product: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getTotalStock: (product: any) => number;
  getStockStatus: (stock: number, status: string) => { label: string; color: string };
}

export const StockRow: React.FC<StockRowProps> = ({
  product,
  isExpanded,
  onToggleExpand,
  getTotalStock,
  getStockStatus
}) => {
  const updateStockMutation = useUpdateStock();
  const totalStock = getTotalStock(product);
  const stockStatus = getStockStatus(totalStock, product.stock_status);
  const hasVariations = product.type === 'variable' && product.variations?.length > 0;

  const updateStock = async (productId: number, variationId: number | null, change: number, reason: string) => {
    const isVariation = variationId !== null;
    const currentStock = isVariation 
      ? product.variations?.find((v: any) => v.id === variationId)?.stock_quantity || 0
      : product.stock_quantity || 0;
    
    const newStock = Math.max(0, currentStock + change);
    
    // Adicionar ao histórico
    stockHistoryService.addEntry({
      productId,
      variationId: variationId || undefined,
      type: 'adjustment',
      quantity: change,
      previousStock: currentStock,
      newStock,
      reason,
      user: 'Usuário Atual' // Aqui você pode pegar o usuário logado
    });

    try {
      await updateStockMutation.mutateAsync({
        productId,
        newStock,
        variationId: variationId || undefined
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
    }
  };

  const updateStockDirect = async (productId: number, variationId: number | null, newStock: number) => {
    const isVariation = variationId !== null;
    const currentStock = isVariation 
      ? product.variations?.find((v: any) => v.id === variationId)?.stock_quantity || 0
      : product.stock_quantity || 0;
    
    const change = newStock - currentStock;
    
    if (change !== 0) {
      await updateStock(productId, variationId, change, 'Ajuste manual direto');
    }
  };

  const getLastChange = (productId: number, variationId?: number) => {
    const lastChange = stockHistoryService.getLastChange(productId, variationId);
    if (!lastChange) return 'Nunca alterado';
    
    const date = new Date(lastChange.date);
    const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Há poucos minutos';
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="border rounded-lg">
      {/* Produto Principal */}
      <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center space-x-4 flex-1">
          {hasVariations && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
          
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{product.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>SKU: {product.sku || 'N/A'}</span>
              <Badge variant={stockStatus.color as any}>
                {stockStatus.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!hasVariations && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStock(product.id, null, -1, 'Ajuste manual')}
                disabled={totalStock <= 0 || updateStockMutation.isPending}
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <Input
                type="number"
                value={totalStock}
                onChange={(e) => {
                  const newStock = parseInt(e.target.value) || 0;
                  updateStockDirect(product.id, null, newStock);
                }}
                className="w-20 text-center"
                disabled={updateStockMutation.isPending}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStock(product.id, null, 1, 'Ajuste manual')}
                disabled={updateStockMutation.isPending}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          {hasVariations && (
            <div className="text-center">
              <div className="font-medium text-lg">{totalStock}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {getLastChange(product.id)}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <History className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Histórico de Estoque - {product.name}</DialogTitle>
              </DialogHeader>
              <StockHistory productId={product.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Variações */}
      {hasVariations && isExpanded && (
        <div className="border-t bg-muted/20">
          {product.variations?.map((variation: any) => {
            const variationStock = variation.stock_quantity || 0;
            const variationStatus = getStockStatus(variationStock, variation.stock_status);
            
            return (
              <div key={variation.id} className="p-4 pl-12 flex items-center justify-between border-b last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>SKU: {variation.sku || 'N/A'}</span>
                    <Badge variant={variationStatus.color as any} className="text-xs">
                      {variationStatus.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(product.id, variation.id, -1, 'Ajuste manual')}
                      disabled={variationStock <= 0 || updateStockMutation.isPending}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={variationStock}
                      onChange={(e) => {
                        const newStock = parseInt(e.target.value) || 0;
                        updateStockDirect(product.id, variation.id, newStock);
                      }}
                      className="w-20 text-center"
                      disabled={updateStockMutation.isPending}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(product.id, variation.id, 1, 'Ajuste manual')}
                      disabled={updateStockMutation.isPending}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground w-32 text-right">
                    {getLastChange(product.id, variation.id)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};