import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePayInstallment } from '@/hooks/useFinancial';

const paymentSchema = z.object({
  payment_date: z.string(),
  payment_method: z.string().optional(),
  late_fee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: any;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
];

const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, onOpenChange, installment }) => {
  const payInstallment = usePayInstallment();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      late_fee: 0,
      discount: 0,
      notes: '',
    },
  });

  React.useEffect(() => {
    if (installment) {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(installment.due_date);
      const isOverdue = new Date(today) > dueDate;
      
      form.reset({
        payment_date: installment.payment_date 
          ? new Date(installment.payment_date).toISOString().split('T')[0] 
          : today,
        payment_method: installment.payment_method || '',
        late_fee: installment.late_fee || (isOverdue ? 0 : 0),
        discount: installment.discount || 0,
        notes: installment.notes || '',
      });
    }
  }, [installment, form]);

  const handleSubmit = async (data: PaymentFormData) => {
    if (!installment) return;

    try {
      await payInstallment.mutateAsync({
        id: installment.id,
        payment_date: new Date(data.payment_date).toISOString(),
        payment_method: data.payment_method,
        notes: data.notes,
        late_fee: data.late_fee,
        discount: data.discount,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
    }
  };

  const finalAmount = installment ? Number(installment.amount) + form.watch('late_fee') - form.watch('discount') : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  if (!installment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {installment.status === 'paid' ? 'Detalhes do Pagamento' : 'Registrar Pagamento'}
          </DialogTitle>
        </DialogHeader>

        {/* Informações da Parcela */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Parcela:</span>
            <span className="font-medium">{installment.installment_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Valor Original:</span>
            <span className="font-semibold">R$ {Number(installment.amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Vencimento:</span>
            <span>{new Date(installment.due_date).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={getStatusColor(installment.status)}>
              {getStatusLabel(installment.status)}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Pagamento</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={installment.status === 'paid'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={installment.status === 'paid'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="late_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multa/Juros</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={installment.status === 'paid'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={installment.status === 'paid'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor Final */}
            <div className="bg-primary/10 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Final:</span>
                <span className="text-lg font-bold">R$ {finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações do pagamento..." 
                      {...field} 
                      disabled={installment.status === 'paid'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="flex-1"
              >
                {installment.status === 'paid' ? 'Fechar' : 'Cancelar'}
              </Button>
              {installment.status !== 'paid' && (
                <Button 
                  type="submit" 
                  disabled={payInstallment.isPending} 
                  className="flex-1"
                >
                  {payInstallment.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;