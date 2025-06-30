
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, DollarSign, Warehouse } from 'lucide-react';
import { Product } from '@/services/woocommerce';

interface ProductDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ open, onOpenChange, product }) => {
  if (!product) return null;

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

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'instock': return 'bg-success-100 text-success-800';
      case 'outofstock': return 'bg-red-100 text-red-800';
      case 'onbackorder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'instock': return 'Em Estoque';
      case 'outofstock': return 'Sem Estoque';
      case 'onbackorder': return 'Em Reposição';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].src} 
                  alt={product.images[0].alt || product.name}
                  className="w-48 h-48 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Package className="w-16 h-16 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(product.status)}>
                  {getStatusLabel(product.status)}
                </Badge>
                <Badge className={getStockStatusColor(product.stock_status)}>
                  {getStockStatusLabel(product.stock_status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">SKU</label>
                  <p className="font-mono">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">ID</label>
                  <p className="font-mono">#{product.id}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações de Preço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Preço Regular</label>
                  <p className="text-lg font-semibold">R$ {parseFloat(product.regular_price || '0').toFixed(2)}</p>
                </div>
                {product.sale_price && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Preço de Promoção</label>
                    <p className="text-lg font-semibold text-red-600">R$ {parseFloat(product.sale_price).toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-600">Preço Final</label>
                  <p className="text-lg font-bold">R$ {parseFloat(product.price || '0').toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5" />
                Informações de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Quantidade</label>
                  <p className="text-lg font-semibold">{product.stock_quantity || 0} unidades</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p>
                    <Badge className={getStockStatusColor(product.stock_status)}>
                      {getStockStatusLabel(product.stock_status)}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descriptions */}
          {product.short_description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição Curta</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              </CardContent>
            </Card>
          )}

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informações de Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Criado em</label>
                  <p>{new Date(product.date_created).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Modificado em</label>
                  <p>{new Date(product.date_modified).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetails;
