
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateStockAdjustment } from '@/hooks/useStockAdjustments';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

interface AdjustmentFormData {
  adjustment_type: 'perda' | 'quebra' | 'troca' | 'devolucao' | 'correcao';
  quantity_adjusted: number;
  reason: string;
  notes?: string;
}

const StockAdjustmentDialog = ({ open, onOpenChange, product }: StockAdjustmentDialogProps) => {
  const createAdjustment = useCreateStockAdjustment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>();

  const adjustmentType = watch('adjustment_type');

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!product) return;

    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock + data.quantity_adjusted;

    try {
      await createAdjustment.mutateAsync({
        product_id: product.id,
        adjustment_type: data.adjustment_type,
        quantity_before: currentStock,
        quantity_after: newStock,
        quantity_adjusted: data.quantity_adjusted,
        reason: data.reason,
        notes: data.notes,
      });
      
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar ajuste:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {product && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                Estoque atual: {product.stock_quantity || 0}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adjustment_type">Tipo de Ajuste *</Label>
            <Select onValueChange={(value) => setValue('adjustment_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perda">Perda</SelectItem>
                <SelectItem value="quebra">Quebra</SelectItem>
                <SelectItem value="troca">Troca</SelectItem>
                <SelectItem value="devolucao">Devolução</SelectItem>
                <SelectItem value="correcao">Correção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_adjusted">Quantidade *</Label>
            <Input
              id="quantity_adjusted"
              type="number"
              {...register('quantity_adjusted', { 
                required: 'Quantidade é obrigatória',
                valueAsNumber: true
              })}
              placeholder="Use números negativos para reduzir estoque"
            />
            {errors.quantity_adjusted && (
              <p className="text-sm text-red-600">{errors.quantity_adjusted.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Input
              id="reason"
              {...register('reason', { required: 'Motivo é obrigatório' })}
              placeholder="Ex: Produto danificado, vencimento..."
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Ajuste'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
