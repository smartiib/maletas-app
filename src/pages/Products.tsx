
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import PaginationControls from '@/components/ui/pagination-controls';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyWooCommerceState } from '@/components/woocommerce/EmptyWooCommerceState';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProductReviewStatus } from '@/hooks/useProductReviewStatus';
import { cn } from '@/lib/utils';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>(
    (searchParams.get('status') as 'active' | 'inactive') || ''
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    products,
    isLoading,
    totalPages,
    totalProducts,
    activeProducts,
    inactiveProducts,
    refetch,
  } = useProducts({
    search: debouncedSearchTerm,
    category: selectedCategory,
    stock: stockFilter,
    status: statusFilter,
    page: currentPage,
  });

  const {
    statuses,
    loading: statusesLoading,
    updateProductStatus,
    bulkUpdateStatuses
  } = useProductReviewStatus();

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    if (selectedCategory) newParams.set('category', selectedCategory);
    if (stockFilter) newParams.set('stock', stockFilter);
    if (statusFilter) newParams.set('status', statusFilter);
    setCurrentPage(1);
    setSearchParams(newParams);
  }, [searchTerm, selectedCategory, stockFilter, statusFilter, setSearchParams]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleBulkStatusUpdate = useCallback((status: 'active' | 'inactive') => {
    setTimeout(() => {
      toast({
        title: "Status atualizado",
        description: `Status dos produtos selecionados atualizado para ${status}.`,
      });
      setSelectedProducts([]);
      refetch();
    }, 1000);
  }, [toast, refetch]);

  const statsCards = [
    { title: 'Total de Produtos', value: totalProducts, icon: Package },
    { title: 'Produtos Ativos', value: activeProducts, icon: TrendingUp },
    { title: 'Produtos Inativos', value: inactiveProducts, icon: ShoppingCart },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus produtos e controle de estoque
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <Button 
            onClick={() => setDialogOpen(true)}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-lg md:text-2xl font-bold">{card.value}</p>
              </div>
              <card.icon className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Products Grid/List - Responsive */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-32 md:h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyWooCommerceState
            title="Nenhum produto encontrado"
            description="Configure a integração com o WooCommerce ou ajuste os filtros para ver os produtos."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="space-y-3">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">R$ {product.price}</p>
                    <p className="text-xs text-muted-foreground">Estoque: {product.stock_quantity}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
