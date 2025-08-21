import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Minus, ChevronDown, ChevronRight, History, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateStock } from '@/hooks/useWooCommerce';
import { stockHistoryService, StockHistoryEntry } from './StockHistoryService';
import { StockHistory } from './StockHistory';
import { useProductVariations, DbVariation, useProductVariationsByIds } from '@/hooks/useProductVariations';

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
  const [tempStock, setTempStock] = useState<{ [key: string]: string }>({});
  const totalStock = getTotalStock(product);
  const stockStatus = getStockStatus(totalStock, product.stock_status);
  const hasVariations = product.type === 'variable' && product.variations?.length > 0;

  // Buscar dados completos das variações para exibir SKU e atributos corretamente
  const { data: dbVariationsParent = [] } = useProductVariations(hasVariations ? product.id : undefined);

  const variationIds = useMemo(() => {
    return hasVariations ? (product.variations?.map((v: any) => v.id).filter(Boolean) as number[]) : [];
  }, [hasVariations, product.variations]);

  const shouldFetchByIds = (dbVariationsParent?.length ?? 0) === 0 && variationIds.length > 0;
  const { data: dbVariationsByIds = [] } = useProductVariationsByIds(shouldFetchByIds ? variationIds : undefined);

  const effectiveVariations: DbVariation[] = (dbVariationsParent?.length ?? 0) > 0 ? dbVariationsParent : dbVariationsByIds;

  const variationInfoById = useMemo(() => {
    const map = new Map<number, DbVariation>();
    effectiveVariations.forEach((v) => map.set(v.id, v));
    return map;
  }, [effectiveVariations]);

  const updateStock = async (productId: number, variationId: number | null, change: number, reason: string) => {
    const isVariation = variationId !== null;
    const currentStock = isVariation 
      ? product.variations?.find((v: any) => v.id === variationId)?.stock_quantity || 0
      : product.stock_quantity || 0;
    
    const newStock = Math.max(0, currentStock + change);
    
    // Atualizar visualmente primeiro (otimistic update)
    if (isVariation) {
      // Atualizar variação no produto
      const variationIndex = product.variations?.findIndex((v: any) => v.id === variationId);
      if (variationIndex !== -1 && product.variations) {
        product.variations[variationIndex].stock_quantity = newStock;
      }
    } else {
      // Atualizar produto principal
      product.stock_quantity = newStock;
    }
    
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
      // Em caso de erro, reverter a mudança visual
      if (isVariation) {
        const variationIndex = product.variations?.findIndex((v: any) => v.id === variationId);
        if (variationIndex !== -1 && product.variations) {
          product.variations[variationIndex].stock_quantity = currentStock;
        }
      } else {
        product.stock_quantity = currentStock;
      }
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

  const handleStockInputChange = (productId: number, variationId: number | null, value: string) => {
    const key = variationId ? `${productId}-${variationId}` : `${productId}`;
    setTempStock(prev => ({ ...prev, [key]: value }));
  };

  const handleStockInputKeyDown = (e: React.KeyboardEvent, productId: number, variationId: number | null) => {
    if (e.key === 'Enter') {
      const key = variationId ? `${productId}-${variationId}` : `${productId}`;
      const value = tempStock[key];
      if (value !== undefined) {
        const newStock = parseInt(value) || 0;
        updateStockDirect(productId, variationId, newStock);
        setTempStock(prev => ({ ...prev, [key]: undefined }));
      }
    }
  };

  const handleStockInputBlur = (productId: number, variationId: number | null) => {
    const key = variationId ? `${productId}-${variationId}` : `${productId}`;
    const value = tempStock[key];
    if (value !== undefined) {
      const newStock = parseInt(value) || 0;
      updateStockDirect(productId, variationId, newStock);
      setTempStock(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const getDisplayStock = (productId: number, variationId: number | null, currentStock: number) => {
    const key = variationId ? `${productId}-${variationId}` : `${productId}`;
    return tempStock[key] !== undefined ? tempStock[key] : currentStock.toString();
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
          
          {/* Miniatura da imagem */}
          <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0].src} 
                alt={product.images[0].alt || product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="w-6 h-6" />
              </div>
            )}
          </div>
          
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
                value={getDisplayStock(product.id, null, totalStock)}
                onChange={(e) => handleStockInputChange(product.id, null, e.target.value)}
                onKeyDown={(e) => handleStockInputKeyDown(e, product.id, null)}
                onBlur={() => handleStockInputBlur(product.id, null)}
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
            const vInfo = variationInfoById.get(variation.id);

            const displayAttributes: string =
              vInfo?.attributes?.length
                ? (vInfo.attributes as any[]).map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')
                : (variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ') || 'Variação');

            const displaySku = (vInfo?.sku && String(vInfo.sku).trim()) 
              ? String(vInfo.sku).trim() 
              : ((variation.sku && String(variation.sku).trim()) ? String(variation.sku).trim() : 'N/A');
            
            return (
              <div key={`${product.id}-${variation.id}`} className="p-4 pl-12 flex items-center justify-between border-b last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {displayAttributes}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>SKU: {displaySku}</span>
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
                      value={getDisplayStock(product.id, variation.id, variationStock)}
                      onChange={(e) => handleStockInputChange(product.id, variation.id, e.target.value)}
                      onKeyDown={(e) => handleStockInputKeyDown(e, product.id, variation.id)}
                      onBlur={() => handleStockInputBlur(product.id, variation.id)}
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
