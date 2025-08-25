
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductVariations, useProductVariationsByIds } from '@/hooks/useProductVariations';

interface ProductVariationInfoProps {
  product: any;
  getTotalStock: (product: any) => number;
}

const ProductVariationInfo: React.FC<ProductVariationInfoProps> = ({
  product,
  getTotalStock
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasVariations = product.type === 'variable' && product.variations?.length;
  const variationIds = useMemo<number[]>(() => {
    if (!hasVariations) return [];
    return (product.variations || [])
      .map((v: any) => (typeof v === 'object' && v?.id ? Number(v.id) : Number(v)))
      .filter((id: any) => typeof id === 'number' && !Number.isNaN(id));
  }, [hasVariations, product.variations]);

  const { data: dbVariationsParent = [] } = useProductVariations(
    hasVariations ? product.id : undefined
  );

  const missingIds = useMemo(() => {
    if (!hasVariations || !dbVariationsParent?.length) {
      return variationIds;
    }
    const fetched = new Set<number>(dbVariationsParent.map((v: any) => Number(v.id)));
    return variationIds.filter(id => !fetched.has(id));
  }, [hasVariations, variationIds, dbVariationsParent]);

  const { data: dbVariationsByIds = [] } = useProductVariationsByIds(
    missingIds.length > 0 ? missingIds : undefined
  );

  const dbVariations = useMemo(() => {
    const map = new Map<number, any>();
    (dbVariationsParent || []).forEach((v: any) => map.set(Number(v.id), v));
    (dbVariationsByIds || []).forEach((v: any) => map.set(Number(v.id), v));
    return Array.from(map.values());
  }, [dbVariationsParent, dbVariationsByIds]);

  if (product.type !== 'variable' || !product.variations?.length) {
    return null;
  }

  const variationCount = product.variations.length;
  const totalStock = getTotalStock(product);

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

  const prettifyAttributeName = (name: string): string => {
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

  const formatAttributes = (attributes: Array<{ name: string; option: string }>): string => {
    if (!attributes || attributes.length === 0) return 'Variação';
    
    return attributes
      .map(attr => `${prettifyAttributeName(attr.name)}: ${attr.option}`)
      .join(', ');
  };

  const getVariationStock = (variation: any) => {
    const varId = variation.id || variation;
    const dbVar = dbVariations.find((v: any) => Number(v.id) === Number(varId));
    if (dbVar?.stock_quantity !== undefined && dbVar?.stock_quantity !== null) {
      return Number(dbVar.stock_quantity) || 0;
    }
    return Number(variation.stock_quantity) || 0;
  };

  const getVariationStatus = (stock: number, status: string) => {
    if (status === 'outofstock' || stock === 0) {
      return { label: 'Sem Estoque', color: 'destructive' };
    }
    if (stock <= 5) {
      return { label: 'Baixo', color: 'secondary' };
    }
    return { label: 'OK', color: 'default' };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 mr-1" />
          ) : (
            <ChevronRight className="w-3 h-3 mr-1" />
          )}
          {variationCount} variações • {totalStock} total
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-1">
          {product.variations.map((variation: any) => {
            const varId = variation.id || variation;
            const varObj = typeof variation === 'object' ? variation : {};
            const dbVar = dbVariations.find((v: any) => Number(v.id) === Number(varId));
            
            const attributes = normalizeAttributes(dbVar?.attributes || varObj?.attributes);
            const stock = getVariationStock(variation);
            const status = getVariationStatus(stock, dbVar?.stock_status || varObj?.stock_status || 'instock');

            return (
              <div key={varId} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {formatAttributes(attributes)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={status.color as any} className="text-xs px-1.5 py-0.5">
                    {stock}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductVariationInfo;
