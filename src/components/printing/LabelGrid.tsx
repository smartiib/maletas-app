
import React, { useState, useEffect } from 'react';
import { ProductLabelCard } from './ProductLabelCard';
import { PrintQueueSidebar } from './PrintQueueSidebar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  image?: string;
}

interface PrintQueueItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
}

export const LabelGrid: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  
  // Mock products data for now
  const [products] = useState<Product[]>([
    { id: 1, name: 'Produto A', sku: 'PROD-001' },
    { id: 2, name: 'Produto B', sku: 'PROD-002' },
    { id: 3, name: 'Produto C', sku: 'PROD-003' },
    { id: 4, name: 'Produto D', sku: 'PROD-004' },
    { id: 5, name: 'Produto E', sku: 'PROD-005' },
    { id: 6, name: 'Produto F', sku: 'PROD-006' },
  ]);

  const addToQueue = (product: Product) => {
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
        sku: product.sku,
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
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
