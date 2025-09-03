
import React from 'react';
import { Edit, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export type BulkAction = 
  | 'mark-all-review'
  | 'mark-all-no-change'
  | 'remove-all-review'
  | 'remove-all-no-change'
  | 'remove-all-marks'
  | 'delete-selected'
  | 'select-all'
  | 'deselect-all';

interface ProductBulkActionsProps {
  onBulkAction: (action: BulkAction) => void;
  disabled?: boolean;
  selectedProducts: Set<number>;
  onClearSelection: () => void;
}

const ProductBulkActions: React.FC<ProductBulkActionsProps> = ({ 
  onBulkAction, 
  disabled = false,
  selectedProducts,
  onClearSelection
}) => {
  const hasSelection = selectedProducts.size > 0;
  return (
    <div className="flex gap-2 items-center">
      {hasSelection && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedProducts.size} selecionado{selectedProducts.size !== 1 ? 's' : ''}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onBulkAction('delete-selected')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <Edit className="mr-2 h-4 w-4" />
            Editar em Massa
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem onClick={() => onBulkAction('select-all')}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Selecionar Todos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('deselect-all')}>
            <Square className="mr-2 h-4 w-4" />
            Desmarcar Todos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onBulkAction('mark-all-review')}>
            Marcar Todos em Revisão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('mark-all-no-change')}>
            Marcar Todos como Não Alterar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('remove-all-review')}>
            Remover Todos em Revisão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('remove-all-no-change')}>
            Remover Todos Não Alterar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('remove-all-marks')}>
            Remover Todas as Marcações
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProductBulkActions;
