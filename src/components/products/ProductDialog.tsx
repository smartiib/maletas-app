
import React, { useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateProduct, useUpdateProduct, useUpdateStock } from '@/hooks/useWooCommerce';
import { Product } from '@/services/woocommerce';
import ProductForm from './ProductForm';
import { logger } from '@/services/logger';
import { useSupabaseProductStock, useRefreshProductStock } from '@/hooks/useSupabaseProductStock';
import { useSaveProductLocal } from '@/hooks/useSaveProductLocal';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  mode: 'create' | 'edit';
}

const ProductDialog: React.FC<ProductDialogProps> = ({ open, onOpenChange, product, mode }) => {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const updateStock = useUpdateStock();
  const saveProductLocal = useSaveProductLocal();
  const refreshProductStock = useRefreshProductStock();

  // Quando for produto simples, buscar estoque atual no Supabase para usar como fonte da verdade.
  const isSimple = (product as any)?.type !== 'variable';
  const { data: supStockData, refetch: refetchStock } = useSupabaseProductStock(
    isSimple && product ? Number(product.id) : undefined
  );

  // Force refresh stock data when dialog opens
  useEffect(() => {
    if (open && isSimple && product?.id) {
      console.log('[ProductDialog] Dialog opened, refreshing stock data...');
      refetchStock();
    }
  }, [open, isSimple, product?.id, refetchStock]);

  // Mergiar o produto recebido com o estoque do Supabase (quando disponível)
  const mergedProduct: Product | undefined = useMemo(() => {
    if (!product) return product;
    if (!isSimple) return product;
    if (!supStockData) return product;

    console.log('[ProductDialog] Merging product with Supabase stock:', {
      originalStock: (product as any)?.stock_quantity,
      supabaseStock: supStockData.stock_quantity,
      supabaseStatus: supStockData.stock_status
    });

    return {
      ...product,
      stock_quantity: typeof supStockData.stock_quantity === 'number'
        ? supStockData.stock_quantity
        : (product as any)?.stock_quantity,
      stock_status: supStockData.stock_status || (product as any)?.stock_status,
    } as Product;
  }, [product, isSimple, supStockData]);

  const handleSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await createProduct.mutateAsync(data);
        logger.success('Produto Criado', `Produto "${data.name}" foi criado com sucesso`);
      } else if (product) {
        const isSimpleLocal = (product as any)?.type !== 'variable';

        // Handle stock update separately for simple products
        const newStock = Number(data?.stock_quantity);
        const prevStock = Number(
          supStockData?.stock_quantity ??
          (product as any)?.stock_quantity ??
          0
        );
        const shouldUpdateStock =
          isSimpleLocal && !Number.isNaN(newStock) && newStock !== prevStock;

        if (shouldUpdateStock) {
          console.log('[ProductDialog] Updating stock:', { prevStock, newStock });
          await updateStock.mutateAsync({
            productId: Number(product.id),
            newStock,
          });
          
          // Refresh stock data after update
          refreshProductStock(Number(product.id));
        }

        // Save other product fields locally (excluding stock fields to avoid conflicts)
        const { stock_quantity, stock_status, ...productFields } = data || {};
        
        console.log('[ProductDialog] Saving product fields locally:', productFields);
        await saveProductLocal.mutateAsync({
          productId: Number(product.id),
          data: productFields
        });

        logger.success('Produto Atualizado', `Produto "${data.name}" foi atualizado com sucesso`);
      }
      onOpenChange(false);
    } catch (error) {
      const action = mode === 'create' ? 'criar' : 'atualizar';
      console.error(`[ProductDialog] Error to ${action} product:`, error);
      logger.error(`Erro ao ${action} produto`, `Falha ao ${action} produto "${data?.name}"`);
    }
  };

  const isLoading =
    createProduct.isPending ||
    updateProduct.isPending ||
    updateStock.isPending ||
    saveProductLocal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Produto' : 'Editar Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <ProductForm
          product={mergedProduct ?? product}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
