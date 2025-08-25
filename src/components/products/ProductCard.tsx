
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
import ProductVariationInfo from './ProductVariationInfo';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, name: string) => void;
  getTotalStock?: (product: any) => number;
}

type ProductStatus = 'normal' | 'em-revisao' | 'nao-alterar';

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete,
  getTotalStock
}) => {
  const [productStatus, setProductStatus] = React.useState<ProductStatus>('normal');

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

  const getStockIcon = (product: any) => {
    const stock = getTotalStock ? getTotalStock(product) : (product.stock_quantity || 0);
    if (product.stock_status === 'outofstock' || stock === 0) {
      return 'bg-red-500';
    }
    if (stock <= 5) {
      return 'bg-yellow-500';
    }
    return 'bg-green-500';
  };

  const getProductBackgroundClass = () => {
    switch (productStatus) {
      case 'em-revisao': return 'bg-yellow-50';
      case 'nao-alterar': return 'bg-green-50';
      default: return '';
    }
  };

  const handleStatusChange = (status: ProductStatus) => {
    setProductStatus(status);
  };

  const stockStatus = getStockStatus(product);

  if (viewMode === 'grid') {
    return (
      <Card className={`hover:shadow-md transition-all-smooth h-full ${getProductBackgroundClass()}`}>
        <CardContent className="p-4 space-y-3 h-full flex flex-col">
          {/* Image */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0].src} 
                alt={product.images[0].alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Stock status icon */}
            <div className={`absolute top-2 left-2 w-4 h-4 ${getStockIcon(product)} rounded-full flex items-center justify-center`}>
              <Package className="w-2.5 h-2.5 text-white" />
            </div>

            {/* Status tag */}
            {productStatus === 'em-revisao' && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                  Em Revisão
                </Badge>
              </div>
            )}

            {/* Three dots menu */}
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0 bg-white/80 hover:bg-white">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={() => onEdit?.(product)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('em-revisao')}>
                    Em Revisão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('nao-alterar')}>
                    Não Alterar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('normal')}>
                    Remover Marcação
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
              <p className="text-xs text-muted-foreground">
                SKU: {product.sku || '-'} • ID: {product.id}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge className={getStatusColor(product.status)}>
                  {getStatusLabel(product.status)}
                </Badge>
                <Badge className={stockStatus.color}>
                  {stockStatus.text}
                </Badge>
              </div>
              
              <div className="text-sm font-semibold">
                R$ {parseFloat(product.price || '0').toFixed(2)}
              </div>

              {/* Variation Info */}
              {getTotalStock && (
                <ProductVariationInfo 
                  product={product} 
                  getTotalStock={getTotalStock}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-all-smooth ${getProductBackgroundClass()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].src} 
                      alt={product.images[0].alt}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                  {/* Stock status icon */}
                  <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStockIcon(product)} rounded-full flex items-center justify-center`}>
                    <Package className="w-2.5 h-2.5 text-white" />
                  </div>
                  
                  {/* Status tag for list view */}
                  {productStatus === 'em-revisao' && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                        Em Revisão
                      </Badge>
                    </div>
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
            
            <div className="flex items-center gap-4 ml-16">
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
          
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={() => onView?.(product)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('em-revisao')}>
                  Em Revisão
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('nao-alterar')}>
                  Não Alterar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('normal')}>
                  Remover Marcação
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
