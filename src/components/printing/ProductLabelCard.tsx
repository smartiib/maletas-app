
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductLabelCardProps {
  product: {
    id: number;
    name: string;
    sku?: string;
    price?: string;
    sale_price?: string;
    regular_price?: string;
    images?: Array<{ src: string; alt?: string }>;
  };
  isInQueue: boolean;
  wasRecentlyPrinted: boolean;
  lastPrintDate?: Date | null;
  onAddToQueue: () => void;
}

export const ProductLabelCard: React.FC<ProductLabelCardProps> = ({
  product,
  isInQueue,
  wasRecentlyPrinted,
  lastPrintDate,
  onAddToQueue
}) => {
  const displaySku = product.sku || `PROD-${product.id}`;
  const imageUrl = product.images?.[0]?.src || '/placeholder.svg';

  const getCardClassName = () => {
    if (isInQueue) {
      return 'border-primary bg-primary/5 opacity-60 cursor-not-allowed';
    }
    if (wasRecentlyPrinted) {
      return 'border-orange-300 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors';
    }
    return 'cursor-pointer hover:bg-muted/50 transition-colors border-border';
  };

  const handleClick = () => {
    if (!isInQueue) {
      onAddToQueue();
    }
  };

  return (
    <Card 
      className={`relative ${getCardClassName()}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        {/* Imagem do produto */}
        <div className="aspect-square mb-3 overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {imageUrl !== '/placeholder.svg' ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`flex items-center justify-center h-full w-full ${imageUrl !== '/placeholder.svg' ? 'hidden' : ''}`}>
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Informações do produto */}
        <div className="space-y-2">
          <div>
            <h3 className="font-medium text-sm line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              SKU: {displaySku}
            </p>
          </div>

          <div className="flex items-center justify-end">
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1">
            {isInQueue && (
              <Badge variant="default" className="text-xs">
                Na fila
              </Badge>
            )}
            {wasRecentlyPrinted && lastPrintDate && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                Impresso {formatDistanceToNow(lastPrintDate, { locale: ptBR, addSuffix: true })}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
