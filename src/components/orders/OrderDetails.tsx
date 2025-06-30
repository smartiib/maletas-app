
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, DollarSign, User, MapPin, CreditCard } from 'lucide-react';
import { Order } from '@/services/woocommerce';

interface OrderDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ open, onOpenChange, order }) => {
  if (!order) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Pedido #{order.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Basic Info */}
          <div className="flex flex-wrap gap-4 items-center">
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
            <div className="text-sm text-slate-600">
              ID: {order.id}
            </div>
            <div className="text-sm text-slate-600">
              Total: {order.currency} {parseFloat(order.total).toFixed(2)}
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Dados de Cobrança</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>{order.billing.first_name} {order.billing.last_name}</strong></p>
                    <p>{order.billing.email}</p>
                    {order.billing.phone && <p>{order.billing.phone}</p>}
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p>{order.billing.address_1}</p>
                        <p>{order.billing.city}, {order.billing.state}</p>
                        <p>{order.billing.postcode} - {order.billing.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados de Entrega</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>{order.shipping.first_name} {order.shipping.last_name}</strong></p>
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p>{order.shipping.address_1}</p>
                        <p>{order.shipping.city}, {order.shipping.state}</p>
                        <p>{order.shipping.postcode} - {order.shipping.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Método de Pagamento</label>
                  <p className="font-semibold">{order.payment_method_title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Total</label>
                  <p className="text-lg font-bold">{order.currency} {parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.line_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-600">Produto ID: {item.product_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Qtd: {item.quantity}</p>
                      <p className="text-sm">{order.currency} {parseFloat(item.total).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Data do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{new Date(order.date_created).toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetails;
