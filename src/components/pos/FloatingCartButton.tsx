import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingCartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  total,
  onClick
}) => {
  const isMobile = useIsMobile();

  if (!isMobile || itemCount === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-30 h-14 px-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
      size="lg"
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-white"
          >
            {itemCount}
          </Badge>
        </div>
        <div className="text-sm font-medium">
          {formatPrice(total)}
        </div>
      </div>
    </Button>
  );
};

export default FloatingCartButton;