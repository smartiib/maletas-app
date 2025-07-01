
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, User, Package, Calculator } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCustomers, useProducts } from '@/hooks/useWooCommerce';
import { useRepresentatives, useCreateMaleta, useCommissionCalculator } from '@/hooks/useMaletas';
import { CreateMaletaData } from '@/services/maletas';

interface CartItem {
  product_id: number;
  variation_id?: number;
  name: string;
  price: string;
  quantity: number;
}

interface MaletaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onClearCart: () => void;
}

const MaletaDialog: React.FC<MaletaDialogProps> = ({ 
  open, 
  onOpenChange, 
  cartItems,
  onClearCart 
}) => {
  const [selectedRepresentative, setSelectedRepresentative] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 30));
  const [useGlobalCommission, setUseGlobalCommission] = useState(true);
  const [customCommission, setCustomCommission] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [defaultDeadlineDays, setDefaultDeadlineDays] = useState(30);

  const { data: representatives = [] } = useRepresentatives();
  const { data: customers = [] } = useCustomers();
  const createMaleta = useCreateMaleta();
  const { calculateCommission } = useCommissionCalculator();

  const getTotalValue = () => {
    return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getCommissionPreview = () => {
    const total = getTotalValue();
    if (total === 0) return null;
    
    return calculateCommission(total, undefined, 0);
  };

  const handleCreateMaleta = async () => {
    if (!selectedRepresentative || !selectedCustomer || cartItems.length === 0) {
      return;
    }

    const maletaData: CreateMaletaData = {
      representative_id: selectedRepresentative,
      customer_id: selectedCustomer,
      return_date: format(returnDate, 'yyyy-MM-dd'),
      items: cartItems.map(item => ({
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
        price: item.price,
      })),
      commission_settings: {
        use_global: useGlobalCommission,
        custom_percentage: useGlobalCommission ? undefined : customCommission,
      },
      notes,
    };

    try {
      await createMaleta.mutateAsync(maletaData);
      onClearCart();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar maleta:', error);
    }
  };

  const resetForm = () => {
    setSelectedRepresentative(0);
    setSelectedCustomer(0);
    setReturnDate(addDays(new Date(), defaultDeadlineDays));
    setUseGlobalCommission(true);
    setCustomCommission(0);
    setNotes('');
  };

  const commissionPreview = getCommissionPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Nova Maleta de Consignação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Carrinho */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Produtos Selecionados</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2 font-bold">
              Total: R$ {getTotalValue().toFixed(2)}
            </div>
          </div>

          {/* Seleção de Representante */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Representante *
            </Label>
            <Select value={selectedRepresentative.toString()} onValueChange={(value) => setSelectedRepresentative(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o representante" />
              </SelectTrigger>
              <SelectContent>
                {representatives.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id.toString()}>
                    {rep.name} - {rep.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={selectedCustomer.toString()} onValueChange={(value) => setSelectedCustomer(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.first_name} {customer.last_name} - {customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuração de Prazo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo Padrão (dias)</Label>
              <Select value={defaultDeadlineDays.toString()} onValueChange={(value) => {
                const days = parseInt(value);
                setDefaultDeadlineDays(days);
                setReturnDate(addDays(new Date(), days));
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Devolução *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(returnDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Configuração de Comissão */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Configuração de Comissão
              </Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="global-commission" className="text-sm">
                  Usar configuração global
                </Label>
                <Switch
                  id="global-commission"
                  checked={useGlobalCommission}
                  onCheckedChange={setUseGlobalCommission}
                />
              </div>
            </div>

            {!useGlobalCommission && (
              <div className="space-y-2">
                <Label>Percentual Personalizado (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customCommission}
                  onChange={(e) => setCustomCommission(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 25.5"
                />
              </div>
            )}

            {/* Preview da Comissão */}
            {commissionPreview && (
              <div className="bg-primary/10 p-3 rounded">
                <h4 className="font-semibold text-sm mb-2">Preview da Comissão</h4>
                <div className="text-xs space-y-1">
                  <div>Faixa: {commissionPreview.commission_tier.label}</div>
                  <div>Percentual: {commissionPreview.commission_tier.percentage}%</div>
                  <div>Bônus: R$ {commissionPreview.commission_tier.bonus.toFixed(2)}</div>
                  <div className="font-semibold">
                    Comissão Total: R$ {commissionPreview.commission_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a maleta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              onClick={handleCreateMaleta}
              disabled={!selectedRepresentative || !selectedCustomer || cartItems.length === 0 || createMaleta.isPending}
            >
              {createMaleta.isPending ? 'Criando...' : 'Criar Maleta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaletaDialog;
