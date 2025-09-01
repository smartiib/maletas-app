
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, Plus, Search, TrendingDown } from 'lucide-react';
import { useStockAdjustments } from '@/hooks/useStockAdjustments';
import { useWooCommerceFilteredProducts } from '@/hooks/useWooCommerceFiltered';
import StockAdjustmentDialog from '@/components/stock/StockAdjustmentDialog';

const StockLossesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const { data: adjustments = [], isLoading } = useStockAdjustments();
  const { data: products = [] } = useWooCommerceFilteredProducts();

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || adjustment.adjustment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'perda': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'quebra': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'troca': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'devolucao': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'correcao': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'perda': return 'Perda';
      case 'quebra': return 'Quebra';
      case 'troca': return 'Troca';
      case 'devolucao': return 'Devolução';
      case 'correcao': return 'Correção';
      default: return type;
    }
  };

  const handleNewAdjustment = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentDialogOpen(true);
  };

  // Calcular estatísticas
  const totalLosses = adjustments
    .filter(adj => ['perda', 'quebra'].includes(adj.adjustment_type))
    .reduce((sum, adj) => sum + Math.abs(adj.quantity_adjusted), 0);

  const thisMonthLosses = adjustments
    .filter(adj => {
      const adjDate = new Date(adj.created_at);
      const now = new Date();
      return adjDate.getMonth() === now.getMonth() && 
             adjDate.getFullYear() === now.getFullYear() &&
             ['perda', 'quebra'].includes(adj.adjustment_type);
    })
    .reduce((sum, adj) => sum + Math.abs(adj.quantity_adjusted), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Controle de Perdas e Quebras</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Controle de Perdas e Quebras</h1>
        </div>
        <Button onClick={() => setAdjustmentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ajuste
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perdas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalLosses}</div>
            <p className="text-xs text-muted-foreground">
              Unidades perdidas/quebradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{thisMonthLosses}</div>
            <p className="text-xs text-muted-foreground">
              Perdas no mês atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ajustes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adjustments.length}</div>
            <p className="text-xs text-muted-foreground">
              Ajustes registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ajuste</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="quebra">Quebra</SelectItem>
                  <SelectItem value="troca">Troca</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                  <SelectItem value="correcao">Correção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Histórico de Ajustes
            <Badge variant="secondary" className="ml-2">
              {filteredAdjustments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAdjustments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum ajuste registrado
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.map((adjustment) => {
                  const product = products.find(p => p.id === adjustment.product_id);
                  return (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        {new Date(adjustment.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {product?.name || `Produto ID: ${adjustment.product_id}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {adjustment.quantity_before} → {adjustment.quantity_after}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(adjustment.adjustment_type)}>
                          {getTypeLabel(adjustment.adjustment_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={adjustment.quantity_adjusted < 0 ? 'text-red-600' : 'text-green-600'}>
                          {adjustment.quantity_adjusted > 0 ? '+' : ''}{adjustment.quantity_adjusted}
                        </span>
                      </TableCell>
                      <TableCell>{adjustment.reason}</TableCell>
                      <TableCell>{adjustment.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Ajuste */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
};

export default StockLossesPage;
