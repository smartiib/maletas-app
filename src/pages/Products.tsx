import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, Eye, MoreHorizontal, AlertCircle, ChevronDown, ChevronRight, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAllProducts, useDeleteProduct, useWooCommerceConfig, useCategories } from '@/hooks/useWooCommerce';
import { useSupabaseProducts } from '@/hooks/useSupabaseSync';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import ViewModeToggle from '@/components/ui/view-mode-toggle';
import { logger } from '@/services/logger';
import { Product } from '@/services/woocommerce';
import ProductDialog from '@/components/products/ProductDialog';
import ProductDetails from '@/components/products/ProductDetails';
import ProductCard from '@/components/products/ProductCard';
import { StockRow } from '@/components/stock/StockRow';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';
import { useSuppliers } from '@/hooks/useSuppliers';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productForDetails, setProductForDetails] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const { isConfigured } = useWooCommerceConfig();
  const { data: allProductsData } = useSupabaseProducts(1, '', '', '');
  // Adaptar os produtos do Supabase para o tipo Product esperado
  const allProducts = (allProductsData?.products || []).map((product: any) => ({
    ...product,
    type: product.type as "variable" | "simple" | "grouped" | "external",
    categories: product.categories || [],
    images: product.images || [],
    meta_data: product.meta_data || []
  }));
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();
  const { viewMode, toggleViewMode } = useViewMode('products');

  // Filter and paginate data
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !selectedStatus || product.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || 
        product.categories?.some((cat: any) => cat.id.toString() === selectedCategory);
      
      // Buscar supplier_id no meta_data
      const supplierMeta = (product as any).meta_data?.find((meta: any) => meta.key === 'supplier_id');
      const productSupplierId = supplierMeta?.value;
      const matchesSupplier = !selectedSupplier || productSupplierId === selectedSupplier;
      
      return matchesSearch && matchesStatus && matchesSupplier && matchesCategory;
    });
  }, [allProducts, searchTerm, selectedStatus, selectedSupplier, selectedCategory]);

  const pagination = usePagination(filteredProducts.length, 20);
  
  const paginatedProducts = useMemo(() => {
    const start = (pagination.state.currentPage - 1) * pagination.state.itemsPerPage;
    const end = start + pagination.state.itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, pagination.state.currentPage, pagination.state.itemsPerPage]);

  const statuses = ['', 'draft', 'pending', 'private', 'publish'];

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
      return { color: 'bg-red-100 text-red-800', text: 'Sem estoque' };
    }
    
    // Para produtos variáveis, somar estoque das variações
    if (product.type === 'variable' && product.variations) {
      const totalStock = product.variations.reduce((total: number, variation: any) => 
        total + (variation.stock_quantity || 0), 0);
      
      if (totalStock === 0) {
        return { color: 'bg-red-100 text-red-800', text: 'Sem estoque' };
      }
      if (totalStock <= 5) {
        return { color: 'bg-yellow-100 text-yellow-800', text: `${totalStock} unidades` };
      }
      return { color: 'bg-success-100 text-success-800', text: `${totalStock} unidades` };
    }
    
    // Para produtos simples
    const stock = product.stock_quantity || 0;
    if (stock <= 5) {
      return { color: 'bg-yellow-100 text-yellow-800', text: `${stock} unidades` };
    }
    return { color: 'bg-success-100 text-success-800', text: `${stock} unidades` };
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      try {
        await deleteProduct.mutateAsync(id);
        logger.success('Produto Excluído', `Produto "${name}" foi excluído com sucesso`);
      } catch (error) {
        logger.error('Erro ao Excluir', `Falha ao excluir produto "${name}"`);
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setProductForDetails(product);
    setDetailsOpen(true);
  };

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

  // Funções específicas para o controle de estoque
  const getStockStatusForStock = (stock: number, status: string) => {
    if (status === 'outofstock' || stock === 0) {
      return { label: 'Sem estoque', color: 'destructive' };
    } else if (stock <= 5) {
      return { label: 'Estoque baixo', color: 'secondary' };
    } else {
      return { label: 'Em estoque', color: 'default' };
    }
  };

  const getTotalStock = (product: any) => {
    if (product.type === 'variable' && product.variations) {
      return product.variations.reduce((total: number, variation: any) => {
        const stock = variation.stock_quantity || 0;
        return total + Math.max(0, stock);
      }, 0);
    }
    return Math.max(0, product.stock_quantity || 0);
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Produtos
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie seu catálogo de produtos
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">WooCommerce não configurado</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Configure sua integração com WooCommerce nas configurações para começar a gerenciar seus produtos.
            </p>
            <Button onClick={() => window.location.href = '/configuracoes'}>
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ajuda da Página */}
      <PageHelp 
        title={activeTab === 'products' ? helpContent.produtos.title : helpContent.estoque.title}
        description={activeTab === 'products' ? helpContent.produtos.description : helpContent.estoque.description}
        helpContent={activeTab === 'products' ? helpContent.produtos : helpContent.estoque}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {activeTab === 'products' ? 'Produtos' : 'Controle de Estoque'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {activeTab === 'products' ? 'Gerencie seu catálogo de produtos' : 'Gerencie o estoque dos seus produtos'}
          </p>
        </div>
        {activeTab === 'products' && (
          <Button className="bg-gradient-primary hover:opacity-90" onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Estoque
          </TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <TabsContent value="products">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar produtos por nome ou SKU..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Todos os Status</option>
                      {statuses.slice(1).map(status => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Todos os Fornecedores</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <ViewModeToggle 
                  viewMode={viewMode} 
                  onToggle={toggleViewMode} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 pl-10">
                        <SelectValue placeholder="Filtrar por categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome ou SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtos */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Lista de Produtos ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                </div>
              ) : viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product: any) => {
                  const stockStatus = getStockStatus(product);
                  const isExpanded = expandedProducts.has(product.id);
                  const hasVariations = product.type === 'variable' && product.variations?.length > 0;
                  
                  return (
                    <>
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableCell>
                          {hasVariations && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductExpansion(product.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={product.images[0].src} 
                                  alt={product.images[0].alt}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {product.id}
                                {product.categories && product.categories.length > 0 && (
                                  <span> • {product.categories[0].name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.type === 'simple' ? 'Simples' : 
                             product.type === 'variable' ? 'Variável' : 
                             product.type === 'grouped' ? 'Agrupado' : 
                             product.type === 'external' ? 'Externo' : product.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">
                              R$ {parseFloat(product.price || '0').toFixed(2)}
                            </div>
                            {product.sale_price && product.sale_price !== product.regular_price && (
                              <div className="text-sm text-muted-foreground line-through">
                                R$ {parseFloat(product.regular_price || '0').toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>
                            {getStatusLabel(product.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const supplierMeta = (product as any).meta_data?.find((meta: any) => meta.key === 'supplier_id');
                            const supplierId = supplierMeta?.value;
                            
                            if (supplierId) {
                              const supplier = suppliers.find(s => s.id === supplierId);
                              return (
                                <span className="text-sm">
                                  {supplier?.name || 'Fornecedor não encontrado'}
                                </span>
                              );
                            }
                            return <span className="text-muted-foreground text-sm">-</span>;
                          })()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      {/* Variações */}
                      {isExpanded && hasVariations && (
                        <>
                          {product.variations.map((variation: any) => (
                            <TableRow key={`${product.id}-${variation.id}`} className="bg-muted/50">
                              <TableCell></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3 ml-6">
                                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {variation.attributes?.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Variação ID: {variation.id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">Variação</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{variation.sku || '-'}</TableCell>
                              <TableCell className="font-semibold">
                                R$ {parseFloat(variation.price || '0').toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStockStatus({ stock_status: variation.stock_status, stock_quantity: variation.stock_quantity }).color}>
                                  {getStockStatus({ stock_status: variation.stock_status, stock_quantity: variation.stock_quantity }).text}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-primary-100 text-primary-800">Ativa</Badge>
                               </TableCell>
                               <TableCell>
                                 <span className="text-sm text-muted-foreground">-</span>
                               </TableCell>
                               <TableCell>
                                 {/* Variações não têm ações próprias */}
                               </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {paginatedProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onView={handleViewProduct}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {filteredProducts.length > 0 && activeTab === 'products' && (
        <PaginationControls
          info={pagination.info}
          actions={pagination.actions}
          itemsPerPage={pagination.state.itemsPerPage}
          totalItems={pagination.state.totalItems}
          currentPage={pagination.state.currentPage}
          className="mt-6"
        />
      )}
    </TabsContent>

    {/* Controle de Estoque */}
    <TabsContent value="stock">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Produtos em Estoque ({filteredProducts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
              filteredProducts.map((product: any) => (
                <StockRow
                  key={product.id}
                  product={product}
                  isExpanded={expandedProducts.has(product.id)}
                  onToggleExpand={() => toggleProductExpansion(product.id)}
                  getTotalStock={getTotalStock}
                  getStockStatus={getStockStatusForStock}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

  {/* Dialogs */}
  <ProductDialog
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    product={selectedProduct}
    mode={dialogMode}
  />

  <ProductDetails
    open={detailsOpen}
    onOpenChange={setDetailsOpen}
    product={productForDetails}
  />
</div>
  );
};

export default Products;
