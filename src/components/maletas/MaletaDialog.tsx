
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Package, User } from 'lucide-react';
import { useRepresentatives, useCreateMaleta } from '@/hooks/useMaletas';
import { toast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaletaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: Array<{
    product_id: number;
    variation_id?: number;
    name: string;
    price: string;
    quantity: number;
  }>;
  onClearCart: () => void;
}

const MaletaDialog: React.FC<MaletaDialogProps> = ({
  open,
  onOpenChange,
  cartItems,
  onClearCart
}) => {
  const [selectedRepresentative, setSelectedRepresentative] = useState<number>(0);
  const [returnDate, setReturnDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [customCommission, setCustomCommission] = useState(false);
  const [commissionPercentage, setCommissionPercentage] = useState(0);

  const { data: representatives = [] } = useRepresentatives(1, '');
  const createMaleta = useCreateMaleta();

  const getTotalValue = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const handleCreateMaleta = async () => {
    if (!selectedRepresentative) {
      toast({
        title: "Erro",
        description: "Selecione um representante",
        variant: "destructive"
      });
      return;
    }

    if (!returnDate) {
      toast({
        title: "Erro",
        description: "Defina a data de devolução",
        variant: "destructive"
      });
      return;
    }

    try {
      const maletaData = {
        representative_id: selectedRepresentative,
        customer_id: 0, // Não utilizado para maletas
        return_date: returnDate,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
          price: item.price
        })),
        commission_settings: customCommission ? {
          use_global: false,
          custom_percentage: commissionPercentage
        } : {
          use_global: true
        },
        notes
      };

      await createMaleta.mutateAsync(maletaData);
      
      // Limpar formulário e carrinho
      setSelectedRepresentative(0);
      setReturnDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      setNotes('');
      setCustomCommission(false);
      setCommissionPercentage(0);
      onClearCart();
      onOpenChange(false);

      toast({
        title: "Maleta Criada",
        description: "Maleta foi criada com sucesso e produtos foram reduzidos do estoque!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar maleta",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    // Resetar formulário ao fechar
    setSelectedRepresentative(0);
    setReturnDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    setNotes('');
    setCustomCommission(false);
    setCommissionPercentage(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Maleta de Consignação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo dos Produtos */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos da Maleta ({cartItems.length} itens)
            </h3>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-slate-500">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-bold">
                    R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total da Maleta:</span>
                <span className="text-primary">R$ {getTotalValue().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Seleção de Representante */}
          <div className="space-y-2">
            <Label htmlFor="representative">Representante *</Label>
            <Select value={selectedRepresentative.toString()} onValueChange={(value) => setSelectedRepresentative(parseInt(value))}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Selecionar representante" />
              </SelectTrigger>
              <SelectContent>
                {representatives.map(representative => (
                  <SelectItem key={representative.id} value={representative.id.toString()}>
                    {representative.name} - {representative.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {representatives.length === 0 && (
              <p className="text-sm text-amber-600">
                Nenhum representante cadastrado. Cadastre representantes primeiro.
              </p>
            )}
          </div>

          {/* Data de Devolução */}
          <div className="space-y-2">
            <Label htmlFor="return-date">Data de Devolução *</Label>
            <div className="relative">
              <Input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
            <p className="text-sm text-slate-500">
              Padrão: 30 dias ({format(addDays(new Date(), 30), 'dd/MM/yyyy', { locale: ptBR })})
            </p>
          </div>

          {/* Configurações de Comissão */}
          <div className="space-y-3">
            <Label>Configurações de Comissão</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="global-commission"
                  checked={!customCommission}
                  onChange={() => setCustomCommission(false)}
                />
                <Label htmlFor="global-commission">Usar comissão global (padrão)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-commission"
                  checked={customCommission}
                  onChange={() => setCustomCommission(true)}
                />
                <Label htmlFor="custom-commission">Comissão personalizada</Label>
              </div>
            </div>

            {customCommission && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="commission-percentage">Percentual de Comissão (%)</Label>
                <Input
                  id="commission-percentage"
                  type="number"
                  placeholder="Ex: 25"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a maleta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>

          {/* Informações sobre o Sistema */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Como funciona a Maleta de Consignação:
            </h4>
            <ul className="text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Os produtos serão reduzidos do estoque imediatamente</li>
              <li>• O representante terá até a data de devolução para retornar</li>
              <li>• Na devolução, você definirá quais produtos foram vendidos</li>
              <li>• Produtos não vendidos retornarão ao estoque</li>
              <li>• Comissão será calculada apenas sobre produtos vendidos</li>
            </ul>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-primary"
            onClick={handleCreateMaleta}
            disabled={createMaleta.isPending || !selectedRepresentative || !returnDate}
          >
            {createMaleta.isPending ? 'Criando...' : 'Criar Maleta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaletaDialog;
