
import React, { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mock produtos - em produção viria da API WooCommerce
  const products: Product[] = [
    { id: 1, name: 'iPhone 14 Pro', price: 5999, image: '/placeholder.svg', category: 'Eletrônicos', stock: 10 },
    { id: 2, name: 'MacBook Air M2', price: 8999, image: '/placeholder.svg', category: 'Eletrônicos', stock: 5 },
    { id: 3, name: 'AirPods Pro', price: 1299, image: '/placeholder.svg', category: 'Eletrônicos', stock: 25 },
    { id: 4, name: 'Camiseta Nike', price: 89.90, image: '/placeholder.svg', category: 'Roupas', stock: 50 },
    { id: 5, name: 'Tênis Adidas', price: 299.90, image: '/placeholder.svg', category: 'Calçados', stock: 15 },
    { id: 6, name: 'Fone JBL', price: 199.90, image: '/placeholder.svg', category: 'Eletrônicos', stock: 30 }
  ];

  const categories = ['Todos', 'Eletrônicos', 'Roupas', 'Calçados'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

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

          {/* Grid de Produtos */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all-smooth hover:scale-105"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-primary mb-1">
                    R$ {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Estoque: {product.stock}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header do Carrinho */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Carrinho</h2>
              <ShoppingCart className="w-5 h-5 text-slate-400" />
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
                        R$ {(item.price * item.quantity).toFixed(2)}
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
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {getTotalPrice().toFixed(2)}</span>
              </div>
              
              <Button className="w-full bg-gradient-success hover:opacity-90 h-12 text-lg">
                Finalizar Pedido
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCart([])}
              >
                Limpar Carrinho
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
