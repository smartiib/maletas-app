
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateOrder, useUpdateOrderStatus } from '@/hooks/useWooCommerce';
import { Order } from '@/services/woocommerce';
import OrderForm from './OrderForm';
import { logger } from '@/services/logger';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order;
  mode: 'create' | 'edit';
}

const OrderDialog: React.FC<OrderDialogProps> = ({ open, onOpenChange, order, mode }) => {
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();

  const handleSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await createOrder.mutateAsync(data);
        logger.success('Pedido Criado', 'Pedido foi criado com sucesso');
      } else if (order) {
        await updateOrderStatus.mutateAsync({ id: order.id, status: data.status });
        logger.success('Pedido Atualizado', `Status do pedido #${order.number} foi atualizado`);
      }
      onOpenChange(false);
    } catch (error) {
      const action = mode === 'create' ? 'criar' : 'atualizar';
      logger.error(`Erro ao ${action} pedido`, `Falha ao ${action} pedido`);
    }
  };

  const isLoading = createOrder.isPending || updateOrderStatus.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Pedido' : 'Editar Pedido'}
          </DialogTitle>
        </DialogHeader>
        
        <OrderForm
          order={order}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
