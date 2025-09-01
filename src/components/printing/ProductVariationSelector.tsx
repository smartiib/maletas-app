
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Minus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useProductVariations, useProductVariationsByIds } from '@/hooks/useProductVariations';
import ProductResyncButton from '@/components/products/ProductResyncButton';

interface ProductVariationSelectorProps {
  product: {
    id: number;
    name: string;
    sku?: string;
    price?: string;
    sale_price?: string;
    regular_price?: string;
    images?: Array<{ src: string; alt?: string }>;
    type?: string;
    variations?: any[];
  };
  onAddToQueue: (product: any, variation?: any, quantity?: number) => void;
  onClose: () => void;
}

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({
  product,
  onAddToQueue,
  onClose
}) => {
  const [expandedProduct, setExpandedProduct] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<Record<number, number>>({});

  const hasVariations = product.type === 'variable' && product.variations?.length;
  const variationIds = hasVariations 
    ? (product.variations || [])
        .map((v: any) => (typeof v === 'object' && v?.id ? Number(v.id) : Number(v)))
        .filter((id: any) => typeof id === 'number' && !Number.isNaN(id))
    : [];

  const { data: dbVariationsParent = [] } = useProductVariations(
    hasVariations ? product.id : undefined
  );

  const missingIds = hasVariations && dbVariationsParent?.length 
    ? variationIds.filter(id => !dbVariationsParent.find((v: any) => Number(v.id) === id))
    : variationIds;

  const { data: dbVariationsByIds = [] } = useProductVariationsByIds(
    missingIds.length > 0 ? missingIds : undefined
  );

  const dbVariations = React.useMemo(() => {
    const map = new Map<number, any>();
    (dbVariationsParent || []).forEach((v: any) => map.set(Number(v.id), v));
    (dbVariationsByIds || []).forEach((v: any) => map.set(Number(v.id), v));
    return Array.from(map.values());
  }, [dbVariationsParent, dbVariationsByIds]);

  const displaySku = product.sku || `PROD-${product.id}`;
  const imageUrl = product.images?.[0]?.src || '/placeholder.svg';

  const formatAttributes = (attributes: any): string => {
    if (!attributes) return 'Variação';
    
    let attrs = attributes;
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs); } catch { return 'Variação'; }
    }
    if (!Array.isArray(attrs)) return 'Variação';

    const prettifyName = (name: string) => {
      const nameMap: { [key: string]: string } = {
        'pa_tamanho-do-anel': 'Tamanho',
        'pa_tamanho': 'Tamanho',
        'pa_size': 'Tamanho',
        'pa_cor': 'Cor',
        'pa_color': 'Cor',
        'pa_material': 'Material'
      };
      return nameMap[name] || name.replace(/^pa_/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return attrs
      .map((attr: any) => {
        const name = attr?.name ?? attr?.slug ?? '';
        const option = attr?.option ?? (Array.isArray(attr?.options) ? attr.options[0] : '');
        return `${prettifyName(name)}: ${option}`;
      })
      .filter(Boolean)
      .join(', ') || 'Variação';
  };

  const handleAddSimpleProduct = () => {
    onAddToQueue(product);
    onClose();
  };

  const updateVariationQuantity = (variationId: number, delta: number) => {
    setSelectedVariations(prev => {
      const current = prev[variationId] || 0;
      const newQuantity = Math.max(0, current + delta);
      if (newQuantity === 0) {
        const { [variationId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variationId]: newQuantity };
    });
  };

  const handleAddSelectedVariations = () => {
    Object.entries(selectedVariations).forEach(([variationId, quantity]) => {
      const variation = dbVariations.find(v => Number(v.id) === Number(variationId));
      if (variation && quantity > 0) {
        const variationData = {
          ...product,
          id: variation.id,
          name: `${product.name} - ${formatAttributes(variation.attributes)}`,
          sku: variation.sku || `${product.sku || product.id}-${variation.id}`,
          price: variation.price || variation.regular_price || product.price,
          variation_id: variation.id,
          parent_id: product.id,
          is_variation: true
        };
        
        // Adicionar uma única vez com a quantidade especificada
        onAddToQueue(variationData, variation, quantity);
      }
    });
    onClose();
  };

  const totalSelected = Object.values(selectedVariations).reduce((sum, qty) => sum + qty, 0);

  if (!hasVariations) {
    // Produto simples
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Adicionar Produto</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {imageUrl !== '/placeholder.svg' ? (
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight line-clamp-2">{product.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">SKU: {displaySku}</p>
            </div>
          </div>

          <Button onClick={handleAddSimpleProduct} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar à Fila
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Produto com variações
  return (
    <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Selecionar Variações</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Informações do produto */}
        <div className="flex gap-3 mb-4">
          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
            {imageUrl !== '/placeholder.svg' ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{product.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">SKU: {displaySku}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {dbVariations.length} variações
            </Badge>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Lista de variações */}
        <div className="flex-1 overflow-auto space-y-2">
          {dbVariations.length > 0 ? (
            dbVariations.map((variation) => {
              const variationId = Number(variation.id);
              const selectedQuantity = selectedVariations[variationId] || 0;
              const stockQuantity = Math.max(0, Number(variation.stock_quantity) || 0);

              return (
                <div key={variationId} className="p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-1">
                        {formatAttributes(variation.attributes)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SKU: {variation.sku || `${displaySku}-${variationId}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Estoque: {stockQuantity}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => updateVariationQuantity(variationId, -1)}
                        disabled={selectedQuantity === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="text-sm font-medium w-8 text-center">
                        {selectedQuantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => updateVariationQuantity(variationId, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-sm text-amber-800 mb-3">
                Este produto variável não possui variações sincronizadas.
              </p>
              <ProductResyncButton
                productId={product.id}
                productName={product.name}
                isVariable={true}
                hasVariations={false}
                size="default"
                variant="outline"
              />
            </div>
          )}
        </div>

        {/* Botões de ação */}
        {dbVariations.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {totalSelected > 0 ? `${totalSelected} variações selecionadas` : 'Nenhuma variação selecionada'}
              </div>
              <Button 
                onClick={handleAddSelectedVariations}
                disabled={totalSelected === 0}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Selecionadas
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariationSelector;
