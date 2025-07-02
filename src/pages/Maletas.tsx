
import React, { useState, useMemo } from 'react';
import { Package, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMaletas, useExtendMaletaDeadline, useProcessMaletaReturn } from '@/hooks/useMaletas';
import { usePagination } from '@/hooks/usePagination';
import { useViewMode } from '@/hooks/useViewMode';
import PaginationControls from '@/components/ui/pagination-controls';
import MaletaStats from '@/components/maletas/MaletaStats';
import MaletaFilters from '@/components/maletas/MaletaFilters';
import MaletaCard from '@/components/maletas/MaletaCard';
import MaletaDialog from '@/components/maletas/MaletaDialog';

const Maletas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [representativeFilter, setRepresentativeFilter] = useState('');
  
  // Estados dos diálogos
  const [selectedMaleta, setSelectedMaleta] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [newMaletaDialogOpen, setNewMaletaDialogOpen] = useState(false);
  
  // Estados para formulários
  const [newReturnDate, setNewReturnDate] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const { data: allMaletas = [], isLoading, error } = useMaletas();
  const { viewMode, toggleViewMode } = useViewMode('maletas');
  const extendDeadline = useExtendMaletaDeadline();
  const processReturn = useProcessMaletaReturn();

  // Filter and paginate data
  const filteredMaletas = useMemo(() => {
    return allMaletas.filter(maleta => {
      const matchesSearch = maleta.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           maleta.representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           maleta.number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || maleta.status === statusFilter;
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

  // Handlers para ações das maletas
  const handleViewDetails = (maleta: any) => {
    setSelectedMaleta(maleta);
    setDetailsDialogOpen(true);
  };

  const handleExtendDeadline = (maleta: any) => {
    setSelectedMaleta(maleta);
    setExtendDialogOpen(true);
  };

  const handleProcessReturn = (maleta: any) => {
    setSelectedMaleta(maleta);
    setReturnDialogOpen(true);
  };

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
        <Button 
          className="bg-gradient-primary text-primary-foreground"
          onClick={() => setNewMaletaDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Maleta
        </Button>
      </div>

      {/* Stats Cards */}
      <MaletaStats stats={stats} />

      {/* Filtros e Controles */}
      <MaletaFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
      />

      {/* Lista/Grid de Maletas */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {paginatedMaletas.map(maleta => (
          <MaletaCard 
            key={maleta.id} 
            maleta={maleta} 
            viewMode={viewMode}
            onViewDetails={handleViewDetails}
            onExtendDeadline={handleExtendDeadline}
            onProcessReturn={handleProcessReturn}
          />
        ))}
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

      {/* Dialog para Detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Maleta</DialogTitle>
          </DialogHeader>
          {selectedMaleta && (
            <div className="space-y-4">
              <p><strong>Número:</strong> {selectedMaleta.number}</p>
              <p><strong>Representante:</strong> {selectedMaleta.representative_name}</p>
              <p><strong>Cliente:</strong> {selectedMaleta.customer_name}</p>
              <p><strong>Data de Devolução:</strong> {new Date(selectedMaleta.return_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Status:</strong> {selectedMaleta.status}</p>
              <p><strong>Valor Total:</strong> R$ {parseFloat(selectedMaleta.total_value || '0').toFixed(2)}</p>
              <p><strong>Itens:</strong> {selectedMaleta.items?.length || 0}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Estender Prazo */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Prazo da Maleta</DialogTitle>
          </DialogHeader>
          {selectedMaleta && (
            <div className="space-y-4">
              <p>Maleta: #{selectedMaleta.number}</p>
              <div className="space-y-2">
                <Label htmlFor="new-date">Nova Data de Devolução</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newReturnDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    if (newReturnDate) {
                      try {
                        await extendDeadline.mutateAsync({
                          id: selectedMaleta.id,
                          new_date: newReturnDate
                        });
                        setExtendDialogOpen(false);
                        setNewReturnDate('');
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Erro ao estender prazo",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  disabled={!newReturnDate || extendDeadline.isPending}
                >
                  {extendDeadline.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Processar Devolução */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Devolução</DialogTitle>
          </DialogHeader>
          {selectedMaleta && (
            <div className="space-y-4">
              <p>Maleta: #{selectedMaleta.number}</p>
              <div className="space-y-2">
                <Label htmlFor="return-notes">Observações da Devolução</Label>
                <Textarea
                  id="return-notes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Observações sobre a devolução..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await processReturn.mutateAsync({
                        id: selectedMaleta.id,
                        returnData: {
                          items_sold: [],
                          items_returned: [],
                          return_date: new Date().toISOString(),
                          delay_days: 0,
                          commission_amount: 0,
                          penalty_amount: 0,
                          final_amount: 0,
                          notes: returnNotes
                        }
                      });
                      setReturnDialogOpen(false);
                      setReturnNotes('');
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Erro ao processar devolução",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={processReturn.isPending}
                >
                  {processReturn.isPending ? 'Processando...' : 'Processar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Nova Maleta */}
      <MaletaDialog
        open={newMaletaDialogOpen}
        onOpenChange={setNewMaletaDialogOpen}
        cartItems={[]}
        onClearCart={() => {}}
      />
    </div>
  );
};

export default Maletas;
