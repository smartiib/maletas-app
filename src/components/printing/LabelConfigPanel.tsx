
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Layout, Palette, BarChart3, QrCode } from 'lucide-react';
import { LabelGenerationOptions } from '@/services/printing/LabelGenerator';

interface LabelConfigPanelProps {
  options: LabelGenerationOptions;
  onOptionsChange: (options: Partial<LabelGenerationOptions>) => void;
}

export const LabelConfigPanel: React.FC<LabelConfigPanelProps> = ({
  options,
  onOptionsChange
}) => {
  const getLayoutInfo = (layout: string) => {
    switch (layout) {
      case '1x1': return { rows: 1, cols: 1, total: 1 };
      case '2x1': return { rows: 1, cols: 2, total: 2 };
      case '3x1': return { rows: 1, cols: 3, total: 3 };
      case '2x2': return { rows: 2, cols: 2, total: 4 };
      case '3x3': return { rows: 3, cols: 3, total: 9 };
      default: return { rows: 1, cols: 1, total: 1 };
    }
  };

  const layoutInfo = getLayoutInfo(options.layout);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="format" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">
              <Palette className="h-4 w-4 mr-1" />
              Formato
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="h-4 w-4 mr-1" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Etiqueta</Label>
              <Select
                value={options.labelType}
                onValueChange={(value: any) => 
                  onOptionsChange({ labelType: value })
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
                value={options.format}
                onValueChange={(value: any) => 
                  onOptionsChange({ format: value })
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
                value={options.quantity}
                onChange={(e) => 
                  onOptionsChange({ 
                    quantity: parseInt(e.target.value) || 1 
                  })
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
                value={options.layout}
                onValueChange={(value: any) => 
                  onOptionsChange({ layout: value })
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
                  checked={options.includeBarcode}
                  onCheckedChange={(checked) => 
                    onOptionsChange({ includeBarcode: !!checked })
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
                  checked={options.includeQRCode}
                  onCheckedChange={(checked) => 
                    onOptionsChange({ includeQRCode: !!checked })
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
  );
};
