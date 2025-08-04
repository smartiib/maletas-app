import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Building2, MoreHorizontal, Link, Package, Eye } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import ViewModeToggle from '@/components/ui/view-mode-toggle';
import SupplierDialog from '@/components/suppliers/SupplierDialog';
import SupplierCard from '@/components/suppliers/SupplierCard';
import ProductSuppliersDialog from '@/components/suppliers/ProductSuppliersDialog';
import { useSuppliers, useDeleteSupplier, useSupplierProducts } from '@/hooks/useSuppliers';
import { useSupabaseProducts } from '@/hooks/useSupabaseSync';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(undefined);
  const [productSuppliersOpen, setProductSuppliersOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState<any>(null);
  const [showSupplierProducts, setShowSupplierProducts] = useState(false);
  const [supplierForProductsView, setSupplierForProductsView] = useState<any>(null);

  const { toast } = useToast();
  const { data: allSuppliers = [], isLoading } = useSuppliers();
  const { data: productsData } = useSupabaseProducts(1, '', '', '');
  const allProducts = productsData?.products || [];
  const { data: supplierProducts = [] } = useSupplierProducts(supplierForProductsView?.id);
  const deleteSupplier = useDeleteSupplier();
  const { viewMode, toggleViewMode } = useViewMode('suppliers');

  // Filter and paginate data
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter(supplier => {
      const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [allSuppliers, searchTerm]);

  const pagination = usePagination(filteredSuppliers.length, 20);
  const startIndex = (pagination.state.currentPage - 1) * 20;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + 20);
  const currentPage = pagination.state.currentPage;
  const totalPages = pagination.info.totalPages;
  const totalItems = pagination.state.totalItems;

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteSupplier.mutateAsync(id);
        toast({
          title: 'Sucesso',
          description: 'Fornecedor excluído com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir fornecedor.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleManageProducts = (supplier: any) => {
    setSelectedSupplierForProducts(supplier);
    setProductSuppliersOpen(true);
  };

  const handleViewProducts = (supplier: any) => {
    setSupplierForProductsView(supplier);
    setShowSupplierProducts(true);
  };

  // Get products linked to the selected supplier
  const linkedProducts = useMemo(() => {
    if (!supplierForProductsView || !supplierProducts.length || !allProducts.length) return [];
    
    return supplierProducts.map(sp => {
      const product = allProducts.find(p => p.id === sp.product_id);
      return product ? { ...product, supplierData: sp } : null;
    }).filter(Boolean);
  }, [supplierProducts, allProducts, supplierForProductsView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores e vincule produtos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PageHelp 
            title="Fornecedores"
            description="Gerencie fornecedores e vincule produtos"
            helpContent={{
              overview: "Gerencie fornecedores e vincule produtos para controle de estoque.",
              features: [
                { title: "Cadastro de Fornecedores", description: "Cadastre e edite informações dos fornecedores" },
                { title: "Vinculação de Produtos", description: "Associe produtos aos fornecedores para controle" }
              ]
            }}
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedores ({totalItems})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando seu primeiro fornecedor.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Fornecedor
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onManageProducts={handleManageProducts}
                  onViewProducts={handleViewProducts}
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.company_name || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProducts(supplier)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageProducts(supplier)}
                          className="h-8 w-8 p-0"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDelete(supplier.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                info={pagination.info}
                actions={pagination.actions}
                itemsPerPage={20}
                totalItems={totalItems}
                currentPage={currentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos do Fornecedor */}
      {showSupplierProducts && supplierForProductsView && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos de {supplierForProductsView.name} ({linkedProducts.length})
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setShowSupplierProducts(false)}
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {linkedProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto vinculado</h3>
                <p className="text-muted-foreground mb-4">
                  Este fornecedor ainda não tem produtos vinculados.
                </p>
                <Button onClick={() => handleManageProducts(supplierForProductsView)}>
                  Vincular Produtos
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>SKU Fornecedor</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedProducts.map((product: any) => (
                    <TableRow key={product.id}>
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
                            <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {parseFloat(product.price || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.supplierData?.supplier_sku || '-'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {product.supplierData?.cost_price ? 
                          `R$ ${parseFloat(product.supplierData.cost_price).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {product.supplierData?.lead_time_days ? 
                          `${product.supplierData.lead_time_days} dias` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.supplierData?.is_primary ? 'default' : 'secondary'}>
                          {product.supplierData?.is_primary ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        supplier={selectedSupplier}
      />

      <ProductSuppliersDialog
        open={productSuppliersOpen}
        onOpenChange={setProductSuppliersOpen}
        supplier={selectedSupplierForProducts}
      />
    </div>
  );
};

export default Suppliers;