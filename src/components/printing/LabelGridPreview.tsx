import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrintTemplate, LabelData } from '@/types/printing';
import { Edit, ZoomIn, ZoomOut, Grid3x3 } from 'lucide-react';

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

interface LabelGridPreviewProps {
  labelData: LabelData[];
  template: PrintTemplate | null;
  settings: PrintSettings;
  onEditTemplate?: () => void;
}

export const LabelGridPreview: React.FC<LabelGridPreviewProps> = ({
  labelData,
  template,
  settings,
  onEditTemplate
}) => {
  const [zoom, setZoom] = React.useState(100);

  // Calcular layout da grade
  const getGridLayout = () => {
    switch (settings.layout) {
      case '1x1': return { rows: 1, cols: 1 };
      case '2x1': return { rows: 1, cols: 2 };
      case '3x1': return { rows: 1, cols: 3 };
      case '2x2': return { rows: 2, cols: 2 };
      case '3x3': return { rows: 3, cols: 3 };
      default: return { rows: 2, cols: 2 };
    }
  };

  const { rows, cols } = getGridLayout();
  const labelsPerPage = rows * cols;
  const totalPages = Math.ceil(labelData.length / labelsPerPage);

  // Template HTML básico se não houver template selecionado
  const getDefaultTemplate = (data: LabelData) => `
    <div style="
      width: 100%;
      height: 100%;
      padding: 8px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      font-size: 12px;
    ">
      <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
      <div style="color: #666; margin-bottom: 4px;">SKU: ${data.sku}</div>
      <div style="font-size: 14px; font-weight: bold;">R$ ${data.price.toFixed(2)}</div>
      ${data.barcode ? `<div style="margin-top: auto; font-family: 'Courier New', monospace; font-size: 10px;">||||| ${data.barcode} |||||</div>` : ''}
    </div>
  `;

  // Renderizar etiqueta individual
  const renderLabel = (data: LabelData, index: number) => {
    const html = template?.html_template 
      ? template.html_template
          .replace(/\{\{name\}\}/g, data.name)
          .replace(/\{\{sku\}\}/g, data.sku)
          .replace(/\{\{price\}\}/g, `R$ ${data.price.toFixed(2)}`)
          .replace(/\{\{barcode\}\}/g, data.barcode || '')
      : getDefaultTemplate(data);

    return (
      <div
        key={index}
        className="border border-gray-300 bg-white"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          aspectRatio: settings.format === 'A4' ? '1/1.4' : '1/1'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  // Renderizar página
  const renderPage = (pageIndex: number) => {
    const startIndex = pageIndex * labelsPerPage;
    const pageLabels = labelData.slice(startIndex, startIndex + labelsPerPage);
    
    return (
      <div
        key={pageIndex}
        className="border-2 border-dashed border-gray-300 bg-white p-4 mx-auto"
        style={{
          width: settings.format === 'A4' ? '210mm' : '80mm',
          minHeight: settings.format === 'A4' ? '297mm' : '200mm',
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '2mm'
        }}
      >
        {Array.from({ length: labelsPerPage }).map((_, index) => {
          const labelData = pageLabels[index];
          return labelData ? (
            renderLabel(labelData, startIndex + index)
          ) : (
            <div
              key={index}
              className="border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400"
            >
              Vazio
            </div>
          );
        })}
      </div>
    );
  };

  if (!template && labelData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Grid3x3 className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Selecione um template</h3>
          <p>Escolha um template na aba "Templates" para visualizar as etiquetas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-4 p-4 border-b">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            Layout: {settings.layout} | Formato: {settings.format}
          </Badge>
          <Badge variant="outline">
            {labelData.length} etiquetas | {totalPages} página(s)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          {onEditTemplate && (
            <Button variant="outline" size="sm" onClick={onEditTemplate}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Grid de preview */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-8">
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div key={pageIndex} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground text-center">
                Página {pageIndex + 1} de {totalPages}
              </h3>
              {renderPage(pageIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
