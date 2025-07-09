
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Edit, Trash2, User, Mail, Phone, MapPin, AlertCircle, Eye, Crown, Package } from 'lucide-react';
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
import { useCustomers, useAllCustomers, useWooCommerceConfig, useUpdateCustomer } from '@/hooks/useWooCommerce';
import { useCreateRepresentative } from '@/hooks/useMaletas';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import ViewModeToggle from '@/components/ui/view-mode-toggle';
import { Customer } from '@/services/woocommerce';
import CustomerDialog from '@/components/customers/CustomerDialog';
import CustomerDetails from '@/components/customers/CustomerDetails';
import CreateMaletaFromCustomer from '@/components/maletas/CreateMaletaFromCustomer';
import CustomerCard from '@/components/customers/CustomerCard';
import { MoreHorizontal, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'representatives' | 'customers'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerForDetails, setCustomerForDetails] = useState<Customer | null>(null);

  const { isConfigured } = useWooCommerceConfig();
  const { data: allCustomers = [], isLoading, error, refetch } = useCustomers();
  const { data: allCustomersData = [] } = useAllCustomers();
  const updateCustomer = useUpdateCustomer();
  const { viewMode, toggleViewMode } = useViewMode('customers');
  const createRepresentative = useCreateRepresentative();

  // Filter and paginate data
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      const matchesSearch = customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'representatives' && isRepresentative(customer)) ||
                           (filterType === 'customers' && !isRepresentative(customer));
      
      return matchesSearch && matchesFilter;
    });
  }, [allCustomers, searchTerm, filterType]);

  // Use allCustomersData for calculations
  const allCustomersForCalculations = useMemo(() => {
    return allCustomersData.filter(customer => {
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'representatives' && isRepresentative(customer)) ||
                           (filterType === 'customers' && !isRepresentative(customer));
      
      return matchesFilter;
    });
  }, [allCustomersData, filterType]);

  const pagination = usePagination(filteredCustomers.length, 20);
  
  const paginatedCustomers = useMemo(() => {
    const start = (pagination.state.currentPage - 1) * pagination.state.itemsPerPage;
    const end = start + pagination.state.itemsPerPage;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, pagination.state.currentPage, pagination.state.itemsPerPage]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setCustomerForDetails(customer);
    setDetailsOpen(true);
  };

  const isRepresentative = (customer: Customer) => {
    return customer.meta_data?.some(meta => meta.key === 'is_representative' && (meta.value === true || meta.value === '1' || meta.value === 1));
  };

  const toggleRepresentative = async (customer: Customer) => {
    try {
      const isCurrentlyRepresentative = isRepresentative(customer);
      
      const updatedMetaData = customer.meta_data ? [...customer.meta_data] : [];
      
      // Encontrar ou criar o meta_data para is_representative
      const representativeMetaIndex = updatedMetaData.findIndex(meta => meta.key === 'is_representative');
      
      if (representativeMetaIndex >= 0) {
        updatedMetaData[representativeMetaIndex].value = !isCurrentlyRepresentative;
      } else {
        updatedMetaData.push({
          key: 'is_representative',
          value: !isCurrentlyRepresentative
        });
      }
      
      await updateCustomer.mutateAsync({
        id: customer.id,
        customer: {
          meta_data: updatedMetaData
        }
      });
      
      toast({
        title: !isCurrentlyRepresentative ? "Representante Adicionado" : "Representante Removido",
        description: `${customer.first_name} ${customer.last_name} ${!isCurrentlyRepresentative ? 'foi marcado como representante' : 'não é mais representante'}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do representante",
        variant: "destructive"
      });
    }
  };

  const syncRepresentatives = async () => {
    try {
      const representatives = allCustomers.filter(isRepresentative);
      
      if (representatives.length === 0) {
        toast({
          title: "Nenhum representante encontrado",
          description: "Marque clientes como representantes antes de sincronizar.",
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const customer of representatives) {
        try {
          const representativeData = {
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email || customer.billing.email,
            phone: customer.billing.phone,
            commission_settings: {
              use_global: true,
              penalty_rate: 1
            }
          };

          await createRepresentative.mutateAsync(representativeData);
          successCount++;
        } catch (error) {
          // Ignorar erro se representante já existe
          if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      toast({
        title: "Sincronização concluída",
        description: `${successCount} representantes sincronizados${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Erro ao sincronizar representantes com o sistema de maletas.",
        variant: "destructive"
      });
    }
  };

  const getTotalCustomers = () => allCustomersForCalculations.length;
  const getTotalRepresentatives = () => allCustomersForCalculations.filter(isRepresentative).length;
  const getAverageSpent = () => {
    if (allCustomersForCalculations.length === 0) return 0;
    const total = allCustomersForCalculations.reduce((sum: number, customer: Customer) => {
      const spent = parseFloat(customer.total_spent || '0');
      return sum + (isNaN(spent) ? 0 : spent);
    }, 0);
    return total / allCustomersForCalculations.length;
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Clientes
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie sua base de clientes
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">WooCommerce não configurado</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Configure sua integração com WooCommerce nas configurações para começar a gerenciar seus clientes.
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
            Clientes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie sua base de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-gradient-primary hover:opacity-90"
            onClick={handleCreateCustomer}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
          <Button
            variant="outline"
            onClick={syncRepresentatives}
            disabled={createRepresentative.isPending}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {createRepresentative.isPending ? 'Sincronizando...' : 'Sincronizar Representantes'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Clientes
                </p>
                <p className="text-2xl font-bold">{getTotalCustomers()}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Representantes
                </p>
                <p className="text-2xl font-bold text-purple-600">{getTotalRepresentatives()}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                 Total de Pedidos
                </p>
                 <p className="text-2xl font-bold text-success-600">
                   {allCustomersForCalculations.reduce((sum: number, customer: Customer) => sum + (customer.orders_count || 0), 0)}
                 </p>
              </div>
              <Package className="w-8 h-8 text-success-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {getAverageSpent().toFixed(2)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
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
                    placeholder="Buscar clientes por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="customers">Clientes</option>
                  <option value="representatives">Representantes</option>
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

      {/* Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Lista de Clientes {!isLoading && `(${filteredCustomers.length})`}
            {filterType === 'representatives' && ' - Representantes'}
            {filterType === 'customers' && ' - Apenas Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-500 mt-2">Carregando clientes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">Erro ao carregar clientes</p>
              <Button onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          ) : viewMode === 'list' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer: Customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {customer.first_name} {customer.last_name}
                            {isRepresentative(customer) && (
                              <Crown className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div className="text-sm text-slate-500">ID: {customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                        {customer.billing.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3" />
                            {customer.billing.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{customer.billing.city}, {customer.billing.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.orders_count} pedidos</div>
                        <div className="text-sm text-slate-500">
                          Último: {new Date(customer.date_created).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                     <TableCell className="font-semibold">
                       R$ {(parseFloat(customer.total_spent || '0') || 0).toFixed(2)}
                     </TableCell>
                    <TableCell>
                      {isRepresentative(customer) ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          <Crown className="w-3 h-3 mr-1" />
                          Representante
                        </Badge>
                      ) : (
                        <Badge variant="outline">Cliente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleRepresentative(customer)}>
                            <Crown className="w-4 h-4 mr-2" />
                            {isRepresentative(customer) ? 'Remover como Rep.' : 'Tornar Representante'}
                          </DropdownMenuItem>
                          {isRepresentative(customer) && (
                            <DropdownMenuItem asChild>
                              <CreateMaletaFromCustomer
                                representativeId={customer.id}
                                representativeName={`${customer.first_name} ${customer.last_name}`}
                              />
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {paginatedCustomers.map((customer: Customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  viewMode={viewMode}
                  onView={handleViewCustomer}
                  onEdit={handleEditCustomer}
                  onToggleRepresentative={toggleRepresentative}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {filteredCustomers.length > 0 && (
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
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        mode={dialogMode}
      />

      <CustomerDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        customer={customerForDetails}
      />
    </div>
  );
};

export default Customers;
