import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, ShoppingCart, User, CreditCard, Search } from 'lucide-react';
import { useProducts, useCreateOrder } from '@/hooks/useWooCommerce';
import { Customer } from '@/services/woocommerce';
import { useSupabaseCustomers } from '@/hooks/useSupabaseSync';

interface CartItem {
  id: number;
  name: string;
  price: string | number;
  quantity: number | string;
  sku: string;
  variation_id?: number;
  variation_attributes?: { name: string; option: string }[];
}

interface PaymentMethod {
  id: string;
  name: string;
  amount: number;
}

const POS = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestSale, setIsGuestSale] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', phone: '' });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'PIX', amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: productsData } = useProducts(1, 100);
  const products = productsData?.data || [];
  const createOrder = useCreateOrder();
  const { data: customersData } = useSupabaseCustomers(1, '');
  const customers = customersData?.customers || [];

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedCart = localStorage.getItem('pos_cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }

    // Load maleta checkout data if available
    const maletaCheckoutData = localStorage.getItem('maleta_checkout_data');
    if (maletaCheckoutData && location.search.includes('from_maleta=true')) {
      const data = JSON.parse(maletaCheckoutData);
      setCartItems(data.items);

      // Set customer data if available
      if (data.has_associated_customer) {
        setIsGuestSale(false);
        setSelectedCustomer({
          first_name: data.customer_name.split(' ')[0] || 'Cliente',
          last_name: data.customer_name.split(' ').slice(1).join(' ') || '',
          email: '',
          billing: {
            phone: ''
          }
        } as Customer);
      } else if (data.guest_data) {
        setIsGuestSale(true);
        setGuestData(data.guest_data);
      } else if (data.selected_customer) {
        setIsGuestSale(false);
        setSelectedCustomer(data.selected_customer);
      }

      // Clear the localStorage
      localStorage.removeItem('maleta_checkout_data');
    }
  }, []);

  // Save cart items to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const filteredProducts = products.filter((product) => {
    const searchTermLower = searchTerm.toLowerCase();
    const productNameLower = product.name.toLowerCase();
    const productSKU = product.sku?.toLowerCase() || '';

    const matchesSearch =
      productNameLower.includes(searchTermLower) ||
      productSKU.includes(searchTermLower);

    const matchesCategory =
      categoryFilter === '' ||
      product.categories.some((cat: any) => cat.name === categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const calculateItemTotal = (item: CartItem) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return price * item.quantity;
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      return sum + itemTotal;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => {
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
      return sum + quantity;
    }, 0);
  };

  const addToCart = (product: any, quantity: number = 1) => {
    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      const newCartItems = [...cartItems];
      const existingItem = newCartItems[existingItemIndex];
      const newQuantity = (typeof existingItem.quantity === 'string' ? parseInt(existingItem.quantity) : existingItem.quantity) + quantity;
      newCartItems[existingItemIndex] = { ...existingItem, quantity: newQuantity };
      setCartItems(newCartItems);
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        sku: product.sku,
        variation_id: product.variation_id,
        variation_attributes: product.attributes
      }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    const newCartItems = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: quantity };
      }
      return item;
    });
    setCartItems(newCartItems);
  };

  const removeItem = (id: number) => {
    const newCartItems = cartItems.filter((item) => item.id !== id);
    setCartItems(newCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
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
    const orderTotal = getTotal();

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
          id: 0,
          product_id: item.id,
          variation_id: item.variation_id || 0,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
          name: item.name,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          total: calculateItemTotal(item).toFixed(2),
          subtotal: calculateItemTotal(item).toFixed(2),
          subtotal_tax: '0.00',
          total_tax: '0.00',
          taxes: [],
          meta_data: [],
          sku: item.sku || '',
          image: { src: '' },
          parent_name: null,
          tax_class: ''
        })),
        billing: isGuestSale ? {
          first_name: guestData.name.split(' ')[0] || 'Convidado',
          last_name: guestData.name.split(' ').slice(1).join(' ') || '',
          company: '',
          address_1: 'Loja Física',
          address_2: '',
          city: 'Cidade',
          state: 'Estado',
          postcode: '00000-000',
          country: 'BR',
          email: guestData.email || 'convidado@loja.com',
          phone: guestData.phone || ''
        } : {
          first_name: selectedCustomer?.first_name || 'Cliente',
          last_name: selectedCustomer?.last_name || '',
          company: selectedCustomer?.billing?.company || '',
          address_1: selectedCustomer?.billing?.address_1 || 'Loja Física',
          address_2: selectedCustomer?.billing?.address_2 || '',
          city: selectedCustomer?.billing?.city || 'Cidade',
          state: selectedCustomer?.billing?.state || 'Estado',
          postcode: selectedCustomer?.billing?.postcode || '00000-000',
          country: 'BR',
          email: selectedCustomer?.email || 'cliente@loja.com',
          phone: selectedCustomer?.billing?.phone || ''
        },
        customer_note: notes,
        total: getTotal().toFixed(2)
      };

      await createOrder.mutateAsync(orderData);
      toast({
        title: "Pedido Finalizado",
        description: "Pedido foi criado com sucesso no WooCommerce",
      });
      clearCart();
      setIsCheckoutDialogOpen(false);
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

  const handleOpenCheckoutDialog = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho Vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a compra",
        variant: "warning"
      });
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  const handleCloseCheckoutDialog = () => {
    setIsCheckoutDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-semibold">Ponto de Venda</h1>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <img
                    src={product.images[0]?.src}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.categories.map((cat: any) => cat.name).join(', ')}</p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold">
                      R$ {typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price?.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-96 p-6 bg-gray-50 border-l flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Carrinho</h2>
            
            <div className="overflow-y-auto flex-1">
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">Nenhum item no carrinho.</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          R$ {typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price?.toFixed(2)}
                        </p>
                        {item.variation_attributes && item.variation_attributes.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {item.variation_attributes.map((attr, index) => (
                              <div key={index}>
                                {attr.name}: {attr.option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between font-semibold">
                <span>Total de Itens:</span>
                <span>{getTotalItems()}</span>
              </div>
              <div className="flex justify-between font-semibold text-xl">
                <span>Total:</span>
                <span>R$ {getTotal().toFixed(2)}</span>
              </div>
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                onClick={handleOpenCheckoutDialog}
                disabled={cartItems.length === 0}
              >
                Finalizar Compra
              </Button>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={clearCart}
                disabled={cartItems.length === 0}
              >
                Limpar Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isCheckoutDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-auto mt-20 max-w-4xl bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Finalizar Compra</h2>

            <div className="space-y-4">
              <div>
                <Label>Cliente:</Label>
                <RadioGroup
                  defaultValue="guest"
                  className="flex space-x-2"
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
              </div>

              {!isGuestSale ? (
                <div>
                  <Select onValueChange={(value) => {
                    const customer = customers.find(c => c.id.toString() === value);
                    setSelectedCustomer(customer || null);
                  }}>
                    <SelectTrigger className="w-full">
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
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="guest-name">Nome:</Label>
                    <Input
                      type="text"
                      id="guest-name"
                      value={guestData.name}
                      onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-email">Email:</Label>
                    <Input
                      type="email"
                      id="guest-email"
                      value={guestData.email}
                      onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-phone">Telefone:</Label>
                    <Input
                      type="tel"
                      id="guest-phone"
                      value={guestData.phone}
                      onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Formas de Pagamento:</Label>
                {paymentMethods.map((payment, index) => (
                  <div key={payment.id} className="flex items-center space-x-2 mb-2">
                    <Select
                      defaultValue="PIX"
                      onValueChange={(value) => updatePaymentMethod(payment.id, 'name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={payment.amount}
                      onChange={(e) => updatePaymentMethod(payment.id, 'amount', parseFloat(e.target.value))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removePaymentMethod(payment.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPaymentMethod}>
                  Adicionar Forma de Pagamento
                </Button>
              </div>

              <div>
                <Label htmlFor="notes">Observações:</Label>
                <Textarea
                  id="notes"
                  placeholder="Alguma observação?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="ghost" onClick={handleCloseCheckoutDialog}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleFinalizePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? 'Finalizando...' : 'Finalizar Compra'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
