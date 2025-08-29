
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { labelGenerator, LabelGenerationOptions } from '@/services/printing/LabelGenerator';
import { usePrintService } from '@/hooks/usePrintService';
import { ProductSelector } from './ProductSelector';
import { LabelConfigPanel } from './LabelConfigPanel';
import { LabelPreview } from './LabelPreview';
import { 
  Printer, 
  Eye, 
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductSelection {
  id: number;
  name: string;
  sku: string;
  price: string;
  selected: boolean;
}

export const LabelDesigner: React.FC = () => {
  const { print, loading } = usePrintService();
  
  // Estados para produtos e seleção
  const [products, setProducts] = useState<ProductSelection[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Configurações da etiqueta
  const [labelOptions, setLabelOptions] = useState<LabelGenerationOptions>({
    products: [],
    labelType: 'standard',
    format: 'A4',
    layout: '2x2',
    includeBarcode: true,
    includeQRCode: false,
    quantity: 1
  });

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    // Simular carregamento de produtos - integrar com o sistema existente
    const mockProducts: ProductSelection[] = [
      { id: 1, name: 'Camiseta Básica', sku: 'CAM001', price: '29.90', selected: false },
      { id: 2, name: 'Calça Jeans Premium', sku: 'CAL002', price: '89.90', selected: false },
      { id: 3, name: 'Tênis Esportivo', sku: 'TEN003', price: '159.90', selected: false },
      { id: 4, name: 'Vestido Floral', sku: 'VES004', price: '79.90', selected: false },
      { id: 5, name: 'Jaqueta de Couro', sku: 'JAQ005', price: '299.90', selected: false }
    ];
    
    setProducts(mockProducts);
  };

  const handleOptionsChange = (newOptions: Partial<LabelGenerationOptions>) => {
    setLabelOptions(prev => ({ ...prev, ...newOptions }));
  };

  const handleProductSelection = (productId: number, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = () => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const allSelected = filteredProducts.every(p => selectedProducts.includes(p.id));
    
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const generatePreview = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id === selectedProducts[0]);
      if (!selectedProduct) return;

      const html = await labelGenerator.generatePreview(selectedProduct, labelOptions);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview da etiqueta');
    }
  };

  const generateLabels = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    
    const options: LabelGenerationOptions = {
      ...labelOptions,
      products: selectedProductsData
    };

    // Validar opções
    const validation = labelGenerator.validateLabelOptions(options);
    if (!validation.isValid) {
      toast.error(`Erro de validação: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const jobIds = await labelGenerator.generateBatch(options);
      toast.success(`${jobIds.length} etiquetas adicionadas à fila de impressão`);
      
      // Limpar seleção
      setSelectedProducts([]);
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      toast.error('Erro ao gerar etiquetas');
    }
  };

  const generateZPL = () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProducts[0]);
    if (!selectedProduct) return;

    try {
      const zplCommands = labelGenerator.generateZPL(selectedProduct, labelOptions);
      
      // Download do arquivo ZPL
      const blob = new Blob([zplCommands], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta-${selectedProduct.sku}.zpl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Arquivo ZPL baixado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar ZPL:', error);
      toast.error('Erro ao gerar comandos ZPL');
    }
  };

  const selectedCount = selectedProducts.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Designer de Etiquetas</h1>
          <p className="text-muted-foreground">
            Crie e imprima etiquetas personalizadas para seus produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={generatePreview} 
            variant="outline"
            disabled={selectedCount === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={generateZPL}
            variant="outline" 
            disabled={selectedCount === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            ZPL
          </Button>
          <Button 
            onClick={generateLabels} 
            disabled={selectedCount === 0 || loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Gerar Etiquetas ({selectedCount})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProductSelector
          products={products}
          selectedProducts={selectedProducts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onProductSelection={handleProductSelection}
          onSelectAll={handleSelectAll}
        />

        <LabelConfigPanel
          options={labelOptions}
          onOptionsChange={handleOptionsChange}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <LabelPreview
          previewHtml={previewHtml}
          onClose={() => setShowPreview(false)}
          onPrint={generateLabels}
        />
      )}
    </div>
  );
};
