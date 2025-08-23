
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  // DropdownMenuSeparator, // removido pois não haverá mais a opção de exportar
} from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertTriangle, Eye, X, CheckSquare } from 'lucide-react';

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
        <DropdownMenuItem onClick={() => onBulkAction('remove_review_all')}>
          <X className="w-4 h-4 mr-2 text-red-600" />
          Remover Revisão de Todos
        </DropdownMenuItem>
        {/*
        Removidos:
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onBulkAction('export_selected')}>
          Exportar Selecionados
        </DropdownMenuItem>
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductBulkActions;
