
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { useUpdateStock } from '@/hooks/useWooCommerce';
import type { DbVariation } from '@/hooks/useProductVariations';

interface VariationStockEditorProps {
  product: any;
  variations: DbVariation[];
}

const VariationStockEditor: React.FC<VariationStockEditorProps> = ({ product, variations }) => {
  const updateStockMutation = useUpdateStock();
  const [temp, setTemp] = React.useState<Record<number, string>>({});

  if (!product?.id || !variations?.length) return null;

  const handleChange = (variationId: number, value: string) => {
    setTemp(prev => ({ ...prev, [variationId]: value }));
  };

  const getDisplay = (variationId: number, current: number) => {
    return temp[variationId] !== undefined ? temp[variationId] : String(current || 0);
  };

  const commit = async (variationId: number, newValue: number) => {
    const current = Number(
      variations.find(v => Number(v.id) === Number(variationId))?.stock_quantity || 0
    );
    if (current === newValue) return;

    await updateStockMutation.mutateAsync({
      productId: Number(product.id),
      variationId: Number(variationId),
      newStock: Math.max(0, Number(newValue) || 0),
    });

    // Limpa valor temporário após salvar
    setTemp(prev => {
      const copy = { ...prev };
      delete copy[variationId];
      return copy;
    });
  };

  const inc = async (variationId: number, delta: number) => {
    const current = Number(
      variations.find(v => Number(v.id) === Number(variationId))?.stock_quantity || 0
    );
    const next = Math.max(0, current + delta);
    await commit(variationId, next);
  };

  // Formata atributos para exibição simples
  const formatAttrs = (attrs: any): string => {
    let a = attrs;
    if (!a) return 'Variação';
    if (typeof a === 'string') {
      try { a = JSON.parse(a); } catch { return 'Variação'; }
    }
    if (!Array.isArray(a)) return 'Variação';
    const mapName = (name: string) => {
      const m: Record<string,string> = {
        'pa_tamanho-do-anel': 'Tamanho',
        'pa_tamanho': 'Tamanho',
        'pa_size': 'Tamanho',
        'pa_cor': 'Cor',
        'pa_color': 'Cor',
        'pa_material': 'Material',
      };
      return m[name] || name.replace(/^pa_/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    return a.map((x: any) => `${mapName(x?.name ?? x?.slug ?? '')}: ${x?.option ?? (Array.isArray(x?.options) ? x.options[0] : '')}`)
            .filter(Boolean).join(', ') || 'Variação';
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Editar Estoque das Variações</div>
      {variations.map(v => {
        const vid = Number(v.id);
        const current = Number(v.stock_quantity || 0);

        return (
          <div key={vid} className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{formatAttrs(v.attributes)}</div>
              <div className="text-xs text-muted-foreground">SKU: {v.sku || `Var-${vid}`}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => inc(vid, -1)}
                disabled={updateStockMutation.isPending || current <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                className="w-16 text-center h-7 text-sm"
                value={getDisplay(vid, current)}
                onChange={(e) => handleChange(vid, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(getDisplay(vid, current)) || 0;
                    commit(vid, val);
                  }
                }}
                onBlur={() => {
                  const val = parseInt(getDisplay(vid, current)) || 0;
                  commit(vid, val);
                }}
                disabled={updateStockMutation.isPending}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => inc(vid, 1)}
                disabled={updateStockMutation.isPending}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariationStockEditor;
