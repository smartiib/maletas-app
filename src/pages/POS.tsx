import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Package, Save, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useProducts, useCreateOrder } from '@/hooks/useWooCommerce';
import { Product } from '@/services/woocommerce';
import { toast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
  variation_id?: number;
  variation_attributes?: Array<{ name: string; value: string }>;
}

interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  notes: string;
  savedAt: Date;
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState({ type: 'percentage' as 'percentage' | 'fixed', value: 0 });
  const [notes, setNotes] = useState('');
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
  const [showSavedCarts, setShowSavedCarts] = useState(false);

  const { data: products = [], isLoading, error } = useProducts(1, searchTerm);
  const createOrder = useCreateOrder();

  // Carregar carrinhos salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pos_saved_carts');
    if (saved) {
      setSavedCarts(JSON.parse(saved));
    }
  }, []);

  // Extrair categorias únicas dos produtos
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categories?.[0]?.name).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.categories?.[0]?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        variation_attributes: variationAttributes
      }];
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart(currentCart => currentCart.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  const getTotalPrice = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const saveCart = () => {
    const cartName = prompt('Nome para salvar o carrinho:');
    if (!cartName) return;

    const newSavedCart: SavedCart = {
      id: Date.now().toString(),
      name: cartName,
      items: [...cart],
      discount: { ...discount },
      notes,
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
    setDiscount(savedCart.discount);
    setNotes(savedCart.notes);
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
    if (!paymentMethod) {
      toast({
        title: "Erro",
        description: "Selecione um método de pagamento",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        payment_method: paymentMethod,
        payment_method_title: paymentMethod,
        status: 'processing' as const,
        line_items: cart.map(item => ({
          product_id: item.id,
          variation_id: item.variation_id || 0,
          quantity: item.quantity,
          name: item.name,
          total: (parseFloat(item.price) * item.quantity).toString()
        })),
        billing: {
          first_name: 'POS',
          last_name: 'Customer',
          email: 'pos@loja.com',
          phone: '',
          address_1: 'Loja Física',
          city: 'Cidade',
          state: 'Estado',
          postcode: '00000-000',
          country: 'BR'
        },
        customer_note: notes,
        total: getTotalPrice().toFixed(2)
      };

      await createOrder.mutateAsync(orderData);
      
      // Limpar carrinho após finalização
      setCart([]);
      setDiscount({ type: 'percentage', value: 0 });
      setNotes('');
      setPaymentMethod('');
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
      {/* Header POS */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Área de Produtos */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Busca e Filtros */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-gradient-primary" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Carrinho */}
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
                {cart.map(item => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <p className="font-bold">
                        R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
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
              {/* Desconto */}
              <div className="space-y-2">
                <Label>Desconto</Label>
                <div className="flex gap-2">
                  <Select value={discount.type} onValueChange={(value: 'percentage' | 'fixed') => setDiscount({...discount, type: value})}>
                    <SelectTrigger className="w-24">
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
                    value={discount.value}
                    onChange={(e) => setDiscount({...discount, value: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações do pedido..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-16"
                />
              </div>

              {/* Totais */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {getSubtotal().toFixed(2)}</span>
                </div>
                {discount.value > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({discount.type === 'percentage' ? `${discount.value}%` : `R$ ${discount.value}`}):</span>
                    <span>-R$ {getDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-success hover:opacity-90 h-12 text-lg"
                onClick={() => setShowCheckout(true)}
              >
                Finalizar Pedido
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setCart([]);
                  setDiscount({ type: 'percentage', value: 0 });
                  setNotes('');
                }}
              >
                Limpar Carrinho
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Finalizar Pedido</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Método de Pagamento</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto">Boleto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cartao_credito" id="cartao_credito" />
                    <Label htmlFor="cartao_credito">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dinheiro" id="dinheiro" />
                    <Label htmlFor="dinheiro">Dinheiro</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total a Pagar:</span>
                  <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCheckout(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-gradient-success"
                  onClick={finalizePurchase}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
