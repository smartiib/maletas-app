
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Package, Printer, Box } from 'lucide-react';
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
    type?: string;
    variations?: any[];
  };
  isInQueue: boolean;
  wasRecentlyPrinted: boolean;
  lastPrintDate?: Date | null;
  onAddToQueue: () => void;
  onSelectVariations?: () => void;
}

export const ProductLabelCard: React.FC<ProductLabelCardProps> = ({
  product,
  isInQueue,
  wasRecentlyPrinted,
  lastPrintDate,
  onAddToQueue,
  onSelectVariations
}) => {
  const displaySku = product.sku || `PROD-${product.id}`;
  const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
  const hasVariations = product.type === 'variable' && product.variations?.length;

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
      if (hasVariations && onSelectVariations) {
        onSelectVariations();
      } else {
        onAddToQueue();
      }
    }
  };

  return (
    <Card 
      className={`relative ${getCardClassName()}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        {/* Imagem do produto */}
        <div className="aspect-square mb-3 overflow-hidden rounded-md bg-muted flex items-center justify-center relative">
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

          {/* Badge de produto com variações */}
          {hasVariations && (
            <div className="absolute top-1 right-1">
              <Badge variant="default" className="text-xs bg-blue-100/90 text-blue-800 backdrop-blur-sm flex items-center gap-1">
                <Box className="h-3 w-3" />
                {product.variations?.length}
              </Badge>
            </div>
          )}

          {/* Badge de impresso recentemente - posicionado sobre a imagem */}
          {wasRecentlyPrinted && lastPrintDate && (
            <div className="absolute bottom-1 left-1 right-1">
              <Badge variant="secondary" className="text-xs bg-orange-100/90 text-orange-800 backdrop-blur-sm flex items-center gap-1 justify-center w-full">
                <Printer className="h-3 w-3" />
                {formatDistanceToNow(lastPrintDate, { locale: ptBR, addSuffix: true }).replace('há ', '')}
              </Badge>
            </div>
          )}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {hasVariations && (
                <span className="text-xs text-muted-foreground">Variável</span>
              )}
            </div>
          </div>

          {/* Status badges - apenas para produtos na fila */}
          <div className="flex flex-wrap gap-1">
            {isInQueue && (
              <Badge variant="default" className="text-xs">
                Na fila
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
