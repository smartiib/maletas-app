
import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import KPICard from '@/components/dashboard/KPICard';

const Dashboard = () => {
  const {
    salesToday,
    salesTrend,
    ordersCount,
    productsCount,
    customersCount,
    salesData,
    recentActivities,
    isLoading,
    error,
  } = useDashboardData();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* KPI Cards - Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <KPICard
          title="Vendas Hoje"
          value={formatCurrency(salesToday)}
          icon={TrendingUp}
          trend={`+${salesTrend.value}%`}
        />
        <KPICard
          title="Pedidos"
          value={ordersCount.toString()}
          icon={ShoppingCart}
          trend="+5%"
        />
        <KPICard
          title="Produtos"
          value={productsCount.toString()}
          icon={Package}
          trend="+2%"
        />
        <KPICard
          title="Clientes"
          value={customersCount.toString()}
          icon={Users}
          trend="+12%"
        />
      </div>

      {/* Charts and Activities - Mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-4">Vendas dos Últimos 7 Dias</h3>
          <SalesChart data={salesData} />
        </Card>

        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-4">Atividades Recentes</h3>
          <RecentActivity activities={recentActivities} />
        </Card>
      </div>

      {/* Quick Actions - Mobile friendly */}
      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Ações Rápidas</h3>
        <QuickActions />
      </Card>
    </div>
  );
};

export default Dashboard;
