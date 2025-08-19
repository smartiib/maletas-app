
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useWooCommerce';
import { useCreateRepresentative, useUpdateRepresentative, useRepresentatives } from '@/hooks/useMaletas';
import { Customer } from '@/services/woocommerce';
import CustomerForm from './CustomerForm';
import { logger } from '@/services/logger';
import { toast } from '@/hooks/use-toast';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  mode: 'create' | 'edit';
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onOpenChange, customer, mode }) => {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const createRepresentative = useCreateRepresentative();
  const updateRepresentative = useUpdateRepresentative();
  const { data: representativesResponse } = useRepresentatives();
  
  // Extract the actual data array from the paginated response
  const representatives = representativesResponse?.data || [];

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
      
      let savedCustomer;
      
      if (mode === 'create') {
        savedCustomer = await createCustomer.mutateAsync(customerData);
        logger.success('Cliente Criado', `Cliente "${data.first_name} ${data.last_name}" foi criado com sucesso`);
      } else if (customer) {
        savedCustomer = await updateCustomer.mutateAsync({ id: customer.id, customer: customerData });
        logger.success('Cliente Atualizado', `Cliente "${data.first_name} ${data.last_name}" foi atualizado com sucesso`);
      }

      // Se foi marcado como representante, criar/atualizar na tabela representatives
      if (data.is_representative && savedCustomer) {
        try {
          // Verificar se já existe um representante com este email
          const existingRepresentative = representatives.find(rep => 
            rep.email === data.email || rep.email === data.billing.email
          );

          const representativeData = {
            name: `${data.first_name} ${data.last_name}`,
            email: data.email || data.billing.email,
            phone: data.billing.phone,
            commission_settings: {
              use_global: true,
              penalty_rate: 1
            }
          };

          if (existingRepresentative) {
            // Atualizar representante existente
            await updateRepresentative.mutateAsync({
              id: existingRepresentative.id,
              data: representativeData
            });
          } else {
            // Criar novo representante
            await createRepresentative.mutateAsync(representativeData);
          }

          toast({
            title: "Representante Configurado",
            description: `${data.first_name} ${data.last_name} foi configurado como representante!`,
          });
        } catch (repError) {
          console.error('Erro ao configurar representante:', repError);
          toast({
            title: "Aviso",
            description: "Cliente salvo, mas houve erro ao configurar como representante.",
            variant: "destructive"
          });
        }
      } else if (!data.is_representative) {
        // Se foi desmarcado como representante, verificar se precisa remover
        const existingRepresentative = representatives.find(rep => 
          rep.email === data.email || rep.email === data.billing.email
        );
        
        if (existingRepresentative) {
          // Nota: Por segurança, não removemos automaticamente da tabela representatives
          // pois pode haver maletas associadas. Apenas marcamos como inativo no WooCommerce.
          console.log('Representante desmarcado, mas mantido na base para preservar histórico');
        }
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
