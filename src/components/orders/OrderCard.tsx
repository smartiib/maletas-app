import React from 'react';
import { Package, User, Calendar, Eye, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/services/woocommerce';
import { ViewMode } from '@/hooks/useViewMode';

interface OrderCardProps {
  order: Order;
  viewMode: ViewMode;
  onView?: (order: Order) => void;
  onEdit?: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  viewMode, 
  onView, 
  onEdit 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'processing': return 'bg-primary/10 text-primary border-primary/20';
      case 'on-hold': return 'bg-muted text-muted-foreground border-border';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'refunded': return 'bg-secondary text-secondary-foreground border-border';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
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

  return (
    <Card className="hover:shadow-md transition-all-smooth">
      <CardContent className="p-4">
        <div className={viewMode === 'grid' ? 'space-y-4' : 'flex items-center justify-between'}>
          <div className="flex-1">
            <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-4'}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Pedido #{order.number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.line_items.length} itens • {order.billing.first_name} {order.billing.last_name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 'space-y-2 mt-3' : 'flex items-center gap-6 ml-16'}>
              <div className="flex items-center gap-1 text-sm">
                <User className="w-3 h-3" />
                {order.billing.email}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-3 h-3" />
                {new Date(order.date_created).toLocaleDateString('pt-BR')}
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
              <span className="font-semibold">
                {order.currency} {parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? 'flex justify-end gap-2' : 'flex gap-2'}>
            <Button variant="ghost" size="sm" onClick={() => onView?.(order)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(order)}>
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;