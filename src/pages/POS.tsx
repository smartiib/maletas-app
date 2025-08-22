import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, X } from "lucide-react";
import { useWooCommerceFilteredProducts, useWooCommerceFilteredCategories } from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import CartSidebar from "@/components/pos/CartSidebar";
import CategorySlider from "@/components/pos/CategorySlider";
import FloatingCartButton from "@/components/pos/FloatingCartButton";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import SyncHeader from "@/components/sync/SyncHeader";
import { formatBRL } from "@/utils/currency";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  sku?: string;
  variation_id?: number;
  variation_attributes?: Array<{ name: string; value: string }>;
  item_discount?: { type: 'percentage' | 'fixed'; value: number };
}

const POS = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { data: products = [], isLoading: productsLoading } = useWooCommerceFilteredProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useWooCommerceFilteredCategories();
  const { isConfigured } = useWooCommerceConfig();
  const isMobile = useIsMobile();

  const filteredProducts = useMemo(() => {
    const selectedCategoryId = selectedCategory ? Number(selectedCategory) : null;

    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        !selectedCategoryId ||
        product.categories?.some((cat) => cat.id === selectedCategoryId);

      return matchesSearch && matchesCategory;
    });

    // Ordenar por nome
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: any, variationId?: number, variationName?: string) => {
    const price = parseFloat(product.price || product.regular_price || '0');
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && item.variation_id === variationId
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.variation_id === variationId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          price: price.toString(),
          quantity: 1,
          image: product.images?.[0]?.src,
          sku: product.sku,
          variation_id: variationId,
          variation_attributes: variationName ? [{ name: 'Variação', value: variationName }] : undefined
        };
        return [...prevCart, newItem];
      }
    });

    const displayName = variationName ? `${product.name} - ${variationName}` : product.name;
    toast.success(`${displayName} adicionado ao carrinho!`);
  };

  const updateQuantity = (id: number, quantity: number, variationId?: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => 
        !(item.id === id && item.variation_id === variationId)
      ));
    } else {
      setCart(prevCart => prevCart.map(item =>
        item.id === id && item.variation_id === variationId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (id: number, variationId?: number) => {
    setCart(prevCart => prevCart.filter(item => 
      !(item.id === id && item.variation_id === variationId)
    ));
  };

  const updateItemDiscount = (id: number, discount: { type: 'percentage' | 'fixed'; value: number }, variationId?: number) => {
    setCart(prevCart => prevCart.map(item =>
      item.id === id && item.variation_id === variationId
        ? { ...item, item_discount: discount }
        : item
    ));
  };

  const getItemTotal = (item: CartItem) => {
    const basePrice = parseFloat(item.price) * item.quantity;
    if (!item.item_discount || item.item_discount.value === 0) {
      return basePrice;
    }
    
    if (item.item_discount.type === 'percentage') {
      return basePrice * (1 - item.item_discount.value / 100);
    } else {
      return Math.max(0, basePrice - item.item_discount.value);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + getItemTotal(item), 0);
  };

  const saveCart = () => {
    // TODO: Implement save cart functionality
    toast.success("Carrinho salvo!");
  };

  const onCheckout = () => {
    // TODO: Implement checkout functionality
    toast.success("Redirecionando para checkout...");
  };

  const onCreateMaleta = () => {
    // TODO: Implement create maleta functionality
    toast.success("Criando maleta...");
  };

  const getStockQuantity = (product: any, variationId?: number) => {
    if (variationId && product.variations) {
      const variation = product.variations.find((v: any) => v.id === variationId);
      return variation?.stock_quantity || 0;
    }
    return product.stock_quantity || 0;
  };

  const isOutOfStock = (product: any, variationId?: number) => {
    const stock = getStockQuantity(product, variationId);
    return stock <= 0;
  };

  if (orgLoading || productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-2 mb-6">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
          description="Selecione uma organização para acessar o PDV."
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
          description="Configure sua conexão com o WooCommerce para usar o PDV."
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold">PDV - Ponto de Venda</h1>
          <p className="text-muted-foreground">
            Selecione produtos para venda
          </p>
        </div>
        <SyncHeader syncType="all" showProductsOnly={true} />
        <EmptyWooCommerceState
          title="Nenhum Produto Encontrado"
          description="Sincronize seus produtos do WooCommerce para usar o PDV."
          showConfigButton={false}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold">PDV - Ponto de Venda</h1>
        <p className="text-muted-foreground">
          Selecione produtos para venda ({products.length} produtos disponíveis)
        </p>
      </div>

      <SyncHeader syncType="all" showProductsOnly={true} />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {categories.length > 0 && (
          <CategorySlider
            categories={categories as unknown as string[]}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => setSelectedCategory(cat)}
          />
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square relative bg-muted">
              {product.images?.[0]?.src ? (
                <img
                  src={product.images[0].src}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {product.on_sale && (
                <Badge className="absolute top-2 right-2 bg-red-500">
                  Oferta
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {product.on_sale && product.regular_price ? (
                      <div className="space-x-2">
                        <span className="text-sm line-through text-muted-foreground">
                          R$ {parseFloat(product.regular_price).toFixed(2)}
                        </span>
                        <span className="font-bold text-green-600">
                          R$ {parseFloat(product.price || product.sale_price || '0').toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold">
                        R$ {parseFloat(product.price || product.regular_price || '0').toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {product.type === 'variable' && product.variations ? (
                  <div className="space-y-2">
                    {product.variations.map((variation: any) => {
                      const isVariationOutOfStock = isOutOfStock(product, variation.id);
                      return (
                        <Button
                          key={variation.id}
                          size="sm"
                          className="w-full text-xs"
                          disabled={isVariationOutOfStock}
                          onClick={() => addToCart(product, variation.id, variation.attributes?.map((attr: any) => attr.option).join(', '))}
                        >
                          {isVariationOutOfStock ? 'Sem Estoque' : `Adicionar ${variation.attributes?.map((attr: any) => attr.option).join(', ')}`}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={isOutOfStock(product)}
                    onClick={() => addToCart(product)}
                  >
                    {isOutOfStock(product) ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar sua busca ou filtros para encontrar produtos.
          </p>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        updateItemDiscount={updateItemDiscount}
        getItemTotal={getItemTotal}
        getSubtotal={getSubtotal}
        getTotalItems={getTotalItems}
        onCheckout={onCheckout}
        onCreateMaleta={onCreateMaleta}
        clearCart={clearCart}
        saveCart={saveCart}
      />

      {/* Floating Cart Button (Mobile) */}
      {isMobile && (
        <FloatingCartButton
          itemCount={getTotalItems()}
          total={getSubtotal()}
          onClick={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Button (Desktop) */}
      {!isMobile && getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button
            size="lg"
            onClick={() => setIsCartOpen(true)}
            className="shadow-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrinho ({getTotalItems()})
          </Button>
        </div>
      )}
    </div>
  );
};

export default POS;
