
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Printer, Trash2, X, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PrintQueueItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
}

interface PrintQueueSidebarProps {
  items: PrintQueueItem[];
  onRemoveItem: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onClearQueue: () => void;
}

export const PrintQueueSidebar: React.FC<PrintQueueSidebarProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onClearQueue
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handlePrint = async () => {
    if (items.length === 0) {
      toast.error('Fila de impressão vazia');
      return;
    }

    try {
      // Simular envio para fila de impressão
      toast.success(`${totalItems} etiquetas adicionadas à fila de impressão`);
      onClearQueue();
    } catch (error) {
      toast.error('Erro ao processar fila de impressão');
    }
  };

  return (
    <Card className="w-80 h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Fila de Impressão
          </span>
          {items.length > 0 && (
            <Button
              onClick={onClearQueue}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhum item na fila</p>
            <p className="text-xs">Clique em "Adicionar" nos produtos</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-96 mb-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        onClick={() => onRemoveItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="mb-4" />
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total de itens:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              
              <Button 
                onClick={handlePrint}
                className="w-full"
                disabled={items.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Fila ({totalItems})
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
