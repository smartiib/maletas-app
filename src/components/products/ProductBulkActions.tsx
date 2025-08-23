
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertTriangle, Eye, X, CheckSquare, Eraser } from 'lucide-react';

interface ProductBulkActionsProps {
  onBulkAction: (action: string) => void;
  selectedCount?: number;
}

const ProductBulkActions: React.FC<ProductBulkActionsProps> = ({ 
  onBulkAction, 
  selectedCount = 0 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckSquare className="w-4 h-4 mr-2" />
          Ações em Massa
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onBulkAction('review_all')}>
          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
          Colocar Todos em Revisão
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBulkAction('normal_all')}>
          <Eye className="w-4 h-4 mr-2 text-green-600" />
          Marcar Todos como Não Alterar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onBulkAction('clear_all')}>
          <Eraser className="w-4 h-4 mr-2 text-gray-600" />
          Remover Todas as Marcações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductBulkActions;
