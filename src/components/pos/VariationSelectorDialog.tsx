
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VariationSelectorDialogProps {
  open: boolean;
  product: any;
  onClose: () => void;
  onSelect: (variationId: number, variationName: string) => void;
}

const VariationSelectorDialog: React.FC<VariationSelectorDialogProps> = ({
  open,
  product,
  onClose,
  onSelect,
}) => {
  const variations = Array.isArray(product?.variations) ? product.variations : [];

  const getVariationName = (variation: any) => {
    const name = variation?.attributes?.map((attr: any) => attr?.option).filter(Boolean).join(", ");
    return name || `Variação ${variation?.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione uma variação</DialogTitle>
          <DialogDescription>
            {product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {variations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma variação encontrada.</p>
          ) : (
            variations.map((variation: any) => (
              <Button
                key={variation.id}
                className="w-full justify-start"
                variant="outline"
                onClick={() => onSelect(variation.id, getVariationName(variation))}
              >
                {getVariationName(variation)}
              </Button>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariationSelectorDialog;
