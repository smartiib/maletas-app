import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDialog } from '@/components/product/ProductDialog';
import { ProductStockFilters } from '@/components/product/ProductStockFilters';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyWooCommerceState } from '@/components/woocommerce/EmptyWooCommerceState';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { ProductBulkActions } from '@/components/product/ProductBulkActions';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [productStatuses, setProductStatuses] = useState({});
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

  const updateProductStatus = (productId: number, status: 'normal' | 'warning' | 'error') => {
    setProductStatuses(prev => ({ ...prev, [productId]: status }));
  };

  const handleBulkStatusUpdate = useCallback((status: 'active' | 'inactive') => {
    // Simulate API call to update status in bulk
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
          <ProductBulkActions 
            selectedProducts={selectedProducts}
            onClearSelection={() => setSelectedProducts([])}
            onStatusUpdate={handleBulkStatusUpdate}
          />
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

      {/* Filters - Mobile optimized */}
      <ProductStockFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isMobile={isMobile}
      />

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
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                isSelected={selectedProducts.includes(product.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedProducts([...selectedProducts, product.id]);
                  } else {
                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                  }
                }}
                reviewStatus={productStatuses[product.id] || 'normal'}
                onStatusChange={(status) => updateProductStatus(product.id, status)}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination - Mobile friendly */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onSave={() => {
          setDialogOpen(false);
          setSelectedProduct(null);
          refetch();
        }}
      />
    </div>
  );
};

export default Products;
