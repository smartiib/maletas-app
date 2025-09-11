import React, { useEffect, useState } from 'react';
import { useLabelPrinting } from '@/hooks/useLabelPrinting';
import { useWooCommerceFilteredProducts } from '@/hooks/useWooCommerceFiltered';
import { useWooCommerceFilteredCategories } from '@/hooks/useWooCommerceFiltered';
import { ProductLabelCard } from './ProductLabelCard';
import { LabelPrintSidebar } from './LabelPrintSidebar';
import { ProductVariationSelector } from './ProductVariationSelector';
import { LabelPreviewDialog } from './LabelPreviewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

export const LabelDesigner: React.FC = () => {
  const { data: products = [], isLoading: productsLoading, error: productsError } = useWooCommerceFilteredProducts();
  const { data: categories = [] } = useWooCommerceFilteredCategories();
  
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
    getLastPrintDate,
    totalQuantity
  } = useLabelPrinting();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedProductForVariations, setSelectedProductForVariations] = useState<any>(null);

  // Log para debug
  useEffect(() => {
    console.log('[LabelDesigner] Estado atual:', {
      queueLength: printQueue.length,
      totalQuantity,
      isLoading,
      availableTemplates: availableTemplates?.length || 0,
      selectedTemplate: {
        _type: typeof selectedTemplate,
        value: selectedTemplate?.name || 'undefined'
      }
    });
  }, [printQueue.length, totalQuantity, isLoading, availableTemplates?.length, selectedTemplate?.name]);

  // Show error message if products failed to load
  useEffect(() => {
    if (productsError) {
      console.error('[LabelDesigner] Erro ao carregar produtos:', productsError);
      toast.error('Erro ao carregar produtos. Verifique a configuração do WooCommerce.');
    }
  }, [productsError]);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                           product.categories?.some((cat: any) => cat.id?.toString() === selectedCategory);
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
      toast.error('Erro ao gerar arquivo ZPL');
    }
  };

  const handleSelectVariations = (product: any) => {
    setSelectedProductForVariations(product);
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

          {/* Status da configuração */}
          {productsError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Problemas ao carregar produtos. Verifique as configurações do WooCommerce nas configurações do sistema.
              </AlertDescription>
            </Alert>
          )}

          {!productsLoading && products.length === 0 && !productsError && (
            <Alert className="mb-4">
              <Database className="h-4 w-4" />
              <AlertDescription>
                Nenhum produto sincronizado encontrado. Execute uma sincronização dos produtos primeiro.
              </AlertDescription>
            </Alert>
          )}

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
          {productsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductLabelCard
                  key={product.id}
                  product={product}
                  onAddToQueue={(product, quantity) => addToQueue(product, quantity)}
                  onSelectVariations={() => handleSelectVariations(product)}
                  isInQueue={isProductInQueue(product.id)}
                  wasRecentlyPrinted={wasRecentlyPrinted(product.id)}
                  lastPrintDate={getLastPrintDate(product.id)}
                />
              ))}
            </div>
          )}

          {!productsLoading && filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum produto encontrado com os filtros aplicados.
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

      {/* Product Variation Selector */}
      <ProductVariationSelector
        isOpen={!!selectedProductForVariations}
        onClose={() => setSelectedProductForVariations(null)}
        product={selectedProductForVariations}
        onAddToQueue={(variation, quantity) => {
          addToQueue(variation, quantity);
          setSelectedProductForVariations(null);
        }}
      />
    </div>
  );
};