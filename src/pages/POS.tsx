import React, { useState } from 'react';
import { useProducts, useCustomers, useCreateOrder } from '@/hooks/useWooCommerce';
import { Product, Customer } from '@/services/woocommerce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const createOrder = useCreateOrder();

  const filteredProducts = products?.data.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += 1;
      setCartItems(updatedCartItems);
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    const updatedCartItems = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCartItems);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const updatedCartItems = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCartItems);
  };

  const calculateItemTotal = (item: CartItem): number => {
    const price = parseFloat(item.price) || 0;
    return price * item.quantity;
  };

  const calculateSubtotal = (): number => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTax = (): number => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!customer) {
      toast({
        title: "Cliente Obrigatório",
        description: "Selecione um cliente antes de finalizar a venda.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const orderData = {
        payment_method: paymentMethod,
        payment_method_title: paymentMethod === 'cash' ? 'Dinheiro' : 
                              paymentMethod === 'card' ? 'Cartão' : 'PIX',
        status: "processing" as const,
        line_items: cartItems.map((item, index) => ({
          id: index + 1,
          product_id: item.id,
          variation_id: 0, // não há seleção de variação no POS; usar 0
          quantity: item.quantity,
          name: item.name,
          price: parseFloat(item.price),
          subtotal: (parseFloat(item.price) * item.quantity).toString(),
          subtotal_tax: "0",
          total: (parseFloat(item.price) * item.quantity).toString(),
          total_tax: "0",
          taxes: [],
          meta_data: [],
          sku: item.sku || "",
          tax_class: "",
          image: {
            src: item.images?.[0]?.src || ""
          },
          parent_name: null
        })),
        billing: {
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          company: customer.billing?.company || "",
          address_1: customer.billing?.address_1 || "",
          address_2: customer.billing?.address_2 || "",
          city: customer.billing?.city || "",
          state: customer.billing?.state || "",
          postcode: customer.billing?.postcode || "",
          country: customer.billing?.country || "BR",
          email: customer.email || "",
          phone: customer.billing?.phone || ""
        },
        customer_note: notes,
        total: calculateTotal().toFixed(2)
      };

      await createOrder.mutateAsync(orderData);
      
      // Reset cart
      setCartItems([]);
      setCustomer(null);
      setNotes('');
      setPaymentMethod('cash');
      
      toast({
        title: "Venda Finalizada",
        description: "Pedido criado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro na Venda",
        description: "Falha ao processar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
      <div className="flex items-center">
        <img src={item.images[0]?.src} alt={item.name} className="w-12 h-12 object-cover rounded mr-2" />
        <div>
          <h3 className="text-sm font-medium">{item.name}</h3>
          <p className="text-gray-500 text-xs">R$ {item.price}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
          className="w-20 text-center text-sm"
          min="1"
        />
        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-red-500"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
    </div>
  );

  const renderCartSummary = () => (
    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span>R$ {calculateSubtotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Taxa:</span>
        <span>R$ {calculateTax().toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
        <span>Total:</span>
        <span>R$ {calculateTotal().toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Products */}
      <div className="w-2/3 p-4">
        <Input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts?.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-md shadow-sm p-4 flex flex-col justify-between"
            >
              <div>
                <img
                  src={product.images[0]?.src}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <h3 className="text-sm font-medium">{product.name}</h3>
                <p className="text-gray-500 text-xs">R$ {product.price}</p>
              </div>
              <Button onClick={() => handleAddToCart(product)} className="w-full mt-2">
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right Panel - Cart */}
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Carrinho</h2>
        </div>
        
        {/* Cart Items */}
        <div className="p-4 space-y-4 overflow-y-auto flex-grow">
          {cartItems.length === 0 ? (
            <p className="text-gray-500">Carrinho vazio</p>
          ) : (
            cartItems.map(renderCartItem)
          )}
        </div>
        
        {/* Cart Summary */}
        {renderCartSummary()}
        
        {/* Customer Selection */}
        <div className="p-4 border-t border-gray-200">
          <Label className="text-sm font-medium mb-2 block">Cliente</Label>
          <Select 
            value={customer?.id.toString() || ""} 
            onValueChange={(value) => {
              const selectedCustomer = customers?.data.find(c => c.id.toString() === value);
              setCustomer(selectedCustomer || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers?.data.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method */}
        <div className="p-4 border-t border-gray-200">
          <Label className="text-sm font-medium mb-2 block">Forma de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="p-4 border-t border-gray-200">
          <Label className="text-sm font-medium mb-2 block">Observações</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações do pedido..."
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Checkout Button */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <Button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || !customer || isProcessing}
            className="w-full h-12 text-lg font-semibold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              `Finalizar Venda - R$ ${calculateTotal().toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
