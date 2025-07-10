
import React, { useState, useMemo } from 'react';
import { Package, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
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
import MaletaDetailsDialog from '@/components/maletas/MaletaDetailsDialog';
import MaletaReturnDialog from '@/components/maletas/MaletaReturnDialog';
import MaletaCheckoutDialog from '@/components/maletas/MaletaCheckoutDialog';
import { supabase } from '@/integrations/supabase/client';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';
// Removido import do pdfGenerator - agora usando pdfTemplates

const Maletas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [representativeFilter, setRepresentativeFilter] = useState('');
  
  // Estados dos diálogos
  const [selectedMaleta, setSelectedMaleta] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [newMaletaDialogOpen, setNewMaletaDialogOpen] = useState(false);
  const [soldItems, setSoldItems] = useState<any[]>([]);
  
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

  const handleGenerateRomaneio = async (maleta: any) => {
    try {
      console.log('Gerando PDF para maleta:', maleta.id);
      const { PdfTemplateService } = await import('@/services/pdfTemplates');
      const pdfData = await PdfTemplateService.generatePdf(maleta.id, 'romaneio');
      
      // Verificar se pdfData é um ArrayBuffer ou já um Blob
      let blob: Blob;
      if (pdfData instanceof ArrayBuffer) {
        blob = new Blob([pdfData], { type: 'application/pdf' });
      } else if (pdfData instanceof Uint8Array) {
        blob = new Blob([pdfData], { type: 'application/pdf' });
      } else {
        // Se for outro tipo, tentar converter
        blob = new Blob([pdfData], { type: 'application/pdf' });
      }
      
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Maleta-${maleta.number}-Romaneio.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Gerado",
        description: "Romaneio PDF foi gerado com sucesso!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: `Erro ao gerar romaneio PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  const handleOpenCheckout = (items: any[]) => {
    setSoldItems(items);
    setReturnDialogOpen(false);
    setCheckoutDialogOpen(true);
  };

  const handleOrderCreated = async (orderNumber: number, orderUrl: string) => {
    try {
      // Atualizar a maleta com as informações do pedido
      if (selectedMaleta) {
        const { error: updateError } = await supabase
          .from('maletas')
          .update({
            order_number: orderNumber,
            order_url: orderUrl
          })
          .eq('id', selectedMaleta.id);

        if (updateError) {
          console.error('Error updating maleta with order info:', updateError);
          throw updateError;
        }
      }

      // Processar a devolução automaticamente após criar o pedido
      if (selectedMaleta && soldItems.length > 0) {
        const returnData = {
          items_sold: soldItems.map(item => ({
            item_id: item.id,
            quantity_sold: item.quantity_sold
          })),
          items_returned: [], // Apenas itens vendidos, sem devolução
          return_date: new Date().toISOString(),
          delay_days: Math.max(0, Math.ceil((new Date().getTime() - new Date(selectedMaleta.return_date).getTime()) / (1000 * 60 * 60 * 24))),
          commission_amount: 0,
          penalty_amount: 0,
          final_amount: 0,
          notes: `Pedido #${orderNumber} criado com itens vendidos`
        };

        await processReturn.mutateAsync({
          id: selectedMaleta.id,
          returnData
        });
      }

      setReturnDialogOpen(false);
      setCheckoutDialogOpen(false);
      setSoldItems([]);
      
      const openOrderLink = () => {
        if (orderUrl) {
          window.open(orderUrl, '_blank', 'noopener,noreferrer');
        }
      };

      toast({
        title: "Devolução Processada",
        description: `Maleta finalizada com sucesso! Pedido #${orderNumber} criado para os itens vendidos.`,
        action: orderUrl ? (
          <ToastAction altText="Ver Pedido" onClick={openOrderLink}>
            Ver Pedido #{orderNumber}
          </ToastAction>
        ) : undefined,
      });
    } catch (error) {
      console.error('Error processing return after order creation:', error);
      toast({
        title: "Erro",
        description: "Pedido criado, mas erro ao processar devolução",
        variant: "destructive"
      });
    }
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
      {/* Ajuda da Página */}
      <PageHelp 
        title={helpContent.maletas.title}
        description={helpContent.maletas.description}
        helpContent={helpContent.maletas}
      />

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
            onGenerateRomaneio={handleGenerateRomaneio}
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
      <MaletaDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        maleta={selectedMaleta}
      />

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
      <MaletaReturnDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        maleta={selectedMaleta}
        onProcessReturn={async (returnData) => {
          try {
            await processReturn.mutateAsync({
              id: selectedMaleta.id,
              returnData
            });
            setReturnDialogOpen(false);
            toast({
              title: "Devolução Processada",
              description: "Devolução foi processada com sucesso!",
            });
          } catch (error) {
            console.error('Error processing return:', error);
            toast({
              title: "Erro",
              description: "Erro ao processar devolução",
              variant: "destructive"
            });
          }
        }}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* Dialog para Checkout de Itens Vendidos */}
      <MaletaCheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        maleta={selectedMaleta}
        soldItems={soldItems}
        onOrderCreated={handleOrderCreated}
      />

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
