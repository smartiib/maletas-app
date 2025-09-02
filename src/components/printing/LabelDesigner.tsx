
import React, { useEffect } from 'react';
import { useLabelPrinting } from '@/hooks/useLabelPrinting';
import { useWooCommerceFilteredProducts, useWooCommerceCategories } from '@/hooks/useWooCommerce';
import { ProductLabelCard } from './ProductLabelCard';
import { LabelPrintSidebar } from './LabelPrintSidebar';
import { LabelPreviewDialog } from './LabelPreviewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

export const LabelDesigner: React.FC = () => {
  const { data: products = [] } = useWooCommerceFilteredProducts();
  const { data: categories = [] } = useWooCommerceCategories();
  const {
    printQueue,
    settings,
    selectedTemplate,
    availableTemplates,
    isLoading,
    addToQueue,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    setSettings,
    setSelectedTemplate,
    printLabels,
    saveSettings,
    generatePreview,
    generateZPL,
    isProductInQueue,
    wasRecentlyPrinted,
    totalQuantity
  } = useLabelPrinting();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreview, setShowPreview] = useState(false);

  // Log para debug
  useEffect(() => {
    console.log('[LabelDesigner] Estado atual:', {
      queueLength: printQueue.length,
      totalQuantity,
      isLoading,
      availableTemplates: availableTemplates?.length || 0,
      selectedTemplate: selectedTemplate?.name
    });
  }, [printQueue.length, totalQuantity, isLoading, availableTemplates?.length, selectedTemplate?.name]);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                           product.categories?.some((cat: any) => cat.id.toString() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handlePreview = () => {
    console.log('[LabelDesigner] Abrindo preview...');
    setShowPreview(true);
  };

  const handleGenerateZPL = () => {
    try {
      const zplContent = generateZPL();
      console.log('[LabelDesigner] ZPL gerado:', zplContent);
      
      // Download do arquivo ZPL
      const blob = new Blob([zplContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquetas-${Date.now()}.zpl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[LabelDesigner] Erro ao gerar ZPL:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Impressão de Etiquetas</h1>
              <p className="text-muted-foreground">
                Selecione produtos para adicionar à fila de impressão
              </p>
            </div>
            {printQueue.length > 0 && (
              <Badge variant="default" className="text-sm">
                {totalQuantity} etiquetas na fila
              </Badge>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="z-[80] bg-background">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories
                  .filter((category: any) => category && category.id !== undefined && category.id !== null && category.id !== '')
                  .map((category: any) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name || `Categoria ${category.id}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductLabelCard
                key={product.id}
                product={product}
                onAddToQueue={(product, quantity) => addToQueue(product, quantity)}
                isInQueue={isProductInQueue(product.id)}
                wasRecentlyPrinted={wasRecentlyPrinted(product.id)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory ? 
                  'Nenhum produto encontrado com os filtros aplicados.' :
                  'Nenhum produto disponível.'
                }
              </p>
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
        onSaveSettings={saveSettings}
        onCustomize={() => setShowPreview(true)}
        isLoading={isLoading}
      />

      {/* Preview Dialog */}
      <LabelPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        printQueue={printQueue}
        settings={settings}
        onPrintLabels={printLabels}
        onGenerateZPL={handleGenerateZPL}
      />
    </div>
  );
};
