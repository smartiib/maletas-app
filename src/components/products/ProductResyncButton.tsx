
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSpecificProductSync } from '@/hooks/useWooCommerceOperations';
import { useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const { config } = useWooCommerceConfig();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Mutation para sincronizar apenas variações
  const syncVariationsMutation = useMutation({
    mutationFn: async () => {
      if (!config || !currentOrganization?.id) {
        throw new Error('Configuração ou organização não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('wc-sync', {
        body: {
          sync_type: 'variations',
          config: {
            url: config.url,
            consumer_key: config.consumerKey,
            consumer_secret: config.consumerSecret
          },
          organization_id: currentOrganization.id,
          product_ids: [productId]
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['wc-products-filtered', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['product-variations', productId] });
      toast.success(`Variações do produto "${productName}" sincronizadas com sucesso!`);
    },
    onError: (error: any) => {
      console.error('[ProductResync] Erro ao sincronizar variações:', error);
      toast.error(`Erro ao sincronizar variações: ${error.message}`);
    }
  });

  const handleResync = async () => {
    try {
      console.log(`[ProductResync] Sincronizando produto ${productId} (${productName})`);
      
      // Se é produto variável sem variações, sincronizar apenas variações
      if (isVariable && !hasVariations) {
        await syncVariationsMutation.mutateAsync();
      } else {
        // Sincronização normal do produto
        await specificSync.mutateAsync([productId]);
        toast.success(`Produto "${productName}" sincronizado com sucesso!`);
      }
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

  const isLoading = specificSync.isPending || syncVariationsMutation.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleResync}
      disabled={isLoading}
      title={buttonTitle}
      className={showButton ? 'text-amber-600 border-amber-300 hover:bg-amber-50' : ''}
    >
      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''} ${size === 'sm' ? 'mr-1' : 'mr-2'}`} />
      {size !== 'sm' && (isLoading ? 'Sincronizando...' : buttonText)}
    </Button>
  );
};

export default ProductResyncButton;
