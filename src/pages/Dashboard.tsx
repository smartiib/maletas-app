
import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  // Mock data - em produção viria da API WooCommerce
  const kpis = [
    {
      title: 'Vendas Hoje',
      value: 'R$ 12.450',
      subtitle: '45 transações',
      icon: DollarSign,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Pedidos Pendentes',
      value: '23',
      subtitle: 'Aguardando processamento',
      icon: ShoppingCart,
      trend: { value: 8, isPositive: false }
    },
    {
      title: 'Produtos em Falta',
      value: '12',
      subtitle: 'Necessário reposição',
      icon: Package,
      trend: { value: 15, isPositive: false }
    },
    {
      title: 'Novos Clientes',
      value: '34',
      subtitle: 'Cadastrados hoje',
      icon: Users,
      trend: { value: 25, isPositive: true }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
          <Button size="sm" className="bg-gradient-primary hover:opacity-90">
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            {...kpi}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>

      {/* Alertas */}
      <Card className="border-warning-200 dark:border-warning-800 bg-gradient-to-r from-warning-50 to-orange-50 dark:from-warning-900/20 dark:to-orange-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-warning-700 dark:text-warning-300">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
              <span>12 produtos com estoque baixo</span>
              <Button variant="outline" size="sm">Ver Produtos</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
              <span>5 pedidos aguardando há mais de 2 dias</span>
              <Button variant="outline" size="sm">Ver Pedidos</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">Gráfico será implementado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Produto A', 'Produto B', 'Produto C', 'Produto D'].map((produto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="font-medium">{produto}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {45 - index * 8} vendas
                    </span>
                    <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full"
                        style={{ width: `${(45 - index * 8) / 45 * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
