
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Printer, 
  Trash2, 
  X, 
  Eye, 
  Download,
  Settings2,
  ShoppingCart,
  Save
} from 'lucide-react';

interface PrintItem {
  id: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  image?: string;
}

interface PrintSettings {
  labelType: 'standard' | 'promotional' | 'zebra' | 'maleta';
  format: 'A4' | '80mm' | '58mm' | '50x30mm' | '40x20mm' | 'custom';
  layout: '1x1' | '2x1' | '3x1' | '2x2' | '3x3' | 'custom';
  includeBarcode: boolean;
  includeQRCode: boolean;
  customSize?: {
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'in';
  };
  customLayout?: {
    rows: number;
    cols: number;
  };
}

interface LabelPrintSidebarProps {
  printQueue: PrintItem[];
  settings: PrintSettings;
  totalQuantity: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveFromQueue: (productId: number) => void;
  onClearQueue: () => void;
  onUpdateSettings: (settings: PrintSettings) => void;
  onPrintLabels: () => void;
  onPreview?: () => void;
  onGenerateZPL?: () => void;
  onSaveSettings?: () => void;
  loading?: boolean;
}

export const LabelPrintSidebar: React.FC<LabelPrintSidebarProps> = ({
  printQueue,
  settings,
  totalQuantity,
  onUpdateQuantity,
  onRemoveFromQueue,
  onClearQueue,
  onUpdateSettings,
  onPrintLabels,
  onPreview,
  onGenerateZPL,
  onSaveSettings,
  loading = false
}) => {
  const handleCustomSizeChange = (field: 'width' | 'height' | 'unit', value: any) => {
    onUpdateSettings({
      ...settings,
      customSize: {
        ...settings.customSize,
        width: settings.customSize?.width || 50,
        height: settings.customSize?.height || 30,
        unit: settings.customSize?.unit || 'mm',
        [field]: value
      }
    });
  };

  const handleCustomLayoutChange = (field: 'rows' | 'cols', value: number) => {
    onUpdateSettings({
      ...settings,
      customLayout: {
        ...settings.customLayout,
        rows: settings.customLayout?.rows || 2,
        cols: settings.customLayout?.cols || 2,
        [field]: value
      }
    });
  };

  return (
    <div className="w-80 border-l bg-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold">Fila de Impressão</h2>
          </div>
          {printQueue.length > 0 && (
            <Badge variant="default">
              {totalQuantity} etiquetas
            </Badge>
          )}
        </div>
      </div>

      {/* Settings - Always visible and fixed at top */}
      <div className="border-b bg-muted/10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="font-medium text-sm">Configurações</span>
            </div>
            {onSaveSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveSettings}
                className="h-8 px-2"
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de Etiqueta</Label>
              <Select
                value={settings.labelType}
                onValueChange={(value: any) => 
                  onUpdateSettings({ ...settings, labelType: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
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

            <div>
              <Label className="text-xs">Formato</Label>
              <Select
                value={settings.format}
                onValueChange={(value: any) => 
                  onUpdateSettings({ ...settings, format: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="50x30mm">50x30mm</SelectItem>
                  <SelectItem value="40x20mm">40x20mm</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Size Options */}
            {settings.format === 'custom' && (
              <div className="space-y-2 p-2 bg-muted/20 rounded">
                <Label className="text-xs font-medium">Tamanho Personalizado</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Largura</Label>
                    <Input
                      type="number"
                      value={settings.customSize?.width || 50}
                      onChange={(e) => handleCustomSizeChange('width', parseInt(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Altura</Label>
                    <Input
                      type="number"
                      value={settings.customSize?.height || 30}
                      onChange={(e) => handleCustomSizeChange('height', parseInt(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unidade</Label>
                    <Select
                      value={settings.customSize?.unit || 'mm'}
                      onValueChange={(value) => handleCustomSizeChange('unit', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Layout</Label>
              <Select
                value={settings.layout}
                onValueChange={(value: any) => 
                  onUpdateSettings({ ...settings, layout: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x1">1x1 (1 por página)</SelectItem>
                  <SelectItem value="2x1">2x1 (2 por página)</SelectItem>
                  <SelectItem value="3x1">3x1 (3 por página)</SelectItem>
                  <SelectItem value="2x2">2x2 (4 por página)</SelectItem>
                  <SelectItem value="3x3">3x3 (9 por página)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Layout Options */}
            {settings.layout === 'custom' && (
              <div className="space-y-2 p-2 bg-muted/20 rounded">
                <Label className="text-xs font-medium">Layout Personalizado</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Linhas</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.customLayout?.rows || 2}
                      onChange={(e) => handleCustomLayoutChange('rows', parseInt(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Colunas</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.customLayout?.cols || 2}
                      onChange={(e) => handleCustomLayoutChange('cols', parseInt(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Código de Barras</Label>
                <Switch
                  checked={settings.includeBarcode}
                  onCheckedChange={(checked) => 
                    onUpdateSettings({ ...settings, includeBarcode: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">QR Code</Label>
                <Switch
                  checked={settings.includeQRCode}
                  onCheckedChange={(checked) => 
                    onUpdateSettings({ ...settings, includeQRCode: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only when there are items */}
      {printQueue.length > 0 && (
        <div className="p-4 border-b bg-muted/20 space-y-3">
          <Button
            onClick={onPrintLabels}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir {totalQuantity} Etiquetas
          </Button>

          <div className="flex gap-2">
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            )}
            {onGenerateZPL && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateZPL}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                ZPL
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearQueue}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Fila
          </Button>
        </div>
      )}

      {/* Queue Items */}
      <ScrollArea className="flex-1 p-4">
        {printQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mb-2" />
            <p className="text-sm text-center">
              Clique nos produtos para adicionar à fila de impressão
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {printQueue.map((item) => (
              <Card key={item.id} className="relative">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={item.quantity}
                          onChange={(e) => 
                            onUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-12 h-6 text-xs p-1"
                        />
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground ml-14">
                        {item.sku}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() => onRemoveFromQueue(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
