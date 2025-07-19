import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, Percent, DollarSign, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  variation_id?: number;
  variation_attributes?: Array<{ name: string; value: string }>;
  item_discount?: { type: 'percentage' | 'fixed'; value: number };
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: number, quantity: number, variationId?: number) => void;
  removeFromCart: (id: number, variationId?: number) => void;
  updateItemDiscount: (id: number, discount: { type: 'percentage' | 'fixed'; value: number }, variationId?: number) => void;
  getItemTotal: (item: CartItem) => number;
  getSubtotal: () => number;
  getTotalItems: () => number;
  onCheckout: () => void;
  onCreateMaleta: () => void;
  clearCart: () => void;
  saveCart: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  updateItemDiscount,
  getItemTotal,
  getSubtotal,
  getTotalItems,
  onCheckout,
  onCreateMaleta,
  clearCart,
  saveCart
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out z-[60] md:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Carrinho</h2>
            <Badge variant="secondary" className="min-w-[24px]">
              {getTotalItems()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">Carrinho vazio</p>
                <p className="text-sm text-slate-400">Adicione produtos para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.variation_id || 0}`} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        {item.variation_attributes && (
                          <div className="text-xs text-slate-500 mt-1">
                            {item.variation_attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id, item.variation_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.variation_id)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variation_id)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(getItemTotal(item))}</div>
                        <div className="text-xs text-slate-500">
                          {formatPrice(parseFloat(item.price))} each
                        </div>
                      </div>
                    </div>

                    {/* Item Discount */}
                    <div className="mt-2 p-2 bg-white dark:bg-slate-600 rounded border-l-2 border-orange-400">
                      <Label className="text-xs">Desconto Individual</Label>
                      <div className="flex items-center space-x-1 mt-1">
                        <Select
                          value={item.item_discount?.type || 'percentage'}
                          onValueChange={(value: 'percentage' | 'fixed') => 
                            updateItemDiscount(item.id, { 
                              type: value, 
                              value: item.item_discount?.value || 0 
                            }, item.variation_id)
                          }
                        >
                          <SelectTrigger className="w-16 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">R$</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={item.item_discount?.value || 0}
                          onChange={(e) => 
                            updateItemDiscount(item.id, {
                              type: item.item_discount?.type || 'percentage',
                              value: parseFloat(e.target.value) || 0
                            }, item.variation_id)
                          }
                          className="h-8 text-xs"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 pb-20 space-y-3 bg-white dark:bg-slate-800">
              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(getSubtotal())}</span>
                </div>
              </div>

              {/* Main Actions */}
              <div className="space-y-2">
                <Button 
                  onClick={onCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Finalizar Pedido
                </Button>
                
                <Button 
                  onClick={onCreateMaleta}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Criar Maleta
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveCart}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;