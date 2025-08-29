
import React, { useState, useEffect } from 'react';
import { useWooCommerce } from '@/hooks/useWooCommerce';
import { ProductLabelCard } from './ProductLabelCard';
import { PrintQueueSidebar } from './PrintQueueSidebar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PrintQueueItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
}

export const LabelGrid: React.FC = () => {
  const { products, loading } = useWooCommerce();
  const [searchTerm, setSearchTerm] = useState('');
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);

  const addToQueue = (product: any) => {
    const existingItem = printQueue.find(item => item.id === product.id);
    
    if (existingItem) {
      setPrintQueue(prev => 
        prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setPrintQueue(prev => [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku || `PROD-${product.id}`,
        quantity: 1
      }]);
    }
  };

  const removeFromQueue = (productId: number) => {
    setPrintQueue(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromQueue(productId);
      return;
    }
    
    setPrintQueue(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearQueue = () => {
    setPrintQueue([]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map((product) => (
            <ProductLabelCard
              key={product.id}
              product={product}
              onAddToQueue={() => addToQueue(product)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <PrintQueueSidebar
        items={printQueue}
        onRemoveItem={removeFromQueue}
        onUpdateQuantity={updateQuantity}
        onClearQueue={clearQueue}
      />
    </div>
  );
};
