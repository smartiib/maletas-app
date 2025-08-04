import React from 'react';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Activity, Zap } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabaseProducts, useSupabaseAllOrders, useSupabaseAllCustomers } from '@/hooks/useSupabaseSync';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';
const Dashboard = () => {
  const {
    data: productsData
  } = useSupabaseProducts(1, '', '', '');
  const products = productsData?.products || [];
  const {
    data: orders = []
  } = useSupabaseAllOrders('', 'all');
  const {
    data: customers = []
  } = useSupabaseAllCustomers();

  // Calcular métricas da semana
  const weekOrders = orders.filter(order => {
    const orderDate = new Date(order.date_created);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  });
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.date_created);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  const pendingOrders = orders.filter(order => ['pending', 'processing', 'on-hold'].includes(order.status));
  const lowStockProducts = products.filter(product => product.stock_quantity !== undefined && product.stock_quantity < 10);
  const todaySales = todayOrders.reduce((total, order) => total + parseFloat(order.total?.toString() || '0'), 0);
  const weekCustomers = customers.filter(customer => {
    const customerDate = new Date(customer.date_created);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return customerDate >= weekAgo;
  });
  const weekSales = weekOrders.reduce((total, order) => total + parseFloat(order.total?.toString() || '0'), 0);
  const kpis = [{
    title: 'Vendas da Semana',
    value: `R$ ${weekSales.toFixed(2)}`,
    subtitle: `${weekOrders.length} transações`,
    icon: DollarSign,
    trend: {
      value: 12,
      isPositive: true
    }
  }, {
    title: 'Pedidos Pendentes',
    value: pendingOrders.length.toString(),
    subtitle: 'Aguardando processamento',
    icon: ShoppingCart,
    trend: {
      value: 8,
      isPositive: false
    }
  }, {
    title: 'Produtos em Falta',
    value: lowStockProducts.length.toString(),
    subtitle: 'Necessário reposição',
    icon: Package,
    trend: {
      value: 15,
      isPositive: false
    }
  }, {
    title: 'Novos Clientes',
    value: weekCustomers.length.toString(),
    subtitle: 'Cadastrados na semana',
    icon: Users,
    trend: {
      value: 25,
      isPositive: true
    }
  }];

  // Produtos mais vendidos (mock data por enquanto)
  const topProducts = products.slice(0, 4).map((product, index) => ({
    name: product.name,
    sales: 45 - index * 8
  }));
  return <div className="space-y-6">
      {/* Ajuda da Página */}
      <PageHelp 
        title={helpContent.dashboard.title}
        description={helpContent.dashboard.description}
        helpContent={helpContent.dashboard}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Visão geral das suas vendas e operações
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Relatório Completo
          </Button>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90" onClick={() => window.location.href = '/pos'}>
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => <KPICard key={index} {...kpi} className="animate-fade-in" style={{
        animationDelay: `${index * 100}ms`
      }} />)}
      </div>

      {/* Alertas */}
      {(lowStockProducts.length > 0 || pendingOrders.length > 0) && <Card className="border-warning-200 dark:border-warning-800 bg-gradient-to-r from-warning-50 to-orange-50 dark:from-warning-900/20 dark:to-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-warning-700 dark:text-warning-300">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {lowStockProducts.length > 0 && <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span>{lowStockProducts.length} produtos com estoque baixo</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/produtos'}>
                    Ver Produtos
                  </Button>
                </div>}
              {pendingOrders.length > 0 && <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span>{pendingOrders.length} pedidos pendentes</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/pedidos'}>
                    Ver Pedidos
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>}

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart orders={orders as any} />
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.length > 0 ? topProducts.map((produto, index) => <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <span className="font-medium truncate">{produto.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {produto.sales} vendas
                    </span>
                    <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary rounded-full" style={{
                    width: `${produto.sales / 45 * 100}%`
                  }} />
                    </div>
                  </div>
                </div>) : <div className="text-center py-8 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhum produto encontrado</p>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity orders={orders as any} customers={customers as any} products={products as any} />
        </div>
        <QuickActions />
      </div>
    </div>;
};
export default Dashboard;