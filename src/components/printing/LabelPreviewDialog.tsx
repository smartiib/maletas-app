
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LabelGridPreview } from './LabelGridPreview';
import { LabelTemplateSelector } from './LabelTemplateSelector';
import { LabelTemplateEditor } from './LabelTemplateEditor';
import { PrintTemplate, LabelData } from '@/types/printing';
import { Printer, Download, Save, Eye } from 'lucide-react';

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
  format: 'A4' | '80mm' | '58mm' | '50x30mm' | '40x20mm';
  layout: '1x1' | '2x1' | '3x1' | '2x2' | '3x3';
  includeBarcode: boolean;
  includeQRCode: boolean;
}

interface LabelPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  printQueue: PrintItem[];
  settings: PrintSettings;
  onPrintLabels: () => void;
  onGenerateZPL: () => void;
}

export const LabelPreviewDialog: React.FC<LabelPreviewDialogProps> = ({
  isOpen,
  onClose,
  printQueue,
  settings,
  onPrintLabels,
  onGenerateZPL
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [previewData, setPreviewData] = useState<LabelData[]>([]);
  const [activeTab, setActiveTab] = useState('preview');

  // Converter items da fila para dados de etiqueta
  useEffect(() => {
    const labelData = printQueue.map((item) => ({
      product_id: item.id,
      name: item.name,
      sku: item.sku,
      price: parseFloat(item.price) || 0,
      barcode: item.sku,
      qr_code: settings.includeQRCode ? JSON.stringify({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price
      }) : undefined
    }));
    setPreviewData(labelData);
  }, [printQueue, settings]);

  const handleTemplateSelect = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('preview');
  };

  const handleEditTemplate = () => {
    setIsEditingTemplate(true);
    setActiveTab('editor');
  };

  const handleSaveTemplate = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(false);
    setActiveTab('preview');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview de Etiquetas
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1">
            <LabelTemplateSelector
              labelType={settings.labelType}
              onSelectTemplate={handleTemplateSelect}
              selectedTemplate={selectedTemplate}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1">
            <LabelGridPreview
              labelData={previewData}
              template={selectedTemplate}
              settings={settings}
              onEditTemplate={handleEditTemplate}
            />
          </TabsContent>

          <TabsContent value="editor" className="flex-1">
            <LabelTemplateEditor
              template={selectedTemplate}
              labelType={settings.labelType}
              onSave={handleSaveTemplate}
              onCancel={() => setActiveTab('preview')}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab('editor')}>
              <Save className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onGenerateZPL}>
              <Download className="h-4 w-4 mr-2" />
              Gerar ZPL
            </Button>
            <Button onClick={onPrintLabels} disabled={!selectedTemplate}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
