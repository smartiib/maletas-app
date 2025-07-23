import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Building2, MoreHorizontal, Link } from 'lucide-react';
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
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(undefined);
  const [productSuppliersOpen, setProductSuppliersOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState<any>(null);

  const { toast } = useToast();
  const { data: allSuppliers = [], isLoading } = useSuppliers();
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageProducts(supplier)}>
                            <Link className="mr-2 h-4 w-4" />
                            Gerenciar Produtos
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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