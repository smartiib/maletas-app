import React from 'react';
import { Package, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/woocommerce';
import { ViewMode } from '@/hooks/useViewMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, name: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'publish': return 'bg-success-100 text-success-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'private': return 'bg-slate-100 text-slate-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'publish': return 'Publicado';
      case 'draft': return 'Rascunho';
      case 'private': return 'Privado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getStockStatus = (product: any) => {
    if (product.stock_status === 'outofstock') {
      return { color: 'bg-destructive-100 text-destructive-800', text: 'Sem estoque' };
    }
    
    const stock = product.stock_quantity || 0;
    if (stock <= 5) {
      return { color: 'bg-warning-100 text-warning-800', text: `${stock} unidades` };
    }
    return { color: 'bg-success-100 text-success-800', text: `${stock} unidades` };
  };

  const stockStatus = getStockStatus(product);

  return (
    <Card className="hover:shadow-md transition-all-smooth">
      <CardContent className="p-4">
        <div className={viewMode === 'grid' ? 'space-y-4' : 'flex items-center justify-between'}>
          <div className="flex-1">
            <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-4'}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].src} 
                      alt={product.images[0].alt}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku || '-'} • ID: {product.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 'space-y-2 mt-3' : 'flex items-center gap-4 ml-16'}>
              <Badge className={getStatusColor(product.status)}>
                {getStatusLabel(product.status)}
              </Badge>
              <Badge className={stockStatus.color}>
                {stockStatus.text}
              </Badge>
              <span className="font-semibold">
                R$ {parseFloat(product.price || '0').toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? 'flex justify-end' : ''}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(product)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete?.(product.id, product.name)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;