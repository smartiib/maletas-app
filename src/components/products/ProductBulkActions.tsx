
import React from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type BulkAction = 
  | 'mark-all-review'
  | 'mark-all-no-change'
  | 'remove-all-review'
  | 'remove-all-no-change'
  | 'remove-all-marks';

interface ProductBulkActionsProps {
  onBulkAction: (action: BulkAction) => void;
  disabled?: boolean;
}

const ProductBulkActions: React.FC<ProductBulkActionsProps> = ({ 
  onBulkAction, 
  disabled = false 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Edit className="mr-2 h-4 w-4" />
          Editar em Massa
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
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
  );
};

export default ProductBulkActions;
