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
import LastChangeLabel from './LastChangeLabel';

interface StockRowProps {
  product: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getTotalStock: (product: any) => number;
  getStockStatus: (stock: number, status: string) => { label: string; color: string };
}

interface NormalizedVariation {
  id: number;
  stock_quantity: number;
  stock_status: string;
  sku?: string;
  attributes: Array<{ name: string; option: string }>;
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

  // Normalize variation IDs from product.variations (can be objects or just IDs)
  const variationIds = useMemo(() => {
    if (!hasVariations) return [];
    const ids = (product.variations || [])
      .map((v: any) => typeof v === 'object' && v.id ? Number(v.id) : Number(v))
      .filter((id: any) => typeof id === 'number' && !Number.isNaN(id)) as number[];
    
    console.log('[StockRow] Normalized variation IDs:', {
      productId: product?.id,
      rawVariations: product.variations,
      normalizedIds: ids
    });
    
    return ids;
  }, [hasVariations, product.variations]);

  const { data: dbVariationsParent = [] } = useProductVariations(hasVariations ? product.id : undefined);

  // Buscar por IDs somente as variações que não vieram pela consulta por parent_id
  const missingIds = useMemo(() => {
    if (!hasVariations || !dbVariationsParent?.length) {
      return variationIds;
    }
    const fetched = new Set<number>(dbVariationsParent.map(v => Number(v.id)));
    return variationIds.filter(id => !fetched.has(id));
  }, [hasVariations, variationIds, dbVariationsParent]);

  const { data: dbVariationsByIds = [] } = useProductVariationsByIds(missingIds.length > 0 ? missingIds : undefined);

  // Unificar resultados (parent + byIds), garantindo 1 entrada por ID
  const effectiveVariations: DbVariation[] = useMemo(() => {
    const map = new Map<number, DbVariation>();
    (dbVariationsParent || []).forEach(v => map.set(Number(v.id), v));
    (dbVariationsByIds || []).forEach(v => map.set(Number(v.id), v));
    const arr = Array.from(map.values());
    console.log('[StockRow] effectiveVariations resolvidas:', {
      productId: product?.id,
      requestedIds: variationIds,
      parentCount: dbVariationsParent?.length || 0,
      byIdsCount: dbVariationsByIds?.length || 0,
      finalCount: arr.length,
    });
    return arr;
  }, [dbVariationsParent, dbVariationsByIds, variationIds, product?.id]);

  // Utilitário para normalizar atributos vindos do banco ou do produto (formatos diversos)
  const normalizeAttributes = (src: any): Array<{ name: string; option: string }> => {
    if (!src) return [];
    let arr = src;
    if (typeof arr === 'string') {
      try {
        arr = JSON.parse(arr);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(arr)) return [];
    return arr
      .map((a: any) => {
        const name = a?.name ?? a?.slug ?? a?.taxonomy ?? '';
        const option = a?.option ?? (Array.isArray(a?.options) ? a.options[0] : a?.value ?? a?.term ?? '');
        return {
          name: String(name || ''),
          option: String(option || ''),
        };
      })
      .filter((a: any) => a.name && a.option);
  };

  // Create normalized variations by merging product data with DB data (preferindo dados do banco)
  const normalizedVariations = useMemo(() => {
    if (!hasVariations) return [];

    const normalized: NormalizedVariation[] = variationIds.map(varId => {
      // Encontrar item cru a partir do produto (pode ser apenas número)
      const rawVar = (product.variations || []).find((v: any) => {
        const id = typeof v === 'object' && v.id ? Number(v.id) : Number(v);
        return id === varId;
      });
      const rawVarObj = typeof rawVar === 'object' ? rawVar : undefined;

      // Dados do banco
      const dbVar = effectiveVariations.find(v => Number(v.id) === varId);

      // Normalização de campos, priorizando banco
      const stockQty =
        (dbVar?.stock_quantity ?? null) !== null && (dbVar?.stock_quantity ?? undefined) !== undefined
          ? Number(dbVar!.stock_quantity) || 0
          : (rawVarObj?.stock_quantity ?? 0);

      const stockStatus =
        (dbVar?.stock_status ?? undefined) !== undefined
          ? String(dbVar!.stock_status)
          : (rawVarObj?.stock_status ?? 'instock');

      const sku = (dbVar?.sku && String(dbVar.sku).trim())
        ? String(dbVar.sku).trim()
        : (rawVarObj?.sku ? String(rawVarObj.sku).trim() : undefined);

      const attributes = normalizeAttributes(dbVar?.attributes ?? rawVarObj?.attributes);

      console.log('[StockRow] Normalized variation from DB/product:', {
        productId: product?.id,
        varId,
        stock_from: dbVar?.stock_quantity !== undefined ? 'db' : (rawVarObj?.stock_quantity !== undefined ? 'raw' : 'none'),
        stockQty,
        stockStatus,
        sku,
        attributes,
      });

      return {
        id: varId,
        stock_quantity: stockQty,
        stock_status: stockStatus,
        sku,
        attributes
      };
    });

    console.log('[StockRow] Normalized variations (final):', {
      productId: product?.id,
      count: normalized.length,
      sample: normalized[0]
    });

    return normalized;
  }, [hasVariations, variationIds, product.variations, effectiveVariations, product?.id]);

  // Calcula total a partir das variações normalizadas quando houver variações
  const computedVariationsTotal = useMemo(() => {
    if (!hasVariations) return 0;
    return normalizedVariations.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
  }, [hasVariations, normalizedVariations]);

  // Helper function to prettify attribute names
  const prettifyAttributeName = (name: string): string => {
    const nameMap: { [key: string]: string } = {
      'pa_tamanho-do-anel': 'Tamanho do Anel',
      'pa_tamanho': 'Tamanho',
      'pa_size': 'Tamanho',
      'pa_cor': 'Cor',
      'pa_color': 'Cor',
      'pa_material': 'Material'
    };
    
    return nameMap[name] || name.replace(/^pa_/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format attributes display
  const formatAttributes = (attributes: Array<{ name: string; option: string }>): string => {
    if (!attributes || attributes.length === 0) return 'Variação';
    
    return attributes
      .map(attr => `${prettifyAttributeName(attr.name)}: ${attr.option}`)
      .join(', ');
  };

  // Helper function to generate SKU
  const generateVariationSku = (variation: NormalizedVariation): string => {
    // 1. Use variation's own SKU if available
    if (variation.sku && String(variation.sku).trim()) {
      return String(variation.sku).trim();
    }

    // 2. Generate from parent SKU + attribute value
    const parentSku = product?.sku && String(product.sku).trim() ? String(product.sku).trim() : '';
    if (parentSku && variation.attributes?.length > 0) {
      // Priority: find "Tamanho do Anel" or similar size attribute
      const sizeAttr = variation.attributes.find(attr => {
        const name = attr.name.toLowerCase();
        return name.includes('tamanho-do-anel') || name.includes('tamanho') || name.includes('size');
      }) || variation.attributes[0];

      if (sizeAttr?.option) {
        return `${parentSku}-${sizeAttr.option}`;
      }
    }

    return parentSku || 'N/A';
  };

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
              <div className="font-medium text-lg">
                {computedVariationsTotal}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <LastChangeLabel productId={product.id} />
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
          {normalizedVariations.map((variation) => {
            const variationStock = variation.stock_quantity || 0;
            const variationStatus = getStockStatus(variationStock, variation.stock_status);
            const displayAttributes = formatAttributes(variation.attributes);
            const displaySku = generateVariationSku(variation);

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
                    <LastChangeLabel productId={product.id} variationId={variation.id} />
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
