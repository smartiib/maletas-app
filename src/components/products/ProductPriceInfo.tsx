
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatBRL } from '@/utils/currency';

type Product = {
  status?: string;
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  on_sale?: boolean;
};

const ProductPriceInfo: React.FC<{ product: Product }> = ({ product }) => {
  const status = (product.status || '').toString();
  const isPublished = status === 'publish';
  const statusLabel = isPublished ? 'Publicado' : status === 'draft' ? 'Rascunho' : (status || '—');

  const price = product?.price ?? product?.regular_price ?? 0;
  const hasSale = !!product?.on_sale || (!!product?.sale_price && product?.sale_price !== '' && product?.sale_price !== null);

  const displayPrice = hasSale ? (product?.sale_price ?? price) : price;
  const originalPrice = product?.regular_price ?? price;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Badge variant={isPublished ? 'secondary' : 'outline'}>{statusLabel}</Badge>
        {hasSale && (
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
            Promoção
          </Badge>
        )}
      </div>
      <div className="text-right leading-tight">
        {hasSale && (
          <div className="text-xs sm:text-sm line-through text-muted-foreground">
            {formatBRL(originalPrice)}
          </div>
        )}
        <div className="font-medium text-base sm:text-lg">
          {formatBRL(displayPrice)}
        </div>
      </div>
    </div>
  );
};

export default ProductPriceInfo;
