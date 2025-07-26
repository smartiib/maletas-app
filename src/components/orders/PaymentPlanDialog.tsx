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
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Plus, Minus } from 'lucide-react';
import { useCreatePaymentPlan, useCreateInstallments } from '@/hooks/useFinancial';
import { addDays, format } from 'date-fns';

const paymentPlanSchema = z.object({
  payment_type: z.enum(['installment', 'future']),
  installments_count: z.number().min(1).max(12),
  interest_rate: z.number().min(0).default(0),
  first_due_date: z.string(),
  notes: z.string().optional(),
});

type PaymentPlanFormData = z.infer<typeof paymentPlanSchema>;

interface PaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: {
    id: number;
    number: string;
    total: string;
    billing: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  onPaymentPlanCreated?: (planData: any) => void;
  posData?: {
    total: number;
    customerName: string;
    customerEmail: string;
  };
}

const PaymentPlanDialog: React.FC<PaymentPlanDialogProps> = ({ 
  open, 
  onOpenChange, 
  order,
  onPaymentPlanCreated,
  posData
}) => {
  const createPaymentPlan = useCreatePaymentPlan();
  const createInstallments = useCreateInstallments();

  const form = useForm<PaymentPlanFormData>({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: {
      payment_type: 'installment',
      installments_count: 2,
      interest_rate: 0,
      first_due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const watchedValues = form.watch();
  const totalAmount = order ? parseFloat(order.total) : (posData?.total || 0);
  const totalWithInterest = totalAmount * (1 + watchedValues.interest_rate / 100);
  const installmentAmount = totalWithInterest / watchedValues.installments_count;

  // Calcular datas das parcelas
  const calculateInstallments = () => {
    const installments = [];
    const firstDate = new Date(watchedValues.first_due_date);
    
    for (let i = 0; i < watchedValues.installments_count; i++) {
      const dueDate = addDays(firstDate, i * 30); // 30 dias entre parcelas
      installments.push({
        installment_number: i + 1,
        amount: installmentAmount,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        status: 'pending' as const,
        late_fee: 0,
        discount: 0,
      });
    }
    
    return installments;
  };

  const handleSubmit = async (data: PaymentPlanFormData) => {
    try {
      const planData = {
        order_id: order?.id || 0,
        order_number: order?.number || 'POS',
        customer_name: order ? 
          `${order.billing.first_name} ${order.billing.last_name}` : 
          posData?.customerName || 'Cliente',
        customer_email: order?.billing.email || posData?.customerEmail || '',
        total_amount: totalWithInterest,
        installments_count: data.installments_count,
        payment_type: data.payment_type,
        interest_rate: data.interest_rate,
        status: 'active' as const,
        notes: data.notes,
      };

      if (posData && !order) {
        // Para POS, apenas retornar os dados do plano sem salvar no banco
        onPaymentPlanCreated?.(planData);
        onOpenChange(false);
        form.reset();
        return;
      }

      // Para pedidos existentes, criar no banco
      const paymentPlan = await createPaymentPlan.mutateAsync(planData);

      // Criar as parcelas
      const installments = calculateInstallments().map(installment => ({
        ...installment,
        payment_plan_id: paymentPlan.id,
      }));

      await createInstallments.mutateAsync(installments);

      onPaymentPlanCreated?.(paymentPlan.id);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao criar plano de pagamento:', error);
    }
  };

  if (!order && !posData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Parcelamento no POS
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              O parcelamento estará disponível após a integração com o sistema de pedidos.
            </p>
            <p className="text-sm text-muted-foreground">
              Por enquanto, você pode criar transações financeiras e planos de pagamento 
              diretamente na seção <strong>Financeiro</strong>.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => onOpenChange(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configurar Parcelamento {order ? `- Pedido #${order.number}` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* Informações do Pedido */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <div className="font-medium">
                  {order ? 
                    `${order.billing.first_name} ${order.billing.last_name}` : 
                    posData?.customerName || 'Cliente'
                  }
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <div className="font-semibold">R$ {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="installment">Parcelado</SelectItem>
                        <SelectItem value="future">Pagamento Futuro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installments_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(Math.max(1, field.value - 1))}
                        disabled={field.value <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          className="text-center"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(Math.min(12, field.value + 1))}
                        disabled={field.value >= 12}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Juros (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primeira Parcela</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o parcelamento..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview das Parcelas */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Preview das Parcelas</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <span>Parcela</span>
                    <span>Vencimento</span>
                    <span>Valor</span>
                  </div>
                  {calculateInstallments().map((installment, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                      <span>{installment.installment_number}/{watchedValues.installments_count}</span>
                      <span>{format(new Date(installment.due_date), 'dd/MM/yyyy')}</span>
                      <span className="font-semibold">R$ {installment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor Original:</span>
                    <span>R$ {totalAmount.toFixed(2)}</span>
                  </div>
                  {watchedValues.interest_rate > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Juros ({watchedValues.interest_rate}%):</span>
                      <span>+R$ {(totalWithInterest - totalAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total Final:</span>
                    <span>R$ {totalWithInterest.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createPaymentPlan.isPending || createInstallments.isPending} 
                className="flex-1"
              >
                {(createPaymentPlan.isPending || createInstallments.isPending) 
                  ? 'Criando...' 
                  : 'Criar Plano de Pagamento'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPlanDialog;