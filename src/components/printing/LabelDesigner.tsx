import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { labelGenerator, LabelGenerationOptions } from '@/services/printing/LabelGenerator';
import { usePrintService } from '@/hooks/usePrintService';
import { 
  Printer, 
  Tag, 
  Eye, 
  Download, 
  Settings, 
  Package, 
  QrCode,
  BarChart3,
  Palette,
  Layout
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
  const location = useLocation();
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
    
    // Verificar se há produto pré-selecionado via navigation state
    if (location.state?.selectedProduct && location.state?.autoSelect) {
      const product = location.state.selectedProduct;
      setSelectedProducts([product.id]);
      toast.success(`Produto "${product.name}" pré-selecionado`);
    }
  }, [location.state]);

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

  const handleProductSelection = (productId: number, selected: boolean) => {
    setSelectedProducts(prev => 
      selected 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = () => {
    const filteredProducts = getFilteredProducts();
    const allSelected = filteredProducts.every(p => selectedProducts.includes(p.id));
    
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getFilteredProducts = () => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const layoutInfo = labelGenerator.getLabelsPerPage(labelOptions.layout);
  const filteredProducts = getFilteredProducts();
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
        {/* Seleção de Produtos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Seleção de Produtos
            </CardTitle>
            <CardDescription>
              Selecione os produtos para gerar etiquetas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar produtos por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  {filteredProducts.every(p => selectedProducts.includes(p.id)) ? 'Desmarcar' : 'Selecionar'} Todos
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleProductSelection(product.id, !selectedProducts.includes(product.id))}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={(checked) => handleProductSelection(product.id, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{product.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {product.sku}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          R$ {product.price}
                        </p>
                      </div>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} produto(s) selecionado(s)
                  </span>
                  <Badge variant="default">
                    Total: {selectedCount * labelOptions.quantity} etiquetas
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Etiqueta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure o formato e layout das etiquetas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="format" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="format">Formato</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Etiqueta</Label>
                  <Select
                    value={labelOptions.labelType}
                    onValueChange={(value: any) => 
                      setLabelOptions(prev => ({ ...prev, labelType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="promotional">Promocional</SelectItem>
                      <SelectItem value="zebra">Zebra</SelectItem>
                      <SelectItem value="maleta">Maleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato do Papel</Label>
                  <Select
                    value={labelOptions.format}
                    onValueChange={(value: any) => 
                      setLabelOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="thermal_80mm">Térmica 80mm</SelectItem>
                      <SelectItem value="thermal_58mm">Térmica 58mm</SelectItem>
                      <SelectItem value="label_50x30">50x30mm</SelectItem>
                      <SelectItem value="label_40x20">40x20mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade por Produto</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={labelOptions.quantity}
                    onChange={(e) => 
                      setLabelOptions(prev => ({ 
                        ...prev, 
                        quantity: parseInt(e.target.value) || 1 
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Layout da Página
                  </Label>
                  <Select
                    value={labelOptions.layout}
                    onValueChange={(value: any) => 
                      setLabelOptions(prev => ({ ...prev, layout: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x1">1 x 1 (1 etiqueta)</SelectItem>
                      <SelectItem value="2x1">2 x 1 (2 etiquetas)</SelectItem>
                      <SelectItem value="3x1">3 x 1 (3 etiquetas)</SelectItem>
                      <SelectItem value="2x2">2 x 2 (4 etiquetas)</SelectItem>
                      <SelectItem value="3x3">3 x 3 (9 etiquetas)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {layoutInfo.total} etiquetas por página ({layoutInfo.rows}x{layoutInfo.cols})
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="barcode"
                      checked={labelOptions.includeBarcode}
                      onCheckedChange={(checked) => 
                        setLabelOptions(prev => ({ 
                          ...prev, 
                          includeBarcode: !!checked 
                        }))
                      }
                    />
                    <Label htmlFor="barcode" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Incluir Código de Barras
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="qrcode"
                      checked={labelOptions.includeQRCode}
                      onCheckedChange={(checked) => 
                        setLabelOptions(prev => ({ 
                          ...prev, 
                          includeQRCode: !!checked 
                        }))
                      }
                    />
                    <Label htmlFor="qrcode" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Incluir QR Code
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Preview da Etiqueta</CardTitle>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                size="sm"
                className="absolute top-4 right-4"
              >
                Fechar
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <div 
                  className="border rounded p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
