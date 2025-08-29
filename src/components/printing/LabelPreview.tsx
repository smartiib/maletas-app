
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Printer } from 'lucide-react';

interface LabelPreviewProps {
  previewHtml: string;
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
  previewHtml,
  onClose,
  onPrint,
  onDownload
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview da Etiqueta</CardTitle>
          <div className="flex gap-2">
            {onDownload && (
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onPrint && (
              <Button onClick={onPrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[70vh] overflow-auto bg-gray-50 p-4">
            <div 
              className="bg-white border rounded shadow-sm p-4 max-w-fit mx-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
