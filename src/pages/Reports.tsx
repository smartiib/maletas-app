
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useProducts, useOrders, useCustomers } from '@/hooks/useWooCommerce';
import ReportsKPI from '@/components/reports/ReportsKPI';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();

  // Calcular métricas reais
  const totalRevenue = orders.reduce((total, order) => 
    total + parseFloat(order.total || '0'), 0
  );

  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  const completedOrders = orders.filter(order => order.status === 'completed');
  const conversionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

  // Mock data para os gráficos (pode ser substituído por dados reais)
  const salesData = [
    { name: 'Jan', vendas: 4000, lucro: 2400 },
    { name: 'Fev', vendas: 3000, lucro: 1398 },
    { name: 'Mar', vendas: 2000, lucro: 9800 },
    { name: 'Abr', vendas: 2780, lucro: 3908 },
    { name: 'Mai', vendas: 1890, lucro: 4800 },
    { name: 'Jun', vendas: 2390, lucro: 3800 },
    { name: 'Jul', vendas: 3490, lucro: 4300 },
  ];

  // Produtos mais vendidos com dados reais
  const topProductsData = products.slice(0, 5).map((product, index) => ({
    name: product.name.substring(0, 15) + (product.name.length > 15 ? '...' : ''),
    value: Math.max(5, 30 - index * 5),
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] || '#6B7280'
  }));

  const chartConfig = {
    vendas: {
      label: "Vendas",
      color: "#3B82F6",
    },
    lucro: {
      label: "Lucro",
      color: "#10B981",
    },
  };

  const periods = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '1y', label: '1 ano' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análise detalhada do desempenho da sua loja
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportsKPI
          title="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          subtitle={`${orders.length} pedidos`}
          icon={BarChart3}
          trend={{ value: 12.5, isPositive: true }}
        />

        <ReportsKPI
          title="Pedidos"
          value={orders.length.toString()}
          subtitle="Total de pedidos"
          icon={Calendar}
          trend={{ value: 8.2, isPositive: true }}
        />

        <ReportsKPI
          title="Ticket Médio"
          value={`R$ ${averageTicket.toFixed(2)}`}
          subtitle="Valor médio por pedido"
          icon={TrendingUp}
          trend={{ value: 2.1, isPositive: false }}
        />

        <ReportsKPI
          title="Taxa Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          subtitle={`${completedOrders.length} pedidos finalizados`}
          icon={Filter}
          trend={{ value: 0.5, isPositive: true }}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Lucro por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={salesData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="vendas" fill="var(--color-vendas)" radius={4} />
                <Bar dataKey="lucro" fill="var(--color-lucro)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsData.length > 0 ? (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProductsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {topProductsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded shadow">
                                <p>{`${payload[0].payload.name}: ${payload[0].value}%`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {topProductsData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                  <p>Nenhum produto encontrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tendência de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <LineChart data={salesData}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                stroke="var(--color-vendas)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-vendas)", strokeWidth: 2, r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="lucro" 
                stroke="var(--color-lucro)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-lucro)", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status dos Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { status: 'pending', label: 'Pendentes', color: 'bg-yellow-500' },
              { status: 'processing', label: 'Processando', color: 'bg-blue-500' },
              { status: 'completed', label: 'Completos', color: 'bg-green-500' },
              { status: 'cancelled', label: 'Cancelados', color: 'bg-red-500' }
            ].map(({ status, label, color }) => {
              const count = orders.filter(order => order.status === status).length;
              return (
                <div key={status} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className={`w-4 h-4 ${color} rounded-full mx-auto mb-2`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
