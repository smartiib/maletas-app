import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Package, Save, Percent, DollarSign, Printer, User, UserPlus, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAllProducts, useCreateOrder, useAllCustomers, useCategories } from '@/hooks/useWooCommerce';
import { Product } from '@/services/woocommerce';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import MaletaDialog from '@/components/maletas/MaletaDialog';
import CategorySlider from '@/components/pos/CategorySlider';
import CartSidebar from '@/components/pos/CartSidebar';
import FloatingCartButton from '@/components/pos/FloatingCartButton';
import PaymentPlanDialog from '@/components/orders/PaymentPlanDialog';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';

interface CartItem extends Product {
  quantity: number;
  variation_id?: number;
  variation_attributes?: Array<{ name: string; value: string }>;
  item_discount?: { type: 'percentage' | 'fixed'; value: number };
}

interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  savedAt: Date;
}

interface PaymentMethod {
  id: string;
  name: string;
  amount: number;
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState(''); // Input de busca local dinâmica
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todos');
  };

  // Função para limpar apenas a busca quando categoria mudou
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Se mudou categoria, limpar a busca para mostrar todos os produtos da categoria
    if (category !== selectedCategory) {
      setSearchTerm('');
    }
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMaletaDialog, setShowMaletaDialog] = useState(false);
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [showSavedCarts, setShowSavedCarts] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  // Checkout modal states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isGuestSale, setIsGuestSale] = useState(false);
  const [guestData, setGuestData] = useState({ name: '', email: '', phone: '' });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'PIX', amount: 0 }
  ]);
  const [showPaymentPlan, setShowPaymentPlan] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState({ type: 'percentage' as 'percentage' | 'fixed', value: 0 });
  const [notes, setNotes] = useState('');

  // Mobile detection
  const isMobile = useIsMobile();

  // Carregar todos os produtos uma única vez (sem busca na API)
  const { data: products = [], isLoading, error } = useAllProducts('');
  const { data: customers = [] } = useAllCustomers();
  const { data: categoriesData = [] } = useCategories();
  const createOrder = useCreateOrder();

  // Carregar carrinhos salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pos_saved_carts');
    if (saved) {
      setSavedCarts(JSON.parse(saved));
    }
  }, []);

  // Busca dinâmica local - sem debounce, filtra em tempo real

  // Ordenar categorias por quantidade de produtos (mais produtos primeiro)
  const categoriesWithCounts = categoriesData.map(cat => ({
    ...cat,
    productCount: products.filter(p => p.categories?.some(c => c.id === cat.id)).length
  })).sort((a, b) => b.productCount - a.productCount);

  const categories = ['Todos', ...Array.from(new Set(categoriesWithCounts.map(cat => cat.name)))];

  // Debug para verificar se o filtro está sendo recalculado
  console.log('Recalculando filtro:', { searchTerm, selectedCategory, productsLength: products.length });
  
  const filteredProducts = products
    .filter(product => {
      // Filtro de busca local dinâmica (tempo real) - busca por nome, SKU do produto e SKUs das variações
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm.length === 0 || 
                           product.name.toLowerCase().includes(searchLower) ||
                           product.sku?.toLowerCase().includes(searchLower) ||
                           // Busca exata por SKU também (para casos como ARO0500)
                           product.sku?.toLowerCase() === searchLower ||
                           product.variations?.some(variation => 
                             variation.sku?.toLowerCase().includes(searchLower) ||
                             variation.sku?.toLowerCase() === searchLower
                           );
      
      // Filtro de categoria
      const matchesCategory = selectedCategory === 'Todos' || 
                             product.categories?.some(cat => cat.name === selectedCategory);
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Se há busca, ordenar por relevância
      if (searchTerm.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        
        // Priorizar matches exatos no nome
        const aExactName = a.name.toLowerCase() === searchLower;
        const bExactName = b.name.toLowerCase() === searchLower;
        if (aExactName && !bExactName) return -1;
        if (!aExactName && bExactName) return 1;
        
        // Priorizar matches exatos no SKU
        const aExactSku = a.sku?.toLowerCase() === searchLower;
        const bExactSku = b.sku?.toLowerCase() === searchLower;
        if (aExactSku && !bExactSku) return -1;
        if (!aExactSku && bExactSku) return 1;
        
        // Priorizar matches que começam com o termo
        const aStartsName = a.name.toLowerCase().startsWith(searchLower);
        const bStartsName = b.name.toLowerCase().startsWith(searchLower);
        if (aStartsName && !bStartsName) return -1;
        if (!aStartsName && bStartsName) return 1;
        
        const aStartsSku = a.sku?.toLowerCase().startsWith(searchLower);
        const bStartsSku = b.sku?.toLowerCase().startsWith(searchLower);
        if (aStartsSku && !bStartsSku) return -1;
        if (!aStartsSku && bStartsSku) return 1;
      }
      
      // Ordenação alfabética por nome como fallback
      return a.name.localeCompare(b.name);
    });
  
  console.log('Produtos filtrados:', filteredProducts.length);

  const addToCart = (product: Product, variationId?: number, variationAttributes?: Array<{ name: string; value: string }>) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => 
        item.id === product.id && 
        item.variation_id === variationId
      );
      
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id && item.variation_id === variationId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...currentCart, { 
        ...product, 
        quantity: 1,
        variation_id: variationId,
        variation_attributes: variationAttributes,
        item_discount: { type: 'percentage', value: 0 }
      }];
    });
  };

  const updateQuantity = (id: number, quantity: number, variationId?: number) => {
    if (quantity <= 0) {
      removeFromCart(id, variationId);
      return;
    }
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === id && item.variation_id === variationId
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const removeFromCart = (id: number, variationId?: number) => {
    setCart(currentCart => currentCart.filter(item => 
      !(item.id === id && item.variation_id === variationId)
    ));
  };

  const updateItemDiscount = (id: number, discount: { type: 'percentage' | 'fixed'; value: number }, variationId?: number) => {
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === id && item.variation_id === variationId
          ? { ...item, item_discount: discount }
          : item
      )
    );
  };

  const getItemTotal = (item: CartItem) => {
    const basePrice = parseFloat(item.price) * item.quantity;
    if (!item.item_discount || item.item_discount.value === 0) return basePrice;
    
    const discountAmount = item.item_discount.type === 'percentage' 
      ? (basePrice * item.item_discount.value) / 100
      : item.item_discount.value;
    
    return Math.max(0, basePrice - discountAmount);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + getItemTotal(item), 0);
  };

  const getGlobalDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (globalDiscount.type === 'percentage') {
      return (subtotal * globalDiscount.value) / 100;
    }
    return globalDiscount.value;
  };

  const getTotalPrice = () => {
    return Math.max(0, getSubtotal() - getGlobalDiscountAmount());
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const addPaymentMethod = () => {
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      name: 'Dinheiro',
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

  const printReceipt = () => {
    // Implementar impressão térmica Zebra
    const receiptData = {
      items: cart,
      customer: isGuestSale ? guestData : selectedCustomer,
      total: getTotalPrice(),
      payments: paymentMethods,
      date: new Date().toLocaleString('pt-BR')
    };
    
    console.log('Printing receipt:', receiptData);
    // Aqui você integraria com a API da impressora Zebra
    toast({
      title: "Recibo Enviado",
      description: "Recibo foi enviado para a impressora térmica",
    });
  };

  const saveCart = () => {
    const cartName = prompt('Nome para salvar o carrinho:');
    if (!cartName) return;

    const newSavedCart: SavedCart = {
      id: Date.now().toString(),
      name: cartName,
      items: [...cart],
      savedAt: new Date()
    };

    const updatedCarts = [...savedCarts, newSavedCart];
    setSavedCarts(updatedCarts);
    localStorage.setItem('pos_saved_carts', JSON.stringify(updatedCarts));
    
    toast({
      title: "Carrinho Salvo",
      description: `Carrinho "${cartName}" foi salvo com sucesso`,
    });
  };

  const loadCart = (savedCart: SavedCart) => {
    setCart(savedCart.items);
    setShowSavedCarts(false);
    
    toast({
      title: "Carrinho Carregado",
      description: `Carrinho "${savedCart.name}" foi carregado`,
    });
  };

  const deleteSavedCart = (cartId: string) => {
    const updatedCarts = savedCarts.filter(cart => cart.id !== cartId);
    setSavedCarts(updatedCarts);
    localStorage.setItem('pos_saved_carts', JSON.stringify(updatedCarts));
  };

  const finalizePurchase = async () => {
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

    try {
      const orderData = {
        payment_method: paymentMethods.map(p => p.name).join(', '),
        payment_method_title: paymentMethods.map(p => `${p.name}: R$ ${p.amount.toFixed(2)}`).join(' | '),
        status: 'processing' as const,
        line_items: cart.map(item => ({
          product_id: item.id,
          variation_id: item.variation_id || 0,
          quantity: item.quantity,
          name: item.name,
          total: getItemTotal(item).toFixed(2)
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

      await createOrder.mutateAsync(orderData);
      
      // Limpar dados após finalização
      setCart([]);
      setGlobalDiscount({ type: 'percentage', value: 0 });
      setNotes('');
      setPaymentMethods([{ id: '1', name: 'PIX', amount: 0 }]);
      setShowPaymentPlan(false);
      setSelectedCustomer(null);
      setIsGuestSale(false);
      setGuestData({ name: '', email: '', phone: '' });
      setShowCheckout(false);

      toast({
        title: "Pedido Finalizado",
        description: "Pedido foi criado com sucesso no WooCommerce",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar pedido",
        variant: "destructive"
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscount({ type: 'percentage', value: 0 });
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar produtos</p>
          <p className="text-sm text-slate-500">Verifique a configuração do WooCommerce</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900">
      {/* Ajuda da Página */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
        <PageHelp 
          title={helpContent.pos.title}
          description={helpContent.pos.description}
          helpContent={helpContent.pos}
        />
      </div>

      {/* Header POS */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Ponto de Venda
          </h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-success-600 border-success-600">
              {getTotalItems()} itens no carrinho
            </Badge>
            <Button
              variant="outline"
              onClick={() => setShowSavedCarts(!showSavedCarts)}
            >
              Carrinhos Salvos ({savedCarts.length})
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex h-[calc(100vh-8rem)] ${isMobile ? 'flex-col' : ''}`}>
        {/* Área de Produtos */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Busca e Filtros */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar produtos por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            <CategorySlider
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
            
            {/* Botão para limpar filtros */}
            {(searchTerm || selectedCategory !== 'Todos') && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Carrinhos Salvos */}
          {showSavedCarts && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border">
              <h3 className="font-semibold mb-3">Carrinhos Salvos</h3>
              <div className="grid gap-2">
                {savedCarts.map(savedCart => (
                  <div key={savedCart.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded">
                    <div>
                      <span className="font-medium">{savedCart.name}</span>
                      <span className="text-sm text-slate-500 ml-2">
                        ({savedCart.items.length} itens)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => loadCart(savedCart)}>
                        Carregar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteSavedCart(savedCart.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid de Produtos */}
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 pb-32' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={`product-${product.id}-${index}`}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Carrinho Desktop */}
        {!isMobile && (
          <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Carrinho</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCart}
                    disabled={cart.length === 0}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-500 mt-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Toque nos produtos para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${item.variation_id || 0}-${index}`} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                       <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center overflow-hidden">
                            {item.images && item.images.length > 0 ? (
                              <img 
                                src={item.images[0].src} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {item.sku && (
                              <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                            )}
                            {item.variation_attributes && (
                              <p className="text-xs text-slate-600">
                                {item.variation_attributes.map(attr => `${attr.name}: ${attr.value || 'N/A'}`).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id, item.variation_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variation_id)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variation_id)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <p className="font-bold">
                          R$ {getItemTotal(item).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Carrinho */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                {/* Total */}
                <div className="text-lg font-bold border-t pt-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>R$ {getSubtotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-success hover:opacity-90 h-12 text-lg"
                    onClick={() => setShowCheckout(true)}
                  >
                    Finalizar Pedido
                  </Button>
                  
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90 h-12 text-lg"
                    onClick={() => setShowMaletaDialog(true)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Criar Maleta
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearCart}
                >
                  Limpar Carrinho
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Carrinho Sidebar Mobile */}
      <CartSidebar
        isOpen={showCartSidebar}
        onClose={() => setShowCartSidebar(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        updateItemDiscount={updateItemDiscount}
        getItemTotal={getItemTotal}
        getSubtotal={getSubtotal}
        getTotalItems={getTotalItems}
        onCheckout={() => {
          setShowCartSidebar(false);
          setShowCheckout(true);
        }}
        onCreateMaleta={() => {
          setShowCartSidebar(false);
          setShowMaletaDialog(true);
        }}
        clearCart={clearCart}
        saveCart={saveCart}
        onShowSavedCarts={() => setShowSavedCarts(!showSavedCarts)}
        savedCartsCount={savedCarts.length}
        showSavedCarts={showSavedCarts}
        savedCarts={savedCarts}
        onLoadCart={loadCart}
        onDeleteSavedCart={deleteSavedCart}
      />

      {/* Botão Flutuante do Carrinho */}
      <FloatingCartButton
        itemCount={getTotalItems()}
        total={getSubtotal()}
        onClick={() => setShowCartSidebar(true)}
      />

      {/* Modal de Checkout Completo */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Finalizar Pedido</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Produtos e Descontos */}
              <div className="space-y-4">
                <h4 className="font-semibold">Itens do Pedido</h4>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${item.variation_id || 0}-${index}`} className="bg-slate-50 dark:bg-slate-700 p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                          <p className="text-sm">Qtd: {item.quantity} x R$ {parseFloat(item.price).toFixed(2)}</p>
                        </div>
                        <p className="font-bold">R$ {getItemTotal(item).toFixed(2)}</p>
                      </div>
                      
                      {/* Desconto por item */}
                      <div className="flex gap-2 mt-2">
                        <Select 
                          value={item.item_discount?.type || 'percentage'} 
                          onValueChange={(value: 'percentage' | 'fixed') => 
                            updateItemDiscount(item.id, { ...item.item_discount!, type: value }, item.variation_id)
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">R$</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.item_discount?.value || 0}
                          onChange={(e) => 
                            updateItemDiscount(item.id, { 
                              type: item.item_discount?.type || 'percentage', 
                              value: parseFloat(e.target.value) || 0 
                            }, item.variation_id)
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desconto Geral */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Desconto Geral</Label>
                  <div className="flex gap-2 mt-2">
                    <Select value={globalDiscount.type} onValueChange={(value: 'percentage' | 'fixed') => setGlobalDiscount({...globalDiscount, type: value})}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">R$</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="0"
                      value={globalDiscount.value}
                      onChange={(e) => setGlobalDiscount({...globalDiscount, value: parseFloat(e.target.value) || 0})}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded font-bold text-lg">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>R$ {getSubtotal().toFixed(2)}</span>
                  </div>
                  {globalDiscount.value > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span>Desconto ({globalDiscount.type === 'percentage' ? `${globalDiscount.value}%` : `R$ ${globalDiscount.value}`}):</span>
                      <span>-R$ {getGlobalDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Cliente e Pagamento */}
              <div className="space-y-4">
                 {/* Cliente */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Cliente</Label>
                  <div className="space-y-3">
                    <Button
                      variant={!isGuestSale ? "default" : "outline"}
                      className={`w-full justify-start ${!isGuestSale ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => setIsGuestSale(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Cliente Cadastrado
                    </Button>
                    
                    {!isGuestSale && (
                      <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                        const customer = customers.find(c => c.id.toString() === value);
                        setSelectedCustomer(customer);
                      }}>
                        <SelectTrigger>
                          <User className="w-4 h-4 mr-2" />
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
                    )}

                    <Button
                      variant={isGuestSale ? "default" : "outline"}
                      className={`w-full justify-start ${isGuestSale ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => setIsGuestSale(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Venda como Convidado
                    </Button>

                    {isGuestSale && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Nome do cliente"
                          value={guestData.name}
                          onChange={(e) => setGuestData({...guestData, name: e.target.value})}
                        />
                        <Input
                          placeholder="Email (opcional)"
                          value={guestData.email}
                          onChange={(e) => setGuestData({...guestData, email: e.target.value})}
                        />
                        <Input
                          placeholder="Telefone (opcional)"
                          value={guestData.phone}
                          onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div>
                   <div className="flex items-center justify-between mb-2">
                     <Label className="text-sm font-medium">Formas de Pagamento</Label>
                     <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const totalValue = getTotalPrice();
                            setPaymentMethods([{ id: '1', name: 'PIX', amount: totalValue }]);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pagar Total
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowPaymentPlan(true)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Parcelamento
                        </Button>
                        <Button size="sm" onClick={addPaymentMethod}>
                          <Plus className="w-4 h-4" />
                        </Button>
                     </div>
                   </div>
                  
                  <div className="space-y-2">
                    {paymentMethods.map((payment, index) => (
                      <div key={payment.id} className="flex gap-2">
                        <Select value={payment.name} onValueChange={(value) => updatePaymentMethod(payment.id, 'name', value)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PIX">PIX</SelectItem>
                              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                              <SelectItem value="Transferência">Transferência</SelectItem>
                              <SelectItem value="Boleto">Boleto</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                              <SelectItem value="Crediário">Crediário</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={payment.amount}
                          onChange={(e) => updatePaymentMethod(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                        {paymentMethods.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePaymentMethod(payment.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-sm mt-2">
                    <div className="flex justify-between">
                      <span>Total a Pagar:</span>
                      <span>R$ {getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pagamentos:</span>
                      <span className={getTotalPayments() === getTotalPrice() ? 'text-green-600' : 'text-red-600'}>
                        R$ {getTotalPayments().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <Textarea
                    placeholder="Observações do pedido..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-20 mt-2"
                  />
                </div>

              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCheckout(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={printReceipt}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                className="flex-1 bg-gradient-success"
                onClick={finalizePurchase}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? 'Processando...' : 'Confirmar Pedido'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Maleta */}
      <MaletaDialog
        open={showMaletaDialog}
        onOpenChange={setShowMaletaDialog}
        cartItems={cart.map(item => ({
          product_id: item.id,
          variation_id: item.variation_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))}
        onClearCart={clearCart}
      />

      {/* Dialog de Parcelamento */}
      <PaymentPlanDialog
        open={showPaymentPlan}
        onOpenChange={setShowPaymentPlan}
        order={null}
      />
    </div>
  );
};

// Componente separado para o card do produto
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variationId?: number, variationAttributes?: Array<{ name: string; value: string }>) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [showVariations, setShowVariations] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Verificar se o produto tem variações (tipo variable)
  const hasVariations = product.type === 'variable' && product.variations && product.variations.length > 0;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      setShowVariations(true);
      return;
    }

    if (selectedVariation) {
      onAddToCart(
        { ...product, price: selectedVariation.price },
        selectedVariation.id,
        selectedVariation.attributes
      );
    } else {
      onAddToCart(product);
    }
    setShowVariations(false);
    setSelectedVariation(null);
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-all-smooth hover:scale-105"
        onClick={handleAddToCart}
      >
        <CardContent className="p-4">
          <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
            {product.images?.[0]?.src ? (
              <img 
                src={product.images[0].src} 
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
            {product.name}
          </h3>
          {product.sku && (
            <p className="text-xs text-slate-500 mb-1">SKU: {product.sku}</p>
          )}
          <p className="text-lg font-bold text-primary mb-1">
            R$ {parseFloat(product.price || '0').toFixed(2)}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Estoque: {product.stock_quantity || 0}
            </p>
            {hasVariations && (
              <Badge variant="outline" className="text-xs">
                {product.variations?.length} variações
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Variações */}
      {showVariations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Selecionar Variação - {product.name}</h3>
            
            <div className="space-y-3 mb-4">
              {product.variations?.map((variation: any) => (
                <div
                  key={variation.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVariation?.id === variation.id
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedVariation(variation)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')}</p>
                      <p className="text-sm text-slate-500">SKU: {variation.sku || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {parseFloat(variation.price || '0').toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        Estoque: {variation.stock_quantity || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowVariations(false);
                  setSelectedVariation(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!selectedVariation}
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POS;
