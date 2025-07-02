import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, Eye, MoreHorizontal, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProducts, useDeleteProduct, useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import ViewModeToggle from '@/components/ui/view-mode-toggle';
import { logger } from '@/services/logger';
import { Product } from '@/services/woocommerce';
import ProductDialog from '@/components/products/ProductDialog';
import ProductDetails from '@/components/products/ProductDetails';
import ProductCard from '@/components/products/ProductCard';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productForDetails, setProductForDetails] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const { isConfigured } = useWooCommerceConfig();
  const { data: allProducts = [], isLoading, error, refetch } = useProducts();
  const deleteProduct = useDeleteProduct();
  const { viewMode, toggleViewMode } = useViewMode('products');

  // Filter and paginate data
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !selectedStatus || product.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allProducts, searchTerm, selectedStatus]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Produtos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={handleCreateProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
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
                
                <Button variant="outline" onClick={() => refetch()}>
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

      {/* Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lista de Produtos {!isLoading && `(${filteredProducts.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-500 mt-2">Carregando produtos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">Erro ao carregar produtos</p>
              <Button onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : paginatedProducts.length === 0 ? (
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product: any) => {
                  const stockStatus = getStockStatus(product);
                  const isExpanded = expandedProducts.has(product.id);
                  const hasVariations = product.type === 'variable' && product.variations?.length > 0;
                  
                  return (
                    <React.Fragment key={product.id}>
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
                        <React.Fragment>
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
                            </TableRow>
                          ))}
                        </React.Fragment>
                      )}
                    </React.Fragment>
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
      {filteredProducts.length > 0 && (
        <PaginationControls
          info={pagination.info}
          actions={pagination.actions}
          itemsPerPage={pagination.state.itemsPerPage}
          totalItems={pagination.state.totalItems}
          currentPage={pagination.state.currentPage}
          className="mt-6"
        />
      )}


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
