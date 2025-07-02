
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useWooCommerce';
import { Customer } from '@/services/woocommerce';
import CustomerForm from './CustomerForm';
import { logger } from '@/services/logger';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  mode: 'create' | 'edit';
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onOpenChange, customer, mode }) => {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const handleSubmit = async (data: any) => {
    try {
      // Processar meta_data para incluir is_representative
      const customerData = {
        ...data,
        meta_data: [
          {
            key: 'is_representative',
            value: data.is_representative || false
          }
        ]
      };
      
      // Remover is_representative do nível superior já que será em meta_data
      delete customerData.is_representative;
      
      if (mode === 'create') {
        await createCustomer.mutateAsync(customerData);
        logger.success('Cliente Criado', `Cliente "${data.first_name} ${data.last_name}" foi criado com sucesso`);
      } else if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, customer: customerData });
        logger.success('Cliente Atualizado', `Cliente "${data.first_name} ${data.last_name}" foi atualizado com sucesso`);
      }
      onOpenChange(false);
    } catch (error) {
      const action = mode === 'create' ? 'criar' : 'atualizar';
      logger.error(`Erro ao ${action} cliente`, `Falha ao ${action} cliente`);
    }
  };

  const isLoading = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Cliente' : 'Editar Cliente'}
          </DialogTitle>
        </DialogHeader>
        
        <CustomerForm
          customer={customer}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
