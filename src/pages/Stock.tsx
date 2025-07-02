import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useWooCommerce';
import { Search, Package } from 'lucide-react';
import { StockRow } from '@/components/stock/StockRow';

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
      return product.variations.reduce((total: number, variation: any) => {
        const stock = variation.stock_quantity || 0;
        return total + Math.max(0, stock); // Não permitir valores negativos na soma
      }, 0);
    }
    return Math.max(0, product.stock_quantity || 0); // Não permitir valores negativos
  };

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
            {products?.map((product: any) => (
              <StockRow
                key={product.id}
                product={product}
                isExpanded={expandedProducts.has(product.id)}
                onToggleExpand={() => toggleExpanded(product.id)}
                getTotalStock={getTotalStock}
                getStockStatus={getStockStatus}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;