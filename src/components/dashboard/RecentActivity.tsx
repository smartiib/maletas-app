import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  ShoppingCart, 
  User, 
  Package, 
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { LocalOrder, LocalProduct, LocalCustomer } from '@/types';

interface RecentActivityProps {
  orders: LocalOrder[];
  customers: LocalCustomer[];
  products: LocalProduct[];
}

const RecentActivity = ({ orders, customers, products }: RecentActivityProps) => {
  // Combinar e ordenar atividades recentes
  const getRecentActivities = () => {
    const activities: Array<{
      id: string;
      type: 'order' | 'customer' | 'product';
      date: string;
      title: string;
      subtitle: string;
      icon: React.ComponentType<any>;
      badge?: string;
      value?: string;
    }> = [];

    // Adicionar pedidos recentes
    orders.slice(0, 3).forEach(order => {
      const customerName = order.billing_address ? `${order.billing_address.first_name} ${order.billing_address.last_name}` : order.customer_name;
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        date: order.date_created || new Date().toISOString(),
        title: `Pedido #${order.order_number}`,
        subtitle: `Cliente: ${customerName}`,
        icon: ShoppingCart,
        badge: order.status,
        value: `R$ ${(typeof order.total === 'number' ? order.total : parseFloat(String(order.total) || '0')).toFixed(2)}`
      });
    });

    // Adicionar novos clientes
    customers.slice(0, 2).forEach(customer => {
      activities.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        date: customer.date_created || new Date().toISOString(),
        title: 'Novo Cliente',
        subtitle: `${customer.first_name} ${customer.last_name}`,
        icon: User,
        badge: 'novo'
      });
    });

    // Adicionar produtos recentes
    products.slice(0, 2).forEach(product => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product',
        date: product.date_created || new Date().toISOString(),
        title: 'Produto Cadastrado',
        subtitle: product.name,
        icon: Package,
        badge: product.stock_quantity !== undefined && product.stock_quantity < 10 ? 'estoque baixo' : 'ativo'
      });
    });

    // Ordenar por data mais recente
    return activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 6);
  };

  const activities = getRecentActivities();

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const getBadgeVariant = (type: string, badge?: string) => {
    if (type === 'order') {
      switch (badge) {
        case 'completed': return 'default';
        case 'processing': return 'secondary';
        case 'pending': return 'outline';
        default: return 'secondary';
      }
    }
    if (badge === 'estoque baixo') return 'destructive';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Atividade Recente
          </CardTitle>
          <Button variant="ghost" size="sm">
            Ver Todas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    {activity.badge && (
                      <Badge 
                        variant={getBadgeVariant(activity.type, activity.badge)}
                        className="text-xs"
                      >
                        {activity.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {activity.subtitle}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  {activity.value && (
                    <p className="text-sm font-medium text-success-600 mb-1">
                      {activity.value}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {getTimeAgo(activity.date)}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;