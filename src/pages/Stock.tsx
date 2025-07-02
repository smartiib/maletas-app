import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useWooCommerce';
import { Search, Plus, Minus, ChevronDown, ChevronRight, History, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StockHistoryEntry {
  date: string;
  type: 'adjustment' | 'sale' | 'maleta' | 'return';
  quantity: number;
  reason: string;
  user?: string;
  maleta_id?: string;
}

const Stock = () => {
  const [search, setSearch] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const { data: products, isLoading } = useProducts(1, search);

  const toggleExpanded = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const updateStock = async (productId: number, variationId: number | null, change: number, reason: string) => {
    try {
      // Aqui você implementaria a chamada para a API do WooCommerce
      // para atualizar o estoque do produto ou variação
      toast({
        title: "Estoque atualizado",
        description: `${change > 0 ? 'Adicionado' : 'Removido'} ${Math.abs(change)} unidades. Motivo: ${reason}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar estoque",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (stock: number, status: string) => {
    if (status === 'outofstock' || stock === 0) {
      return { label: 'Sem estoque', color: 'destructive' };
    } else if (stock <= 5) {
      return { label: 'Estoque baixo', color: 'secondary' };
    } else {
      return { label: 'Em estoque', color: 'default' };
    }
  };

  const getTotalStock = (product: any) => {
    if (product.type === 'variable' && product.variations) {
      return product.variations.reduce((total: number, variation: any) => 
        total + (variation.stock_quantity || 0), 0);
    }
    return product.stock_quantity || 0;
  };

  const mockStockHistory: StockHistoryEntry[] = [
    {
      date: '2024-01-15',
      type: 'adjustment',
      quantity: 10,
      reason: 'Ajuste de estoque inicial',
      user: 'Admin'
    },
    {
      date: '2024-01-14',
      type: 'maleta',
      quantity: -2,
      reason: 'Produto adicionado na maleta',
      maleta_id: '#001'
    },
    {
      date: '2024-01-13',
      type: 'sale',
      quantity: -1,
      reason: 'Venda no POS'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie o estoque dos seus produtos</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Produtos em Estoque</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products?.map((product: any) => {
              const totalStock = getTotalStock(product);
              const stockStatus = getStockStatus(totalStock, product.stock_status);
              const isExpanded = expandedProducts.has(product.id);
              const hasVariations = product.type === 'variable' && product.variations?.length > 0;

              return (
                <div key={product.id} className="border rounded-lg">
                  {/* Produto Principal */}
                  <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      {hasVariations && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(product.id)}
                          className="p-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{product.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>SKU: {product.sku || 'N/A'}</span>
                          <Badge variant={stockStatus.color as any}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {!hasVariations && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStock(product.id, null, -1, 'Ajuste manual')}
                              disabled={totalStock <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={totalStock}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                const change = newStock - totalStock;
                                if (change !== 0) {
                                  updateStock(product.id, null, change, 'Ajuste manual direto');
                                }
                              }}
                              className="w-20 text-center"
                            />
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStock(product.id, null, 1, 'Ajuste manual')}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}

                      {hasVariations && (
                        <div className="text-center">
                          <div className="font-medium text-lg">{totalStock}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Última alteração: há 2 dias
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <History className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Histórico de Estoque - {product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {mockStockHistory.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={entry.quantity > 0 ? 'default' : 'secondary'}>
                                      {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                    </Badge>
                                    <span className="font-medium">{entry.reason}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {entry.date} {entry.user && `• ${entry.user}`} {entry.maleta_id && `• Maleta ${entry.maleta_id}`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Variações */}
                  {hasVariations && isExpanded && (
                    <div className="border-t bg-muted/20">
                      {product.variations?.map((variation: any) => {
                        const variationStock = variation.stock_quantity || 0;
                        const variationStatus = getStockStatus(variationStock, variation.stock_status);
                        
                        return (
                          <div key={variation.id} className="p-4 pl-12 flex items-center justify-between border-b last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>SKU: {variation.sku || 'N/A'}</span>
                                <Badge variant={variationStatus.color as any} className="text-xs">
                                  {variationStatus.label}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStock(product.id, variation.id, -1, 'Ajuste manual')}
                                  disabled={variationStock <= 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                
                                <Input
                                  type="number"
                                  value={variationStock}
                                  onChange={(e) => {
                                    const newStock = parseInt(e.target.value) || 0;
                                    const change = newStock - variationStock;
                                    if (change !== 0) {
                                      updateStock(product.id, variation.id, change, 'Ajuste manual direto');
                                    }
                                  }}
                                  className="w-20 text-center"
                                />
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStock(product.id, variation.id, 1, 'Ajuste manual')}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="text-sm text-muted-foreground w-32 text-right">
                                Última alteração: há 2 dias
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;