
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, RotateCcw, AlertTriangle } from 'lucide-react';
import { Maleta, MaletaItem } from '@/services/maletas';
import { toast } from '@/hooks/use-toast';

interface MaletaReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maleta: Maleta | null;
  onProcessReturn: (returnData: any) => void;
  onOpenCheckout: (soldItems: Array<MaletaItem & { quantity_sold: number }>) => void;
}

interface ItemReturn {
  item_id: string;
  quantity_returned: number;
  quantity_sold: number;
  total_quantity: number;
}

const MaletaReturnDialog: React.FC<MaletaReturnDialogProps> = ({
  open,
  onOpenChange,
  maleta,
  onProcessReturn,
  onOpenCheckout
}) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [itemReturns, setItemReturns] = useState<ItemReturn[]>([]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (maleta && open && maleta.items) {
      setItemReturns(
        maleta.items.map(item => ({
          item_id: item.id,
          quantity_returned: item.quantity,
          quantity_sold: 0,
          total_quantity: item.quantity
        }))
      );
      setNotes('');
      setActiveTab('individual');
    }
  }, [maleta, open]);

  if (!maleta) return null;

  const updateItemReturn = (itemId: string, field: 'quantity_returned' | 'quantity_sold', value: number) => {
    setItemReturns(current =>
      current.map(item => {
        if (item.item_id === itemId) {
          const newItem = { ...item, [field]: value };
          
          // Ensure quantities don't exceed total
          if (field === 'quantity_returned') {
            newItem.quantity_sold = Math.max(0, newItem.total_quantity - value);
          } else {
            newItem.quantity_returned = Math.max(0, newItem.total_quantity - value);
          }
          
          return newItem;
        }
        return item;
      })
    );
  };

  const handleReturnAll = () => {
    setItemReturns(current =>
      current.map(item => ({
        ...item,
        quantity_returned: item.total_quantity,
        quantity_sold: 0
      }))
    );
    setActiveTab('individual');
  };

  const handleSellAll = () => {
    setItemReturns(current =>
      current.map(item => ({
        ...item,
        quantity_returned: 0,
        quantity_sold: item.total_quantity
      }))
    );
    setActiveTab('individual');
  };

  const getSoldItems = () => {
    if (!maleta.items) return [];
    
    return maleta.items
      .map(item => {
        const returnData = itemReturns.find(r => r.item_id === item.id);
        if (returnData && returnData.quantity_sold > 0) {
          return {
            ...item,
            quantity_sold: returnData.quantity_sold
          };
        }
        return null;
      })
      .filter(Boolean) as Array<MaletaItem & { quantity_sold: number }>;
  };

  const getReturnedItems = () => {
    return itemReturns.filter(item => item.quantity_returned > 0);
  };

  const getTotalSoldValue = () => {
    if (!maleta.items) return 0;
    
    return maleta.items.reduce((total, item) => {
      const returnData = itemReturns.find(r => r.item_id === item.id);
      if (returnData && returnData.quantity_sold > 0) {
        return total + (parseFloat(item.price) * returnData.quantity_sold);
      }
      return total;
    }, 0);
  };

  const handleProcessReturn = async () => {
    const soldItems = getSoldItems();
    const returnedItems = getReturnedItems();

    if (soldItems.length === 0 && returnedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Defina ao menos um item como vendido ou devolvido",
        variant: "destructive"
      });
      return;
    }

    // Validate quantities
    const hasInvalidQuantities = itemReturns.some(item => 
      item.quantity_returned + item.quantity_sold !== item.total_quantity
    );

    if (hasInvalidQuantities) {
      toast({
        title: "Erro",
        description: "A soma de itens devolvidos e vendidos deve ser igual ao total",
        variant: "destructive"
      });
      return;
    }

    if (soldItems.length > 0) {
      // Open checkout for sold items
      onOpenCheckout(soldItems);
    } else {
      // Process only returns
      setIsProcessing(true);
      try {
        const returnData = {
          items_sold: [],
          items_returned: returnedItems.map(item => ({
            item_id: item.item_id,
            quantity_returned: item.quantity_returned
          })),
          return_date: new Date().toISOString(),
          delay_days: Math.max(0, Math.ceil((new Date().getTime() - new Date(maleta.return_date).getTime()) / (1000 * 60 * 60 * 24))),
          commission_amount: 0,
          penalty_amount: 0,
          final_amount: 0,
          notes
        };

        await onProcessReturn(returnData);
        onOpenChange(false);
      } catch (error) {
        console.error('Error processing return:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const delayDays = Math.max(0, Math.ceil(
    (new Date().getTime() - new Date(maleta.return_date).getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Early return if maleta.items is not available
  if (!maleta.items || maleta.items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Processar Devolução - Maleta #{maleta.number}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Cliente: {maleta.customer_name || maleta.representative_name}
            </p>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum item encontrado</p>
            <p className="text-sm text-muted-foreground">Esta maleta não possui itens para processar.</p>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Processar Devolução - Maleta #{maleta.number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: {maleta.customer_name || maleta.representative_name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert for late return */}
          {delayDays > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  Devolução em atraso: {delayDays} dias
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Será aplicada penalidade de {maleta.commission_settings.penalty_rate}% por dia sobre a comissão.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="return-all">Devolver Tudo</TabsTrigger>
              <TabsTrigger value="sell-all">Vender Tudo</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione os produtos que estão sendo devolvidos. Um pedido será gerado automaticamente para os produtos não devolvidos.
              </p>
            </TabsContent>

            <TabsContent value="return-all" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Devolver Todos os Produtos</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Todos os produtos serão marcados como devolvidos e retornarão ao estoque.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleReturnAll}
                  className="mt-3"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Aplicar Devolução Total
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sell-all" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Vender Todos os Produtos</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Todos os produtos serão marcados como vendidos e um pedido será criado.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleSellAll}
                  className="mt-3"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Aplicar Venda Total
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Products Grid */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 p-3 grid grid-cols-12 gap-2 text-sm font-medium border-b">
              <div className="col-span-1">Imagem</div>
              <div className="col-span-3">Produto</div>
              <div className="col-span-1">SKU</div>
              <div className="col-span-1">Preço</div>
              <div className="col-span-1">Qtd.</div>
              <div className="col-span-2">Devolvido</div>
              <div className="col-span-2">Vendido</div>
              <div className="col-span-1">Ação</div>
            </div>
            
            <div className="divide-y max-h-64 overflow-y-auto">
              {maleta.items.map((item) => {
                const returnData = itemReturns.find(r => r.item_id === item.id) || {
                  item_id: item.id,
                  quantity_returned: item.quantity,
                  quantity_sold: 0,
                  total_quantity: item.quantity
                };

                return (
                  <div key={item.id} className="p-3 grid grid-cols-12 gap-2 text-sm">
                    <div className="col-span-1">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="font-medium">{item.name}</p>
                      {item.variation_attributes && item.variation_attributes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.variation_attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1 font-mono text-xs">{item.sku}</div>
                    <div className="col-span-1 font-medium">R$ {parseFloat(item.price).toFixed(2)}</div>
                    <div className="col-span-1 font-medium">{item.quantity}</div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnData.quantity_returned}
                        onChange={(e) => updateItemReturn(item.id, 'quantity_returned', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnData.quantity_sold}
                        onChange={(e) => updateItemReturn(item.id, 'quantity_sold', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-1">
                      <Badge 
                        variant="outline" 
                        className={
                          returnData.quantity_sold > 0 && returnData.quantity_returned > 0 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          returnData.quantity_sold > 0 ? 'bg-green-100 text-green-800 border-green-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }
                      >
                        {returnData.quantity_sold > 0 && returnData.quantity_returned > 0 ? 'Misto' :
                         returnData.quantity_sold > 0 ? 'Vendido' : 'Devolvido'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-600 dark:text-blue-300">Itens Devolvidos</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {getReturnedItems().reduce((sum, item) => sum + item.quantity_returned, 0)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
              <p className="text-sm text-green-600 dark:text-green-300">Itens Vendidos</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {getSoldItems().reduce((sum, item) => sum + item.quantity_sold, 0)}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg text-center">
              <p className="text-sm text-orange-600 dark:text-orange-300">Valor Total Vendido</p>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                R$ {getTotalSoldValue().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="return-notes">Observações da Devolução</Label>
            <Textarea
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a devolução..."
              className="h-20"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-primary"
            onClick={handleProcessReturn}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 
             getSoldItems().length > 0 ? 'Processar e Abrir Checkout' : 'Processar Devolução'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaletaReturnDialog;
