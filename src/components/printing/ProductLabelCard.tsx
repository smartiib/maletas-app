
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductLabelCardProps {
  product: any;
  onAddToQueue: () => void;
}

export const ProductLabelCard: React.FC<ProductLabelCardProps> = ({
  product,
  onAddToQueue
}) => {
  const imageUrl = product.images && product.images[0] 
    ? product.images[0].src 
    : '/placeholder.svg';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-3">
        <div className="aspect-square mb-2 overflow-hidden rounded-md bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            SKU: {product.sku || `PROD-${product.id}`}
          </p>
        </div>

        <Button
          onClick={onAddToQueue}
          size="sm"
          className="w-full mt-2 h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
};
