import React from 'react';
import { Calendar, User, Package, CheckCircle, AlertTriangle, Clock, FileText, ShoppingCart, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maleta } from '@/services/maletas';
import { ViewMode } from '@/hooks/useViewMode';
// Removido import do pdfGenerator - agora usando pdfTemplates

interface MaletaCardProps {
  maleta: Maleta;
  viewMode: ViewMode;
  onViewDetails?: (maleta: Maleta) => void;
  onExtendDeadline?: (maleta: Maleta) => void;
  onProcessReturn?: (maleta: Maleta) => void;
  onGenerateRomaneio?: (maleta: Maleta) => void;
}

const MaletaCard: React.FC<MaletaCardProps> = ({ maleta, viewMode, onViewDetails, onExtendDeadline, onProcessReturn, onGenerateRomaneio }) => {
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

  const statusInfo = getStatusInfo(maleta);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover:shadow-md transition-all-smooth">
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
            
            {/* Informações do pedido quando a maleta estiver finalizada */}
            {maleta.status === 'finalized' && (maleta.order_number || maleta.order_url) && (
              <div className={viewMode === 'grid' ? 'mt-2 space-y-1' : 'mt-2'}>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    Pedido #{maleta.order_number}
                  </span>
                  {maleta.order_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-primary hover:text-primary/80"
                      onClick={() => window.open(maleta.order_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className={viewMode === 'grid' ? 'flex flex-col gap-2' : 'flex gap-2'}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails?.(maleta)}
            >
              Detalhes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onGenerateRomaneio?.(maleta)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Romaneio
            </Button>
            {maleta.status === 'active' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExtendDeadline?.(maleta)}
                >
                  Estender Prazo
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-success"
                  onClick={() => onProcessReturn?.(maleta)}
                >
                  Processar Devolução
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaletaCard;