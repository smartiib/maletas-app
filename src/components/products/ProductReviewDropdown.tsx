
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Eye, AlertTriangle, X } from 'lucide-react';

interface ProductReviewDropdownProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
}

const ProductReviewDropdown: React.FC<ProductReviewDropdownProps> = ({
  currentStatus = 'normal',
  onStatusChange
}) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return 'Não alterar';
      case 'review': return 'Em Revisão';
      case 'remove_review': return 'Remover Revisão';
      default: return 'Não alterar';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'remove_review': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'review': return <AlertTriangle className="w-3 h-3" />;
      case 'remove_review': return <X className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 px-2 text-xs"
        >
          <Badge 
            variant="outline" 
            className={`text-xs px-1.5 py-0.5 mr-1 ${getStatusColor(currentStatus)}`}
          >
            {getStatusIcon(currentStatus)}
            <span className="ml-1">{getStatusLabel(currentStatus)}</span>
          </Badge>
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem 
          onClick={() => onStatusChange('normal')}
          className="flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Não alterar
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange('review')}
          className="flex items-center"
        >
          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
          Em Revisão
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange('remove_review')}
          className="flex items-center"
        >
          <X className="w-4 h-4 mr-2 text-red-600" />
          Remover Revisão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductReviewDropdown;
