
import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, Eye, MoreHorizontal, AlertCircle } from 'lucide-react';
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
import { logger } from '@/services/logger';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { isConfigured } = useWooCommerceConfig();
  const { data: products = [], isLoading, error, refetch } = useProducts(currentPage, searchTerm, selectedStatus);
  const deleteProduct = useDeleteProduct();

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
    if (product.stock_quantity <= 5) {
      return { color: 'bg-yellow-100 text-yellow-800', text: `${product.stock_quantity} unidades` };
    }
    return { color: 'bg-success-100 text-success-800', text: `${product.stock_quantity} unidades` };
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
    setCurrentPage(1); // Reset para primeira página ao buscar
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Produtos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
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
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lista de Produtos {!isLoading && `(${products.length})`}
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
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0].src} 
                                alt={product.images[0].alt}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-slate-500">ID: {product.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {parseFloat(product.price || '0').toFixed(2)}
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
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação simples */}
      {!isLoading && products.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="px-4 py-2 text-sm">
            Página {currentPage}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={products.length < 20}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default Products;
