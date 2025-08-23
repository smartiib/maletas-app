import React, { useState } from 'react';
import { Package, Edit, Trash2, Eye, MoreHorizontal, AlertTriangle, X } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
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
  const [reviewStatus, setReviewStatus] = useState<string>('normal');

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
      return { color: 'bg-red-50 border-red-200 text-red-700', text: 'Sem estoque' };
    }
    
    const stock = product.stock_quantity || 0;
    if (stock <= 5) {
      return { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', text: `${stock} un.` };
    }
    return { color: 'bg-green-50 border-green-200 text-green-700', text: `${stock} un.` };
  };

  const handleReviewStatusChange = (status: string) => {
    setReviewStatus(status);
    console.log(`Produto ${product.id} marcado como: ${status}`);
  };

  const getCardBackgroundColor = () => {
    switch (reviewStatus) {
      case 'review': return 'bg-yellow-50 border-yellow-200';
      case 'normal': return 'bg-green-50 border-green-200';
      case 'remove_review': return 'bg-white border-border';
      default: return 'bg-white border-border';
    }
  };

  const getReviewStatusBadge = () => {
    if (reviewStatus === 'normal') return null;
    if (reviewStatus === 'remove_review') return null;
    
    const statusConfig = {
      review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, text: 'Em Revisão' }
    };
    
    const config = statusConfig[reviewStatus as keyof typeof statusConfig];
    if (!config) return null;
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const stockStatus = getStockStatus(product);
  const cardBgColor = getCardBackgroundColor();

  if (viewMode === 'grid') {
    return (
      <Card className={`hover:shadow-md transition-all-smooth h-fit ${cardBgColor}`}>
        <CardContent className="p-3">
          <div className="space-y-3">
            {/* Imagem e ações */}
            <div className="relative">
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0].src} 
                    alt={product.images[0].alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              {/* Tag de revisão sobre a imagem */}
              {getReviewStatusBadge() && (
                <div className="absolute top-2 left-2">
                  {getReviewStatusBadge()}
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white/80 hover:bg-white">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onView?.(product)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(product)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Revisão
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleReviewStatusChange('normal')}>
                          <Eye className="w-4 h-4 mr-2" />
                          Não alterar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReviewStatusChange('review')}>
                          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                          Em Revisão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReviewStatusChange('remove_review')}>
                          <X className="w-4 h-4 mr-2 text-red-600" />
                          Remover Revisão
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
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

            {/* Informações do produto */}
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id}`}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${getStatusColor(product.status)}`}
                >
                  {getStatusLabel(product.status)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 border ${stockStatus.color}`}
                >
                  {stockStatus.text}
                </Badge>
              </div>

              <div className="text-sm font-semibold text-center">
                R$ {parseFloat(product.price || '0').toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Visualização em lista
  return (
    <Card className={`hover:shadow-md transition-all-smooth ${cardBgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    {getReviewStatusBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku || '-'} • ID: {product.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-16 mt-2">
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView?.(product)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Revisão
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleReviewStatusChange('normal')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Não alterar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReviewStatusChange('review')}>
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                      Em Revisão
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReviewStatusChange('remove_review')}>
                      <X className="w-4 h-4 mr-2 text-red-600" />
                      Remover Revisão
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete?.(product.id, product.name)}
                >
                  <Trash2 className="w-4 w-4 mr-2" />
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
