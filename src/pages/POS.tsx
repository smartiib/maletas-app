import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useSupabaseCustomers } from '@/hooks/useSupabaseSync';
import { useCreateOrder } from '@/hooks/useWooCommerce';
import { Product } from '@/services/woocommerce';
import { Search, ShoppingCart, User, CreditCard, Plus, Minus, X } from 'lucide-react';

interface CartItem extends Product {
  quantity: number;
  variation_id?: number;
  variation_attributes?: any;
}

interface PaymentMethod {
  id: string;
  name: string;
  amount: number;
}

const POS = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isGuestSale, setIsGuestSale] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', phone: '' });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'PIX', amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [maletaCheckoutData, setMaletaCheckoutData] = useState<any>(null);

  const { data: customersData } = useSupabaseCustomers(1, '');
  const customers = customersData?.customers || [];
  const createOrder = useCreateOrder();

  useEffect(() => {
    // Carregar dados da maleta do localStorage se estiver vindo da maleta
    const params = new URLSearchParams(location.search);
    const fromMaleta = params.get('from_maleta') === 'true';

    if (fromMaleta) {
      const maletaData = localStorage.getItem('maleta_checkout_data');
      if (maletaData) {
        const parsedData = JSON.parse(maletaData);
        setMaletaCheckoutData(parsedData);
        setCartItems(parsedData.items);
        
        // Preencher dados do cliente se existirem
        if (parsedData.has_associated_customer) {
          // Não precisa fazer nada, pois os campos serão preenchidos automaticamente
        } else if (parsedData.guest_data) {
          setIsGuestSale(true);
          setGuestData(parsedData.guest_data);
        } else if (parsedData.selected_customer) {
          setSelectedCustomer(parsedData.selected_customer);
        }
        
        // Limpar localStorage após carregar os dados
        localStorage.removeItem('maleta_checkout_data');
      }
    }
  }, [location]);

  const handleSearch = async () => {
    // Implementar lógica de busca de produtos aqui
    // Atualizar o estado searchResults com os resultados da busca
    setSearchResults([]); // Remover esta linha quando a busca estiver implementada
    toast({
      title: "Aviso",
      description: "A busca de produtos ainda não foi implementada.",
    });
  };

  const handleAddToCart = (product: Product, variation?: any) => {
    const existingItemIndex = cartItems.findIndex(item =>
      item.id === product.id && item.variation_id === (variation ? variation.id : 0)
    );
  
    if (existingItemIndex > -1) {
      // Se o produto já existe no carrinho, aumentar a quantidade
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += 1;
      setCartItems(updatedCartItems);
    } else {
      // Se for uma variação, adicionar os atributos da variação ao item do carrinho
      if (variation) {
        setCartItems([...cartItems, {
          ...product,
          quantity: 1,
          variation_id: variation.id,
          variation_attributes: variation.attributes
        }]);
      } else {
        // Se o produto não existe no carrinho, adicionar com quantidade 1
        setCartItems([...cartItems, { ...product, quantity: 1 }]);
      }
    }
  };

  const updateCartItemQuantity = (item: CartItem, quantity: number) => {
    if (quantity < 0) return;
    
    const updatedCartItems = cartItems.map(cartItem => {
      if (cartItem.id === item.id && cartItem.variation_id === item.variation_id) {
        return { ...cartItem, quantity };
      }
      return cartItem;
    });
    setCartItems(updatedCartItems);
  };

  const removeCartItem = (item: CartItem) => {
    const updatedCartItems = cartItems.filter(cartItem =>
      !(cartItem.id === item.id && cartItem.variation_id === item.variation_id)
    );
    setCartItems(updatedCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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

    if (!isGuestSale && !selectedCustomer) {
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
        line_items: cartItems.map((item, index) => ({
          id: 0, // WooCommerce will assign the actual ID
          product_id: item.id,
          variation_id: item.variation_id || 0,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          total: (item.price * item.quantity).toFixed(2),
          subtotal: (item.price * item.quantity).toFixed(2),
          subtotal_tax: '0.00',
          total_tax: '0.00',
          taxes: [],
          meta_data: [],
          sku: item.sku || '',
          image: { src: '' }
        })),
        billing: isGuestSale ? {
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
        total: getTotalPrice().toFixed(2)
      };

      const createdOrder = await createOrder.mutateAsync(orderData);
      
      toast({
        title: "Pedido Finalizado",
        description: `Pedido #${createdOrder?.id} foi criado com sucesso no WooCommerce`,
      });

      clearCart();
      setSelectedCustomer(null);
      setIsGuestSale(false);
      setGuestData({ name: '', email: '', phone: '' });
      setPaymentMethods([{ id: '1', name: 'PIX', amount: 0 }]);
      setNotes('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar pedido",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Ponto de Venda</h1>

      {/* Product Search */}
      <div className="flex items-center mb-4">
        <Input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className="ml-2" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Resultados da Busca</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map(product => (
              <div key={product.id} className="border rounded-lg p-2">
                <h3 className="text-md font-semibold">{product.name}</h3>
                <p className="text-gray-600">R$ {product.price}</p>
                <Button className="w-full mt-2" onClick={() => handleAddToCart(product)}>
                  Adicionar ao Carrinho
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shopping Cart */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Carrinho de Compras</h2>
          {cartItems.length === 0 ? (
            <p>O carrinho está vazio.</p>
          ) : (
            <div className="space-y-3">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.variation_id || 0}`} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-md truncate">{item.name}</div>
                    {item.variation_attributes && (
                      <div className="text-sm text-gray-500">
                        {Object.entries(item.variation_attributes).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    )}
                    <div className="text-gray-600 text-sm">R$ {item.price}</div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItemQuantity(item, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={item.quantity}
                      onChange={(e) => updateCartItemQuantity(item, parseInt(e.target.value))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartItemQuantity(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 ml-2"
                      onClick={() => removeCartItem(item)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>R$ {getTotalPrice().toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={clearCart}>
                Limpar Carrinho
              </Button>
            </div>
          )}
        </div>

        {/* Checkout */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Finalizar Compra</h2>

          {/* Customer Selection */}
          <div className="space-y-4 mb-4">
            <h3 className="font-semibold">Cliente</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-4">
            <h3 className="font-semibold">Formas de Pagamento</h3>
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
          <div className="space-y-2 mb-4">
            <Label htmlFor="order-notes">Observações do Pedido</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pedido..."
              className="h-20"
            />
          </div>

          <Button
            className="w-full bg-gradient-primary"
            onClick={handleFinalizePurchase}
            disabled={isProcessing || Math.abs(getTotalPayments() - getTotalPrice()) > 0.01}
          >
            {isProcessing ? 'Finalizando...' : 'Finalizar Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POS;
