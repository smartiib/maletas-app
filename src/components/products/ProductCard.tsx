
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
import { useProductVariations } from '@/hooks/useProductVariations'; // ADDED

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, name: string) => void;
  getTotalStock?: (product: any) => number;
  productStatus?: 'normal' | 'em-revisao' | 'nao-alterar';
  onStatusChange?: (productId: number, status: 'normal' | 'em-revisao' | 'nao-alterar') => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode, 
  onView, 
  onEdit, 
  onDelete,
  getTotalStock,
  productStatus = 'normal',
  onStatusChange
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

  // Buscar variações do Supabase quando for produto variável (para corrigir total quando getTotalStock não estiver disponível)
  const { data: dbVariations = [] } = useProductVariations(
    product?.type === 'variable' ? Number(product.id) : undefined
  ); // ADDED

  const getStockStatus = (product: any) => {
    if (product.stock_status === 'outofstock') {
      return { color: 'bg-destructive-100 text-destructive-800', text: 'Sem estoque' };
    }
    
    // Usar a função getTotalStock se disponível, senão usar stock_quantity simples
    const stock = getTotalStock ? getTotalStock(product) : Math.max(0, product.stock_quantity || 0);
    
    if (stock <= 0) {
      return { color: 'bg-destructive-100 text-destructive-800', text: 'Sem estoque' };
    }
    if (stock <= 5) {
      return { color: 'bg-warning-100 text-warning-800', text: `${stock} unidades` };
    }
    return { color: 'bg-success-100 text-success-800', text: `${stock} unidades` };
  };

  // Ícone usa a mesma lógica de severidade do estoque (usaremos o total computado se for fornecido)
  const getStockIcon = (product: any, computedTotal?: number) => {
    const stock = typeof computedTotal === 'number'
      ? computedTotal
      : (getTotalStock ? getTotalStock(product) : Math.max(0, product.stock_quantity || 0));
    if (product.stock_status === 'outofstock' || stock === 0) {
      return 'bg-destructive'; // usar token semântico
    }
    if (stock <= 5) {
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
    if (qty <= 0) return 'bg-destructive-100 text-destructive-800';
    if (qty <= 5) return 'bg-warning-100 text-warning-800';
    return 'bg-success-100 text-success-800';
  };

  const getProductBackgroundClass = () => {
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

  const stockStatus = getStockStatus(product);

  // Corrigir total: usar getTotalStock se vier do pai, senão somar variações do Supabase quando for produto variável
  const totalStock = React.useMemo(() => {
    // Se o pai fornece um total, priorizar
    if (typeof getTotalStock === 'function') {
      const val = Number(getTotalStock(product));
      if (Number.isFinite(val) && val >= 0) return val;
    }
    if (product?.type === 'variable') {
      if (dbVariations && dbVariations.length > 0) {
        return dbVariations.reduce((sum, v: any) => {
          const n = Number(v?.stock_quantity ?? 0);
          return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
        }, 0);
      }
      // fallback (caso ainda não tenha variações no banco)
      return Math.max(0, Number(product?.stock_quantity ?? 0));
    }
    // simples
    return Math.max(0, Number(product?.stock_quantity ?? 0));
  }, [getTotalStock, product, dbVariations]); // ADDED

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
            <div className={`absolute top-2 left-2 w-4 h-4 ${getStockIcon(product, totalStock)} rounded-full flex items-center justify-center`}>
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
                <Badge className={getUnitsBadgeClass(totalStock)}>
                  {totalStock} unidades
                </Badge>
                {/* Não mostrar o badge de status de estoque se o produto for variável e tiver getTotalStock */}
                {!(product.type === 'variable' && getTotalStock) && (
                  <Badge className={stockStatus.color}>
                    {stockStatus.text}
                  </Badge>
                )}
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
                  <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStockIcon(product, totalStock)} rounded-full flex items-center justify-center`}>
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
              <Badge className={getUnitsBadgeClass(totalStock)}>
                {totalStock} unidades
              </Badge>
              {/* Não mostrar o badge de status de estoque se o produto for variável e tiver getTotalStock */}
              {!(product.type === 'variable' && getTotalStock) && (
                <Badge className={stockStatus.color}>
                  {stockStatus.text}
                </Badge>
              )}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
