
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSpecificProductSync } from '@/hooks/useWooCommerceOperations';
import { toast } from 'sonner';

interface ProductResyncButtonProps {
  productId: number;
  productName?: string;
  isVariable?: boolean;
  hasVariations?: boolean;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'default';
}

const ProductResyncButton: React.FC<ProductResyncButtonProps> = ({
  productId,
  productName = '',
  isVariable = false,
  hasVariations = false,
  size = 'sm',
  variant = 'outline'
}) => {
  const specificSync = useSpecificProductSync();

  const handleResync = async () => {
    try {
      console.log(`[ProductResync] Sincronizando produto ${productId} (${productName})`);
      
      await specificSync.mutateAsync([productId]);
      
      toast.success(`Produto "${productName}" sincronizado com sucesso!`);
    } catch (error: any) {
      console.error('[ProductResync] Erro:', error);
      toast.error(`Erro ao sincronizar produto: ${error.message}`);
    }
  };

  // Mostrar botão se:
  // 1. Produto é variável mas não tem variações na base local
  // 2. Ou sempre mostrar para permitir refresh manual
  const showButton = isVariable && !hasVariations;
  const buttonText = showButton ? 'Buscar variações' : 'Ressincronizar';
  const buttonTitle = showButton 
    ? 'Este produto variável não possui variações. Clique para buscá-las do WooCommerce.'
    : 'Sincronizar este produto com o WooCommerce';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleResync}
      disabled={specificSync.isPending}
      title={buttonTitle}
      className={showButton ? 'text-amber-600 border-amber-300 hover:bg-amber-50' : ''}
    >
      <RefreshCw className={`w-3 h-3 ${specificSync.isPending ? 'animate-spin' : ''} ${size === 'sm' ? 'mr-1' : 'mr-2'}`} />
      {size !== 'sm' && (specificSync.isPending ? 'Sincronizando...' : buttonText)}
    </Button>
  );
};

export default ProductResyncButton;
