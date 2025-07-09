
import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Plus, Truck, Package, User, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrders, useAllOrders, useWooCommerceConfig } from '@/hooks/useWooCommerce';
import { Order } from '@/services/woocommerce';
import OrderDialog from '@/components/orders/OrderDialog';
import OrderDetails from '@/components/orders/OrderDetails';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orderForDetails, setOrderForDetails] = useState<Order | null>(null);

  const { isConfigured } = useWooCommerceConfig();
  const { data: orders = [], isLoading, error, refetch } = useOrders(currentPage, selectedStatus);
  const { data: allOrders = [] } = useAllOrders();

  const statuses = ['', 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-success-100 text-success-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'on-hold': return 'Em Espera';
      case 'completed': return 'Completo';
      case 'cancelled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const handleCreateOrder = () => {
    // Redirecionar para POS ao invés de abrir dialog
    window.location.href = '/pos';
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setOrderForDetails(order);
    setDetailsOpen(true);
  };

  const getTotalOrders = () => allOrders.length;
  const getPendingOrders = () => allOrders.filter((o: Order) => o.status === 'pending').length;
  const getTotalRevenue = () => allOrders.reduce((sum: number, order: Order) => {
    const total = parseFloat(order.total || '0');
    return sum + (isNaN(total) ? 0 : total);
  }, 0);

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Pedidos
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie todos os pedidos da sua loja
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">WooCommerce não configurado</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Configure sua integração com WooCommerce nas configurações para começar a gerenciar seus pedidos.
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
            Pedidos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie todos os pedidos da sua loja
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={handleCreateOrder}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Pedidos
                </p>
                <p className="text-2xl font-bold">{getTotalOrders()}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pedidos Pendentes
                </p>
                <p className="text-2xl font-bold text-yellow-600">{getPendingOrders()}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Receita Total
                </p>
                <p className="text-2xl font-bold text-success-600">
                  R$ {getTotalRevenue().toFixed(2)}
                </p>
              </div>
              <Truck className="w-8 h-8 text-success-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar pedidos por cliente, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lista de Pedidos {!isLoading && `(${orders.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-500 mt-2">Carregando pedidos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">Erro ao carregar pedidos</p>
              <Button onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div>
                        <div className="font-medium">#{order.number}</div>
                        <div className="text-sm text-slate-500">{order.line_items.length} itens</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{order.billing.first_name} {order.billing.last_name}</div>
                          <div className="text-sm text-slate-500">{order.billing.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.currency} {(parseFloat(order.total || '0') || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.payment_method_title}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(order.date_created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {!isLoading && orders.length > 0 && (
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
            disabled={orders.length < 20}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
        mode={dialogMode}
      />

      <OrderDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={orderForDetails}
      />
    </div>
  );
};

export default Orders;
