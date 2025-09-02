import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Package } from 'lucide-react';
import { useWooCommerceProduct } from '@/hooks/useWooCommerce';

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
  const { data: productDetails } = useWooCommerceProduct(product?.id.toString() || '');

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelections([]);
    }
  }, [isOpen]);

  if (!product) return null;

  const variations = productDetails?.variations || product.variations || [];

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
    if (!variation.attributes || !Array.isArray(variation.attributes)) {
      return `Variação ${variation.id}`;
    }
    
    return variation.attributes
      .map((attr: any) => `${attr.name}: ${attr.option}`)
      .join(', ') || `Variação ${variation.id}`;
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
            
            {variations.map((variation: any) => {
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