
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
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

  // Lógica corrigida para preços
  const regularPrice = product?.regular_price ?? 0;
  const salePrice = product?.sale_price ?? null;
  const currentPrice = product?.price ?? regularPrice;
  
  // Produto está em promoção se:
  // 1. on_sale é true, OU
  // 2. sale_price existe e é diferente de regular_price, OU
  // 3. price é menor que regular_price
  const hasSale = !!product?.on_sale || 
                  (!!salePrice && salePrice !== '' && salePrice !== null && salePrice !== regularPrice) ||
                  (currentPrice < regularPrice && regularPrice > 0);

  // Se está em promoção, mostra sale_price ou price (o menor)
  // Se não está em promoção, mostra price ou regular_price
  const displayPrice = hasSale ? (salePrice || currentPrice) : currentPrice;
  const originalPrice = hasSale ? regularPrice : null;

  return (
    <div className="flex items-center gap-2">
      {/* Ícone de publicado */}
      {isPublished && (
        <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle2 className="w-2 h-2 text-white" />
        </div>
      )}
      
      {/* Preços */}
      <div className="flex items-center gap-1">
        {hasSale && originalPrice && (
          <div className="text-xs text-muted-foreground line-through">
            {formatBRL(originalPrice)}
          </div>
        )}
        <div className="font-medium text-sm">
          {formatBRL(displayPrice)}
        </div>
      </div>

      {/* Tag de promoção */}
      {hasSale && (
        <Badge 
          variant="default" 
          className="bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 text-xs px-1.5 py-0.5"
        >
          Promoção
        </Badge>
      )}
    </div>
  );
};

export default ProductPriceInfo;
