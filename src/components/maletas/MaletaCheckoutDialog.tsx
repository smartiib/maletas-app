import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, CreditCard, Package, ArrowRight } from 'lucide-react';
import { MaletaItem } from '@/services/maletas';
import { useCustomers, useCreateOrder } from '@/hooks/useWooCommerce';
import { toast } from '@/hooks/use-toast';

interface MaletaCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maleta: any;
  soldItems: Array<MaletaItem & { quantity_sold: number }>;
  onOrderCreated: (orderNumber: number, orderUrl: string) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  amount: number;
}

const MaletaCheckoutDialog: React.FC<MaletaCheckoutDialogProps> = ({
  open,
  onOpenChange,
  maleta,
  soldItems,
  onOrderCreated
}) => {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isGuestSale, setIsGuestSale] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', phone: '' });
  
  // Se a maleta tem cliente associado, usa automaticamente esses dados
  const hasAssociatedCustomer = maleta?.customer_name && maleta?.customer_email;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'PIX', amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: customers = [] } = useCustomers(1, '');
  const createOrder = useCreateOrder();

  useEffect(() => {
    if (open && soldItems.length > 0) {
      const total = getTotalPrice();
      setPaymentMethods([{ id: '1', name: 'PIX', amount: total }]);
      setNotes(`Venda originada da Maleta #${maleta?.number} - Representante: ${maleta?.representative_name}`);
    }
  }, [open, soldItems, maleta]);

  const getTotalPrice = () => {
    return soldItems.reduce((total, item) => 
      total + (parseFloat(item.price) * item.quantity_sold), 0
    );
  };

  const getTotalItems = () => {
    return soldItems.reduce((total, item) => total + item.quantity_sold, 0);
  };

  const addPaymentMethod = () => {
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      name: 'PIX',
      amount: 0
    };
    setPaymentMethods([...paymentMethods, newPayment]);
  };

  const updatePaymentMethod = (id: string, field: string, value: any) => {
    setPaymentMethods(payments =>
      payments.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const removePaymentMethod = (id: string) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(payments => payments.filter(p => p.id !== id));
    }
  };

  const getTotalPayments = () => {
    return paymentMethods.reduce((total, payment) => total + payment.amount, 0);
  };

  const handleFinalizePurchase = async () => {
    const totalPayments = getTotalPayments();
    const orderTotal = getTotalPrice();
    
    if (Math.abs(totalPayments - orderTotal) > 0.01) {
      toast({
        title: "Erro",
        description: "O valor total dos pagamentos deve ser igual ao valor do pedido",
        variant: "destructive"
      });
      return;
    }

    if (!hasAssociatedCustomer && !isGuestSale && !selectedCustomer) {
      toast({
        title: "Erro",
        description: "Selecione um cliente ou marque como venda de convidado",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        payment_method: paymentMethods.map(p => p.name).join(', '),
        payment_method_title: paymentMethods.map(p => `${p.name}: R$ ${p.amount.toFixed(2)}`).join(' | '),
        status: 'processing' as const,
        line_items: soldItems.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id || 0,
          quantity: item.quantity_sold,
          name: item.name,
          total: (parseFloat(item.price) * item.quantity_sold).toFixed(2)
        })),
        billing: hasAssociatedCustomer ? {
          first_name: maleta?.customer_name?.split(' ')[0] || 'Cliente',
          last_name: maleta?.customer_name?.split(' ').slice(1).join(' ') || '',
          email: maleta?.customer_email || 'cliente@loja.com',
          phone: '',
          address_1: 'Loja Física',
          city: 'Cidade',
          state: 'Estado',
          postcode: '00000-000',
          country: 'BR'
        } : isGuestSale ? {
          first_name: guestData.name.split(' ')[0] || 'Convidado',
          last_name: guestData.name.split(' ').slice(1).join(' ') || '',
          email: guestData.email || 'convidado@loja.com',
          phone: guestData.phone || '',
          address_1: 'Loja Física',
          city: 'Cidade',
          state: 'Estado',
          postcode: '00000-000',
          country: 'BR'
        } : {
          first_name: selectedCustomer.first_name,
          last_name: selectedCustomer.last_name,
          email: selectedCustomer.email,
          phone: selectedCustomer.billing?.phone || '',
          address_1: selectedCustomer.billing?.address_1 || 'Loja Física',
          city: selectedCustomer.billing?.city || 'Cidade',
          state: selectedCustomer.billing?.state || 'Estado',
          postcode: selectedCustomer.billing?.postcode || '00000-000',
          country: 'BR'
        },
        customer_note: notes,
        total: getTotalPrice().toFixed(2),
        meta_data: [
          { key: 'maleta_id', value: maleta?.id || 0 },
          { key: 'maleta_number', value: maleta?.number || '' },
          { key: 'representative_id', value: maleta?.representative_id || 0 },
          { key: 'representative_name', value: maleta?.representative_name || '' },
          { key: 'order_source', value: 'maleta' }
        ]
      };

      const createdOrder = await createOrder.mutateAsync(orderData);
      
      console.log('Created order:', createdOrder);
      console.log('Order ID:', createdOrder?.id);
      console.log('Order Number:', createdOrder?.number);
      
      // Determinar o número do pedido
      const orderNumber = createdOrder?.number || createdOrder?.id;
      
      toast({
        title: "Pedido Finalizado",
        description: `Pedido #${orderNumber} foi criado com sucesso no WooCommerce`,
      });

      // Construir URL do pedido no WooCommerce
      const wooConfig = (window as any).wooCommerceConfig;
      const orderUrl = wooConfig ? `${wooConfig.url}/wp-admin/post.php?post=${createdOrder.id}&action=edit` : '';
      
      console.log('WooCommerce Config:', wooConfig);
      console.log('Order URL:', orderUrl);
      console.log('Order Number:', orderNumber);

      onOrderCreated(typeof orderNumber === 'string' ? parseInt(orderNumber) : orderNumber, orderUrl);
      onOpenChange(false);
      
      // Reset form
      setSelectedCustomer(null);
      setIsGuestSale(false);
      setGuestData({ name: '', email: '', phone: '' });
      setPaymentMethods([{ id: '1', name: 'PIX', amount: 0 }]);
      setNotes('');
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar pedido da maleta",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToPOS = () => {
    try {
      setIsProcessing(true);
      
      // Preparar dados para o POS
      const posItems = soldItems.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity_sold,
        sku: item.sku,
        variation_attributes: item.variation_attributes || []
      }));
      
      // Salvar dados da maleta e itens vendidos no localStorage para o POS
      localStorage.setItem('maleta_checkout_data', JSON.stringify({
        maleta_id: maleta?.id,
        maleta_number: maleta?.number,
        items: posItems,
        customer_name: maleta?.customer_name,
        representative_name: maleta?.representative_name,
        from_maleta: true,
        has_associated_customer: hasAssociatedCustomer,
        guest_data: isGuestSale ? guestData : null,
        selected_customer: !isGuestSale ? selectedCustomer : null
      }));
      
      // Fechar diálogos e navegar para o POS
      onOpenChange(false);
      
      // Navegar para o POS
      navigate('/pos?from_maleta=true');
      
      toast({
        title: "Redirecionando para POS",
        description: "Finalize o pagamento no sistema POS",
      });
      
    } catch (error) {
      console.error('Error navigating to POS:', error);
      toast({
        title: "Erro",
        description: "Erro ao redirecionar para o POS",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Finalizar Venda da Maleta #{maleta?.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Representante: {maleta?.representative_name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Products Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" />
              <h3 className="font-semibold">Produtos Vendidos ({getTotalItems()} itens)</h3>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {soldItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-slate-500">
                      Qtd: {item.quantity_sold} × R$ {parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold">
                    R$ {(parseFloat(item.price) * item.quantity_sold).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total da Venda:</span>
                <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <h3 className="font-semibold">Cliente</h3>
            </div>
            
            {hasAssociatedCustomer ? (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Cliente da Maleta:</strong> Este pedido será faturado para o cliente associado à maleta.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Cliente</Label>
                    <Input
                      value={maleta?.customer_name || ''}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label>E-mail do Cliente</Label>
                    <Input
                      value={maleta?.customer_email || ''}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={isGuestSale ? 'guest' : 'customer'}
                  onValueChange={(value) => setIsGuestSale(value === 'guest')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer">Cliente Cadastrado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="guest" id="guest" />
                    <Label htmlFor="guest">Venda de Convidado</Label>
                  </div>
                </RadioGroup>

                {!isGuestSale ? (
                  <Select value={selectedCustomer?.id?.toString() || ''} onValueChange={(value) => {
                    const customer = customers.find(c => c.id.toString() === value);
                    setSelectedCustomer(customer || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.first_name} {customer.last_name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="guest-name">Nome</Label>
                      <Input
                        id="guest-name"
                        value={guestData.name}
                        onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-email">E-mail</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        value={guestData.email}
                        onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="E-mail do cliente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-phone">Telefone</Label>
                      <Input
                        id="guest-phone"
                        value={guestData.phone}
                        onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Telefone do cliente"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-semibold">Formas de Pagamento</h3>
            </div>
            
            <div className="space-y-3">
              {paymentMethods.map((payment, index) => (
                <div key={payment.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Forma de Pagamento {index + 1}</Label>
                    <Select 
                      value={payment.name} 
                      onValueChange={(value) => updatePaymentMethod(payment.id, 'name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => updatePaymentMethod(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                    />
                  </div>
                  {paymentMethods.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(payment.id)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={addPaymentMethod}>
                Adicionar Forma de Pagamento
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Pagamentos:</p>
                <p className="text-lg font-bold">R$ {getTotalPayments().toFixed(2)}</p>
              </div>
            </div>

            {Math.abs(getTotalPayments() - getTotalPrice()) > 0.01 && (
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Diferença:</strong> R$ {(getTotalPrice() - getTotalPayments()).toFixed(2)}
                  {getTotalPayments() > getTotalPrice() ? ' (Troco)' : ' (Faltando)'}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="order-notes">Observações do Pedido</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pedido..."
              className="h-20"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-primary"
            onClick={handleGoToPOS}
            disabled={isProcessing || (!hasAssociatedCustomer && !isGuestSale && !selectedCustomer)}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processando...' : 'Ir para POS'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleFinalizePurchase}
            disabled={isProcessing || Math.abs(getTotalPayments() - getTotalPrice()) > 0.01}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isProcessing ? 'Finalizando...' : 'Finalizar Aqui'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaletaCheckoutDialog;