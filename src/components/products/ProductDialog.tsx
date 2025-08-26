
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateProduct, useUpdateProduct, useUpdateStock } from '@/hooks/useWooCommerce';
import { Product } from '@/services/woocommerce';
import ProductForm from './ProductForm';
import { logger } from '@/services/logger';

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

  const handleSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await createProduct.mutateAsync(data);
        logger.success('Produto Criado', `Produto "${data.name}" foi criado com sucesso`);
      } else if (product) {
        const isSimpleProduct = (product as any)?.type !== 'variable';

        // Para produtos simples, verificar se o estoque mudou e atualizar separadamente
        if (isSimpleProduct) {
          const newStock = Number(data?.stock_quantity);
          const currentStock = Number((product as any)?.stock_quantity || 0);
          
          if (!isNaN(newStock) && newStock !== currentStock) {
            console.log('[ProductDialog] Updating stock:', { productId: product.id, from: currentStock, to: newStock });
            await updateStock.mutateAsync({
              productId: Number(product.id),
              newStock: newStock,
            });
          }
        }

        // Atualizar outros dados do produto (excluindo estoque para produtos simples)
        const { stock_quantity, stock_status, ...productData } = data || {};
        
        await updateProduct.mutateAsync({ 
          id: product.id, 
          data: productData 
        });

        logger.success('Produto Atualizado', `Produto "${data.name}" foi atualizado com sucesso`);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('[ProductDialog] Error:', error);
      const action = mode === 'create' ? 'criar' : 'atualizar';
      logger.error(`Erro ao ${action} produto`, `Falha ao ${action} produto "${data?.name}"`);
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending || updateStock.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Produto' : 'Editar Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
