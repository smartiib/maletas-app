
import React, { useState } from 'react';
import { Search, Package, Calendar, User, AlertTriangle, CheckCircle, Clock, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaletas } from '@/hooks/useMaletas';
import { Maleta } from '@/services/maletas';
import { format, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Maletas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [representativeFilter, setRepresentativeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: maletas = [], isLoading, error } = useMaletas(currentPage, statusFilter);

  const filteredMaletas = maletas.filter(maleta => {
    const matchesSearch = maleta.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maleta.representative_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maleta.number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRepresentative = !representativeFilter || maleta.representative_id.toString() === representativeFilter;
    
    return matchesSearch && matchesRepresentative;
  });

  const getStatusInfo = (maleta: Maleta) => {
    const today = new Date();
    const returnDate = new Date(maleta.return_date);
    const daysUntilReturn = differenceInDays(returnDate, today);
    
    if (maleta.status === 'finalized') {
      return { label: 'Finalizada', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
    }
    
    if (isAfter(today, returnDate)) {
      return { label: 'Vencida', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' };
    }
    
    if (daysUntilReturn <= 3) {
      return { label: 'Próxima ao vencimento', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' };
    }
    
    return { label: 'Ativa', variant: 'outline' as const, icon: Package, color: 'text-green-600' };
  };

  const getTotalStats = () => {
    const stats = {
      total: maletas.length,
      active: 0,
      expired: 0,
      nearExpiry: 0,
      finalized: 0,
      totalValue: 0
    };

    const today = new Date();
    
    maletas.forEach(maleta => {
      const returnDate = new Date(maleta.return_date);
      const daysUntilReturn = differenceInDays(returnDate, today);
      
      stats.totalValue += parseFloat(maleta.total_value);
      
      if (maleta.status === 'finalized') {
        stats.finalized++;
      } else if (isAfter(today, returnDate)) {
        stats.expired++;
      } else if (daysUntilReturn <= 3) {
        stats.nearExpiry++;
      } else {
        stats.active++;
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
        <Button className="bg-gradient-primary">
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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

      {/* Lista de Maletas */}
      <div className="grid gap-4">
        {filteredMaletas.map(maleta => {
          const statusInfo = getStatusInfo(maleta);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={maleta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Maleta #{maleta.number}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
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
                            Devolução: {format(new Date(maleta.return_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {maleta.items.length} itens
                      </span>
                      <span className="font-semibold">
                        R$ {parseFloat(maleta.total_value).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
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

      {filteredMaletas.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma maleta encontrada</h3>
          <p className="text-slate-600">
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
