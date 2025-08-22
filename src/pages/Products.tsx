import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductDialog from "@/components/products/ProductDialog";
import { useWooCommerceFilteredProducts } from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewMode } from "@/hooks/useViewMode";
import ViewModeToggle from "@/components/ui/view-mode-toggle";
import { StockRow } from "@/components/stock/StockRow";
import ProductPriceInfo from "@/components/products/ProductPriceInfo";
import { ProductStockFilters, StockFilter } from "@/components/products/ProductStockFilters";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { data: products = [], isLoading } = useWooCommerceFilteredProducts();
  const { isConfigured } = useWooCommerceConfig();
  const { viewMode, toggleViewMode } = useViewMode('products');

  // Filtros combinados (busca + estoque)
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtro de estoque
    if (stockFilter !== 'all') {
      filtered = filtered.filter((product) => {
        const totalStock = getTotalStock(product);
        const status = product.stock_status;

        switch (stockFilter) {
          case 'in-stock':
            return status !== 'outofstock' && totalStock > 10;
          case 'low-stock':
            return totalStock > 0 && totalStock <= 10;
          case 'out-of-stock':
            return status === 'outofstock' || totalStock === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [products, searchTerm, stockFilter]);

  // Contadores para os filtros
  const stockCounts = useMemo(() => {
    const counts = {
      all: products.length,
      inStock: 0,
      outOfStock: 0,
      lowStock: 0,
    };

    products.forEach((product) => {
      const totalStock = getTotalStock(product);
      const status = product.stock_status;

      if (status === 'outofstock' || totalStock === 0) {
        counts.outOfStock++;
      } else if (totalStock <= 10) {
        counts.lowStock++;
      } else {
        counts.inStock++;
      }
    });

    return counts;
  }, [products]);

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const getTotalStock = (product: any) => {
    if (product.type === 'variable' && product.variations?.length > 0) {
      return product.variations.reduce((total: number, variation: any) => {
        const qty = typeof variation?.stock_quantity === 'number' ? variation.stock_quantity : Number(variation?.stock_quantity) || 0;
        return total + Math.max(0, qty);
      }, 0);
    }
    const qty = typeof product?.stock_quantity === 'number' ? product.stock_quantity : Number(product?.stock_quantity) || 0;
    return Math.max(0, qty);
  };

  const getStockStatus = (stock: number, status: string) => {
    if (status === 'outofstock' || stock === 0) {
      return { label: 'Sem Estoque', color: 'destructive' };
    }
    if (stock < 10) {
      return { label: 'Estoque Baixo', color: 'secondary' };
    }
    return { label: 'Em Estoque', color: 'default' };
  };

  if (orgLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyWooCommerceState
          title="Nenhuma Organização Selecionada"
          description="Selecione uma organização para ver os produtos."
          showConfigButton={false}
        />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyWooCommerceState
          title="WooCommerce Não Configurado"
          description="Configure sua conexão com o WooCommerce para começar a gerenciar produtos."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seu catálogo de produtos
            </p>
          </div>
        </div>
        <EmptyWooCommerceState
          title="Nenhum Produto Encontrado"
          description="Sincronize seus produtos do WooCommerce ou adicione produtos manualmente."
          showConfigButton={false}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu catálogo de produtos ({products.length} produtos)
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros de estoque */}
      <div className="space-y-3">
        <ProductStockFilters
          selectedFilter={stockFilter}
          onFilterChange={setStockFilter}
          counts={stockCounts}
        />
        
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <ViewModeToggle 
            viewMode={viewMode} 
            onToggle={toggleViewMode}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Lista compacta no estilo da página Estoque */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <StockRow
            key={product.id}
            product={product}
            isExpanded={expandedProducts.has(product.id)}
            onToggleExpand={() => toggleProductExpansion(product.id)}
            getTotalStock={getTotalStock}
            getStockStatus={getStockStatus}
            rightExtra={<ProductPriceInfo product={product} />}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum produto encontrado para "{searchTerm}"
          </p>
        </div>
      )}

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode="create"
      />
    </div>
  );
};

export default Products;
