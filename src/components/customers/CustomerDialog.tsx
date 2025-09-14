
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateLocalCustomer, useUpdateLocalCustomer, LocalCustomer } from '@/hooks/useLocalCustomers';
import { useCreateRepresentative, useUpdateRepresentative, useRepresentatives } from '@/hooks/useMaletas';
import CustomerForm from './CustomerForm';
import { logger } from '@/services/logger';
import { toast } from '@/hooks/use-toast';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: LocalCustomer;
  mode: 'create' | 'edit';
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onOpenChange, customer, mode }) => {
  const createCustomer = useCreateLocalCustomer();
  const updateCustomer = useUpdateLocalCustomer();
  const createRepresentative = useCreateRepresentative();
  const updateRepresentative = useUpdateRepresentative();
  const { data: representativesResponse } = useRepresentatives();
  
  // Extract the actual data array from the paginated response
  const representatives = representativesResponse?.data || [];

  const handleSubmit = async (data: any) => {
    try {
      // Processar meta_data para incluir is_representative e date_of_birth, preservando metadados existentes
      const existingMeta = Array.isArray(customer?.meta_data) ? customer!.meta_data : [];
      const metaMap = new Map<string, any>();
      for (const m of existingMeta) {
        if (m?.key) metaMap.set(m.key, m.value);
      }
      // Atualizar/definir metadados
      metaMap.set('is_representative', data.is_representative || false);
      if (data.date_of_birth) {
        metaMap.set('date_of_birth', data.date_of_birth);
      } else {
        metaMap.delete('date_of_birth');
      }
      const meta_data = Array.from(metaMap.entries()).map(([key, value]) => ({ key, value }));

      const customerData = {
        ...data,
        meta_data
      };
      
      // Remover campos do nível superior que irão em meta_data
      delete customerData.is_representative;
      delete customerData.date_of_birth;
      let savedCustomer;
      
      if (mode === 'create') {
        savedCustomer = await createCustomer.mutateAsync(customerData);
        logger.success('Cliente Criado', 'Cliente foi criado localmente e agendado para sincronização');
      } else if (customer) {
        savedCustomer = await updateCustomer.mutateAsync({ id: customer.id, data: customerData });
        logger.success('Cliente Atualizado', `Cliente ${customer.first_name} foi atualizado localmente`);
      }

      // Se foi marcado como representante, criar/atualizar na tabela representantes
      if (data.is_representative && savedCustomer) {
        try {
          // Verificar se já existe um representante com este email
          const existingRepresentative = representatives.find((rep: any) => 
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
        const existingRepresentative = representatives.find((rep: any) => 
          rep.email === data.email || rep.email === data.billing.email
        );
        
        if (existingRepresentative) {
          // Nota: Por segurança, não removemos automaticamente da tabela representatives
          // pois pode haver maletas associadas. Apenas marcamos como inativo no WooCommerce.
          console.log('Representante desmarcado, mas mantido na base para preservar histórico');
        }
      }
      
      onOpenChange(false);
    } catch (error: any) {
      const action = mode === 'create' ? 'criar' : 'atualizar';
      const message: string = error?.message || `Falha ao ${action} cliente`;
      logger.error(`Erro ao ${action} cliente`, message);
      toast({
        title: 'Erro ao salvar cliente',
        description: message.includes('401')
          ? 'Permissão negada pelo WooCommerce (401). Verifique se as chaves têm acesso Read/Write nas Configurações.'
          : message,
        variant: 'destructive',
      });
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

