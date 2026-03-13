import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Package } from 'lucide-react';
import { useProductVariations, useProductVariationsByIds } from '@/hooks/useProductVariations';

interface ProductVariationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku?: string;
    type?: string;
    variations?: any[];
    images?: Array<{ src: string; alt?: string }>;
  } | null;
  onAddToQueue: (variation: any, quantity: number) => void;
}

interface VariationSelection {
  variationId: number;
  quantity: number;
  variation: any;
}

export const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({
  isOpen,
  onClose,
  product,
  onAddToQueue
}) => {
  const [selections, setSelections] = useState<VariationSelection[]>([]);

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelections([]);
    }
  }, [isOpen]);

  // Mesma lógica da página de Produtos
  const hasVariations = product?.type === 'variable' && Array.isArray(product?.variations) && product.variations.length > 0;
  
  const variationIds = useMemo<number[]>(() => {
    if (!hasVariations) return [];
    return (product.variations || [])
      .map((v: any) => (typeof v === 'object' && v?.id ? Number(v.id) : Number(v)))
      .filter((id: any) => typeof id === 'number' && !Number.isNaN(id));
  }, [hasVariations, product]);

  // Buscar por parent_id
  const { data: variationsByParent = [], isLoading: isLoadingParent } = useProductVariations(
    hasVariations ? Number(product?.id) : undefined
  );

  // Identificar IDs faltantes
  const missingIds = useMemo(() => {
    if (!hasVariations) return [];
    if (!variationsByParent?.length) return variationIds;
    const fetched = new Set<number>(variationsByParent.map(v => Number(v.id)));
    return variationIds.filter(id => !fetched.has(id));
  }, [hasVariations, variationIds, variationsByParent]);

  // Buscar por IDs faltantes
  const { data: variationsByIds = [], isLoading: isLoadingIds } = useProductVariationsByIds(
    missingIds.length > 0 ? missingIds : undefined
  );

  // Combinar resultados
  const loadedVariations = useMemo(() => {
    const map = new Map<number, any>();
    (variationsByParent || []).forEach(v => map.set(Number(v.id), v));
    (variationsByIds || []).forEach(v => map.set(Number(v.id), v));
    const arr = Array.from(map.values());
    console.log('[ProductVariationSelector] Loaded variations:', {
      productId: product?.id,
      variationIds,
      parentCount: variationsByParent?.length || 0,
      byIdsCount: variationsByIds?.length || 0,
      finalCount: arr.length,
    });
    return arr;
  }, [variationsByParent, variationsByIds, variationIds, product?.id]);

  const isLoadingVariations = isLoadingParent || isLoadingIds;

  if (!product) return null;

  const variations = loadedVariations.length > 0 ? loadedVariations : (product.variations || []);
  
  // Debug: log variations data
  console.log('[ProductVariationSelector] Final variations to display:', variations);

  const updateQuantity = (variationId: number, quantity: number) => {
    setSelections(prev => {
      const existing = prev.find(s => s.variationId === variationId);
      if (existing) {
        if (quantity <= 0) {
          return prev.filter(s => s.variationId !== variationId);
        }
        return prev.map(s => 
          s.variationId === variationId 
            ? { ...s, quantity }
            : s
        );
      } else if (quantity > 0) {
        const variation = variations.find((v: any) => v.id === variationId);
        if (variation) {
          return [...prev, { variationId, quantity, variation }];
        }
      }
      return prev;
    });
  };

  const getQuantity = (variationId: number) => {
    return selections.find(s => s.variationId === variationId)?.quantity || 0;
  };

  const handleAddSelected = () => {
    selections.forEach(selection => {
      // Create a product-like object for the variation
      const variationProduct = {
        ...product,
        id: selection.variation.id,
        name: `${product.name} - ${getVariationName(selection.variation)}`,
        sku: selection.variation.sku || `${product.sku}-VAR-${selection.variation.id}`,
        price: selection.variation.price || selection.variation.regular_price || '0',
        variation_id: selection.variation.id,
        parent_id: product.id,
        attributes: selection.variation.attributes
      };
      
      onAddToQueue(variationProduct, selection.quantity);
    });
    
    onClose();
  };

  const getVariationName = (variation: any) => {
    console.log('[ProductVariationSelector] Formatting variation:', variation);
    
    // Normalizar atributos (mesma função da página de Produtos)
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
    
    const attrs = normalizeAttributes(variation.attributes);
    
    if (attrs.length > 0) {
      return attrs.map(a => `${a.name}: ${a.option}`).join(', ');
    }
    
    // Fallback: usar SKU se disponível
    if (variation.sku) {
      return variation.sku;
    }
    
    return `Variação ${variation.id}`;
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'Preço não definido' : `R$ ${numPrice.toFixed(2)}`;
  };

  const totalQuantity = selections.reduce((total, s) => total + s.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Variações - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {product.images?.[0]?.src ? (
                  <img
                    src={product.images[0].src}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku || `PROD-${product.id}`}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {variations.length} variações disponíveis
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variations list */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Variações Disponíveis:</Label>
            
            {isLoadingVariations ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando variações...
              </div>
            ) : variations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  ⚠️ As variações deste produto não estão sincronizadas no banco local.
                </div>
                <div className="text-sm text-muted-foreground">
                  Execute uma sincronização completa para importar as variações.
                </div>
              </div>
            ) : null}
            
            {!isLoadingVariations && variations.map((variation: any) => {
              const quantity = getQuantity(variation.id);
              
              return (
                <Card key={variation.id} className={quantity > 0 ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {getVariationName(variation)}
                        </h4>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>SKU: {variation.sku || `VAR-${variation.id}`}</span>
                          <span>{formatPrice(variation.price || variation.regular_price || 0)}</span>
                          {variation.stock_quantity !== undefined && (
                            <span>Estoque: {variation.stock_quantity}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(variation.id, Math.max(0, quantity - 1))}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) => updateQuantity(variation.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(variation.id, quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary and actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {totalQuantity > 0 ? (
                <span>Total: {totalQuantity} etiquetas selecionadas</span>
              ) : (
                <span>Nenhuma variação selecionada</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddSelected}
                disabled={totalQuantity === 0}
              >
                Adicionar à Fila ({totalQuantity})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};