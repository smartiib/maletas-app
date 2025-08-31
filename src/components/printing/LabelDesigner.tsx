
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWooCommerceFilteredProducts, useWooCommerceFilteredCategories } from '@/hooks/useWooCommerceFiltered';
import { useLabelPrinting } from '@/hooks/useLabelPrinting';
import { ProductLabelCard } from './ProductLabelCard';
import { LabelPrintSidebar } from './LabelPrintSidebar';
import { LabelPreviewDialog } from './LabelPreviewDialog';
import { Search, Filter, Package, Tag } from 'lucide-react';
import { toast } from 'sonner';

export const LabelDesigner: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  
  // Usar os hooks específicos do useWooCommerceFiltered
  const { data: products = [], isLoading: productsLoading } = useWooCommerceFilteredProducts();
  const { data: categories = [] } = useWooCommerceFilteredCategories();

  // Hook para gerenciar impressão de etiquetas
  const {
    printQueue,
    settings,
    totalQuantity,
    addToQueue,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    setSettings,
    printLabels,
    generateZPL,
    isProductInQueue,
    wasRecentlyPrinted,
    getLastPrintDate
  } = useLabelPrinting();

  // Filtrar produtos com base na busca e categoria
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.categories?.some(cat => cat.id.toString() === categoryFilter)
      );
    }

    return filtered;
  }, [products, searchTerm, categoryFilter]);

  // Filtrar produtos que não estão na fila
  const availableProducts = useMemo(() => {
    return filteredProducts.filter(product => !isProductInQueue(product.id));
  }, [filteredProducts, isProductInQueue]);

  const handlePreview = () => {
    if (printQueue.length === 0) {
      toast.error('Adicione produtos à fila de impressão');
      return;
    }
    setShowPreview(true);
  };

  const handleGenerateZPL = () => {
    if (printQueue.length === 0) {
      toast.error('Adicione produtos à fila de impressão');
      return;
    }
    
    try {
      const zplCommands = generateZPL();
      
      // Criar e baixar arquivo ZPL
      const blob = new Blob([zplCommands], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquetas-${Date.now()}.zpl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Arquivo ZPL gerado e baixado!');
    } catch (error) {
      console.error('Erro ao gerar ZPL:', error);
      toast.error('Erro ao gerar comandos ZPL');
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Etiquetas</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {availableProducts.length} produtos disponíveis
                </Badge>
                {totalQuantity > 0 && (
                  <Badge variant="default" className="px-3 py-1">
                    {totalQuantity} na fila
                  </Badge>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-center">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Todos os produtos estão na fila de impressão'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {availableProducts.map((product) => (
                  <ProductLabelCard
                    key={product.id}
                    product={product}
                    isInQueue={isProductInQueue(product.id)}
                    wasRecentlyPrinted={wasRecentlyPrinted(product.id)}
                    lastPrintDate={getLastPrintDate(product.id)}
                    onAddToQueue={() => addToQueue(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <LabelPrintSidebar
          printQueue={printQueue}
          settings={settings}
          totalQuantity={totalQuantity}
          onUpdateQuantity={updateQuantity}
          onRemoveFromQueue={removeFromQueue}
          onClearQueue={clearQueue}
          onUpdateSettings={setSettings}
          onPrintLabels={printLabels}
          onPreview={handlePreview}
          onGenerateZPL={handleGenerateZPL}
        />
      </div>

      {/* Preview Dialog */}
      <LabelPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        printQueue={printQueue}
        settings={settings}
        onPrintLabels={printLabels}
        onGenerateZPL={handleGenerateZPL}
      />
    </>
  );
};
