
import React, { useState, useMemo } from 'react';
import { Search, Package, Calendar, User, AlertTriangle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaletas } from '@/hooks/useMaletas';
import { Maleta } from '@/services/maletas';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import ViewModeToggle from '@/components/ui/view-mode-toggle';

const Maletas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [representativeFilter, setRepresentativeFilter] = useState('');

  const { data: allMaletas = [], isLoading, error } = useMaletas();
  const { viewMode, toggleViewMode } = useViewMode('maletas');

  // Filter and paginate data
  const filteredMaletas = useMemo(() => {
    return allMaletas.filter(maleta => {
      const matchesSearch = maleta.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           maleta.representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           maleta.number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || maleta.status === statusFilter;
      const matchesRepresentative = !representativeFilter || maleta.representative_id?.toString() === representativeFilter;
      
      return matchesSearch && matchesStatus && matchesRepresentative;
    });
  }, [allMaletas, searchTerm, statusFilter, representativeFilter]);

  const pagination = usePagination(filteredMaletas.length, 20);
  
  const paginatedMaletas = useMemo(() => {
    const start = (pagination.state.currentPage - 1) * pagination.state.itemsPerPage;
    const end = start + pagination.state.itemsPerPage;
    return filteredMaletas.slice(start, end);
  }, [filteredMaletas, pagination.state.currentPage, pagination.state.itemsPerPage]);

  const getStatusInfo = (maleta: Maleta) => {
    try {
      const today = new Date();
      const returnDate = new Date(maleta.return_date);
      
      if (isNaN(returnDate.getTime())) {
        return { label: 'Data inválida', variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' };
      }
      
      const daysUntilReturn = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (maleta.status === 'finalized') {
        return { label: 'Finalizada', variant: 'default' as const, icon: CheckCircle, color: 'text-success' };
      }
      
      if (daysUntilReturn < 0) {
        return { label: 'Vencida', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-destructive' };
      }
      
      if (daysUntilReturn <= 3) {
        return { label: 'Próxima ao vencimento', variant: 'secondary' as const, icon: Clock, color: 'text-warning' };
      }
      
      return { label: 'Ativa', variant: 'outline' as const, icon: Package, color: 'text-success' };
    } catch (error) {
      return { label: 'Erro', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-muted-foreground' };
    }
  };

  const getTotalStats = () => {
    const stats = {
      total: filteredMaletas.length,
      active: 0,
      expired: 0,
      nearExpiry: 0,
      finalized: 0,
      totalValue: 0
    };

    const today = new Date();
    
    filteredMaletas.forEach(maleta => {
      try {
        const returnDate = new Date(maleta.return_date);
        if (!isNaN(returnDate.getTime())) {
          const daysUntilReturn = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          stats.totalValue += parseFloat(maleta.total_value || '0');
          
          if (maleta.status === 'finalized') {
            stats.finalized++;
          } else if (daysUntilReturn < 0) {
            stats.expired++;
          } else if (daysUntilReturn <= 3) {
            stats.nearExpiry++;
          } else {
            stats.active++;
          }
        }
      } catch (error) {
        console.warn('Erro ao processar maleta:', maleta.id, error);
      }
    });

    return stats;
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
          <p>Carregando maletas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar maletas</p>
          <p className="text-sm text-slate-500">Verifique a configuração do sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Maletas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie suas maletas de consignação
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nova Maleta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Próx. Vencimento</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.nearExpiry}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Valor Total</p>
                <p className="text-lg font-bold">R$ {stats.totalValue.toFixed(2)}</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, representante ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="expired">Vencidas</SelectItem>
                <SelectItem value="finalized">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ViewModeToggle 
            viewMode={viewMode} 
            onToggle={toggleViewMode} 
          />
        </div>
      </div>

      {/* Lista/Grid de Maletas */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {paginatedMaletas.map(maleta => {
          const statusInfo = getStatusInfo(maleta);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={maleta.id} className="hover:shadow-md transition-all-smooth">
              <CardContent className="p-6">
                <div className={viewMode === 'grid' ? 'space-y-4' : 'flex items-center justify-between'}>
                  <div className="flex-1">
                    <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-4 mb-3'}>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Maleta #{maleta.number}
                        </h3>
                        <div className={viewMode === 'grid' ? 'space-y-2 mt-2' : 'flex items-center gap-4 text-sm text-muted-foreground'}>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {maleta.customer_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {maleta.representative_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Devolução: {new Date(maleta.return_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={viewMode === 'grid' ? 'space-y-2' : 'flex items-center gap-4'}>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {maleta.items?.length || 0} itens
                      </span>
                      <span className="font-semibold">
                        R$ {parseFloat(maleta.total_value || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={viewMode === 'grid' ? 'flex flex-col gap-2' : 'flex gap-2'}>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                    {maleta.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm">
                          Estender Prazo
                        </Button>
                        <Button size="sm" className="bg-gradient-success">
                          Processar Devolução
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Paginação */}
      {filteredMaletas.length > 0 && (
        <PaginationControls
          info={pagination.info}
          actions={pagination.actions}
          itemsPerPage={pagination.state.itemsPerPage}
          totalItems={pagination.state.totalItems}
          currentPage={pagination.state.currentPage}
          className="mt-6"
        />
      )}

      {paginatedMaletas.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma maleta encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter 
              ? "Tente ajustar os filtros de busca"
              : "Crie sua primeira maleta de consignação"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Maletas;
