import React from 'react';
import { Package, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/services/woocommerce';
import { ViewMode } from '@/hooks/useViewMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductVariationInfo from './ProductVariationInfo';
import { useProductVariations } from '@/hooks/useProductVariations';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, name: string) => void;
  getTotalStock?: (product: any) => number;
  productStatus?: 'normal' | 'em-revisao' | 'nao-alterar';
  onStatusChange?: (productId: number, status: 'normal' | 'em-revisao' | 'nao-alterar') => void;
  isSelected?: boolean;
  onSelectionChange?: (productId: number, selected: boolean) => void;
  isDeletionMode?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete,
  getTotalStock,
  productStatus = 'normal',
  onStatusChange,
  isSelected = false,
  onSelectionChange,
  isDeletionMode = false
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

  // Buscar variações do Supabase para produtos variáveis
  const { data: dbVariations = [] } = useProductVariations(
    product?.type === 'variable' ? Number(product.id) : undefined
  );

  const getStockStatus = (product: any, totalStock: number) => {
    // Produto só está sem estoque se o total calculado for 0
    if (totalStock === 0) {
      return { color: 'bg-destructive-100 text-destructive-800', text: 'Sem estoque' };
    }
    
    // Se tem estoque mas é baixo (<=5)
    if (totalStock <= 5) {
      return { color: 'bg-warning-100 text-warning-800', text: `${totalStock} unidades` };
    }
    
    // Estoque normal
    return { color: 'bg-success-100 text-success-800', text: `${totalStock} unidades` };
  };

  // Ícone usa a mesma lógica de severidade do estoque
  const getStockIcon = (totalStock: number) => {
    if (totalStock === 0) {
      return 'bg-destructive'; // usar token semântico
    }
    if (totalStock <= 5) {
      return 'bg-warning';
    }
    return 'bg-success';
  };

  // Função para obter o estoque total correto
  const getTotalStockForDisplay = (product: any) => {
    return getTotalStock ? getTotalStock(product) : Math.max(0, product.stock_quantity || 0);
  };

  // Classe para a tag de unidades com fundo colorido
  const getUnitsBadgeClass = (qty: number) => {
    if (qty === 0) return 'bg-destructive text-destructive-foreground';
    if (qty <= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getProductBackgroundClass = () => {
    if (isDeletionMode && isSelected) {
      return 'bg-red-50 border-red-500 border-2';
    }
    switch (productStatus) {
      case 'em-revisao': return 'bg-yellow-50';
      case 'nao-alterar': return 'bg-green-50';
      default: return '';
    }
  };

  const handleEdit = () => {
    console.log('Edit clicked for product:', product.id, product.name);
    onEdit?.(product);
  };

  const handleStatusChange = (status: 'normal' | 'em-revisao' | 'nao-alterar') => {
    console.log('Status change for product:', product.id, 'new status:', status);
    onStatusChange?.(product.id, status);
  };

  // Calcular o estoque total correto
  const totalStock = React.useMemo(() => {
    // Para produtos variáveis, usar as variações do Supabase se disponíveis
    if (product?.type === 'variable') {
      if (dbVariations && dbVariations.length > 0) {
        const supabaseTotal = dbVariations.reduce((sum, variation: any) => {
          const stock = Number(variation?.stock_quantity ?? 0);
          return sum + Math.max(0, stock);
        }, 0);
        return supabaseTotal;
      }
      // Se não tiver variações no Supabase, usar getTotalStock se fornecido
      if (getTotalStock) {
        return getTotalStock(product);
      }
      // Fallback para o estoque do produto principal
      return Math.max(0, Number(product?.stock_quantity ?? 0));
    }
    
    // Para produtos simples, usar getTotalStock se fornecido, senão usar stock_quantity
    if (getTotalStock) {
      return getTotalStock(product);
    }
    return Math.max(0, Number(product?.stock_quantity ?? 0));
  }, [product, dbVariations, getTotalStock]);

  // Calcular preço para produtos variáveis
  const getProductPrice = () => {
    const productPrice = parseFloat(product.price || '0');
    
    // Se o produto tem preço definido, usar esse preço
    if (productPrice > 0) {
      return `R$ ${productPrice.toFixed(2)}`;
    }
    
    // Se é produto variável e não tem preço, calcular baseado nas variações
    if (product?.type === 'variable' && dbVariations && dbVariations.length > 0) {
      const prices = dbVariations
        .map(variation => {
          const price = Number(variation?.price ?? variation?.regular_price ?? 0);
          return price > 0 ? price : 0;
        })
        .filter(price => price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return `R$ ${minPrice.toFixed(2)}`;
        } else {
          return `R$ ${minPrice.toFixed(2)} - R$ ${maxPrice.toFixed(2)}`;
        }
      }
    }
    
    // Fallback para o preço original
    return `R$ ${productPrice.toFixed(2)}`;
  };

  // Calcular o status do estoque usando o total correto
  const stockStatus = getStockStatus(product, totalStock);

  if (viewMode === 'grid') {
    return (
      <Card 
        className={`hover:shadow-md transition-all-smooth h-full ${getProductBackgroundClass()} ${isSelected && !isDeletionMode ? 'ring-2 ring-primary' : ''} ${isDeletionMode ? 'cursor-pointer' : ''}`}
        onClick={isDeletionMode ? () => onSelectionChange?.(product.id, !isSelected) : undefined}
      >
        <CardContent className="p-4 space-y-3 h-full flex flex-col">
          {/* Selection checkbox */}
          {(onSelectionChange && isDeletionMode) && (
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)}
                className={`bg-white/80 border-white ${isDeletionMode && isSelected ? 'border-red-500' : ''}`}
              />
            </div>
          )}
          
          {/* Deletion tag */}
          {isDeletionMode && isSelected && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="destructive" className="bg-red-600 text-white">
                EXCLUIR
              </Badge>
            </div>
          )}
          
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
            {!isDeletionMode && (
              <div className={`absolute top-2 ${isDeletionMode ? 'right-2' : (onSelectionChange ? 'right-2' : 'left-2')} w-4 h-4 ${getStockIcon(totalStock)} rounded-full flex items-center justify-center`}>
                <Package className="w-2.5 h-2.5 text-white" />
              </div>
            )}

            {/* Status tag */}
            {!isDeletionMode && productStatus === 'em-revisao' && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                  Em Revisão
                </Badge>
              </div>
            )}

            {/* Three dots menu */}
            {!isDeletionMode && (
              <div className={`absolute top-2 ${isDeletionMode ? 'right-8' : (onSelectionChange ? 'right-8' : 'right-2')}`}>
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
            )}
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
                <Badge className={getUnitsBadgeClass(totalStock)}>
                  {totalStock} unidades
                </Badge>
              </div>
              
              <div className="text-sm font-semibold">
                {getProductPrice()}
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
    <Card 
      className={`hover:shadow-md transition-all-smooth ${getProductBackgroundClass()} ${isSelected && !isDeletionMode ? 'ring-2 ring-primary' : ''} ${isDeletionMode ? 'cursor-pointer' : ''}`}
      onClick={isDeletionMode ? () => onSelectionChange?.(product.id, !isSelected) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Selection checkbox */}
          {(onSelectionChange && isDeletionMode) && (
            <div className="mr-3" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange(product.id, !!checked)}
                className={isDeletionMode && isSelected ? 'border-red-500' : ''}
              />
            </div>
          )}
          
          {/* Deletion tag for list view */}
          {isDeletionMode && isSelected && (
            <div className="mr-3">
              <Badge variant="destructive" className="bg-red-600 text-white">
                EXCLUIR
              </Badge>
            </div>
          )}
          
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
                  {!isDeletionMode && (
                    <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStockIcon(totalStock)} rounded-full flex items-center justify-center`}>
                      <Package className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  
                  {/* Status tag for list view */}
                  {!isDeletionMode && productStatus === 'em-revisao' && (
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
              <Badge className={getUnitsBadgeClass(totalStock)}>
                {totalStock} unidades
              </Badge>
              <span className="font-semibold">
                {getProductPrice()}
              </span>
            </div>
          </div>
          
          {!isDeletionMode && (
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
                  <DropdownMenuItem onClick={handleEdit}>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
