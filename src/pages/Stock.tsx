
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useWooCommerceFilteredProducts } from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewMode } from "@/hooks/useViewMode";
import ViewModeToggle from "@/components/ui/view-mode-toggle";
import { StockRow } from "@/components/stock/StockRow";

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { data: products = [], isLoading } = useWooCommerceFilteredProducts();
  const { isConfigured } = useWooCommerceConfig();
  const { viewMode, toggleViewMode } = useViewMode('stock');

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        return total + (variation.stock_quantity || 0);
      }, 0);
    }
    return product.stock_quantity || 0;
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
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
          description="Selecione uma organização para gerenciar o estoque."
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
          description="Configure sua conexão com o WooCommerce para gerenciar o estoque."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Estoque</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle o estoque dos seus produtos
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
            <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Estoque</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle o estoque dos seus produtos
            </p>
          </div>
        </div>
        <EmptyWooCommerceState
          title="Nenhum Produto Encontrado"
          description="Sincronize seus produtos do WooCommerce para gerenciar o estoque."
          showConfigButton={false}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Estoque</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle o estoque dos seus produtos ({products.length} produtos)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <StockRow
            key={product.id}
            product={product}
            isExpanded={expandedProducts.has(product.id)}
            onToggleExpand={() => toggleProductExpansion(product.id)}
            getTotalStock={getTotalStock}
            getStockStatus={getStockStatus}
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
    </div>
  );
};

export default Stock;
