
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Users, ShoppingBag, Filter, Download, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useProducts, useOrders, useCustomers } from '@/hooks/useWooCommerce';
import ReportsKPI from '@/components/reports/ReportsKPI';

const Reports = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRepresentative, setSelectedRepresentative] = useState('all');

  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();

  // Mock data para representantes e vendas detalhadas
  const mockSalesData = [
    {
      id: 1,
      customer_name: 'Maria Santos',
      customer_email: 'maria@email.com',
      representative_name: 'João Silva',
      order_date: '2024-01-15',
      total_amount: 250.00,
      items_count: 3,
      source: 'maleta'
    },
    {
      id: 2,
      customer_name: 'Ana Costa',
      customer_email: 'ana@email.com',
      representative_name: 'Carla Oliveira',
      order_date: '2024-01-20',
      total_amount: 450.00,
      items_count: 5,
      source: 'loja'
    },
    {
      id: 3,
      customer_name: 'Julia Mendes',
      customer_email: 'julia@email.com',
      representative_name: 'João Silva',
      order_date: '2024-01-25',
      total_amount: 180.00,
      items_count: 2,
      source: 'maleta'
    },
    {
      id: 4,
      customer_name: 'Maria Santos',
      customer_email: 'maria@email.com',
      representative_name: 'João Silva',
      order_date: '2024-02-10',
      total_amount: 320.00,
      items_count: 4,
      source: 'loja'
    },
    {
      id: 5,
      customer_name: 'Fernanda Lima',
      customer_email: 'fernanda@email.com',
      representative_name: 'Ana Paula',
      order_date: '2024-02-15',
      total_amount: 780.00,
      items_count: 8,
      source: 'maleta'
    }
  ];

  const mockRepresentatives = [
    { id: 1, name: 'João Silva' },
    { id: 2, name: 'Carla Oliveira' },
    { id: 3, name: 'Ana Paula' }
  ];

  // Análises de vendas por cliente
  const customerAnalysis = useMemo(() => {
    const customerSales = mockSalesData.reduce((acc, sale) => {
      const key = sale.customer_email;
      if (!acc[key]) {
        acc[key] = {
          customer_name: sale.customer_name,
          customer_email: sale.customer_email,
          total_orders: 0,
          total_amount: 0,
          total_items: 0,
          last_purchase: sale.order_date,
          months_active: new Set()
        };
      }
      acc[key].total_orders += 1;
      acc[key].total_amount += sale.total_amount;
      acc[key].total_items += sale.items_count;
      acc[key].months_active.add(sale.order_date.substring(0, 7)); // YYYY-MM
      
      // Atualizar última compra se for mais recente
      if (new Date(sale.order_date) > new Date(acc[key].last_purchase)) {
        acc[key].last_purchase = sale.order_date;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(customerSales)
      .map((customer: any) => ({
        ...customer,
        months_active: customer.months_active.size,
        average_order: customer.total_amount / customer.total_orders
      }))
      .sort((a: any, b: any) => b.total_amount - a.total_amount);
  }, [mockSalesData]);

  // Análises de vendas por representante
  const representativeAnalysis = useMemo(() => {
    const repSales = mockSalesData.reduce((acc, sale) => {
      const key = sale.representative_name;
      if (!acc[key]) {
        acc[key] = {
          representative_name: sale.representative_name,
          total_orders: 0,
          total_amount: 0,
          total_items: 0,
          customers_count: new Set(),
          maleta_sales: 0,
          store_sales: 0
        };
      }
      acc[key].total_orders += 1;
      acc[key].total_amount += sale.total_amount;
      acc[key].total_items += sale.items_count;
      acc[key].customers_count.add(sale.customer_email);
      
      if (sale.source === 'maleta') {
        acc[key].maleta_sales += sale.total_amount;
      } else {
        acc[key].store_sales += sale.total_amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(repSales).map((rep: any) => ({
      ...rep,
      customers_count: rep.customers_count.size,
      average_order: rep.total_amount / rep.total_orders,
      maleta_percentage: (rep.maleta_sales / rep.total_amount) * 100
    })).sort((a: any, b: any) => b.total_amount - a.total_amount);
  }, [mockSalesData]);

  // Vendas por período
  const periodAnalysis = useMemo(() => {
    const periodSales = mockSalesData.reduce((acc, sale) => {
      const date = new Date(sale.order_date);
      let key = '';
      
      switch (selectedPeriod) {
        case 'day':
          key = sale.order_date;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = sale.order_date;
      }
      
      if (!acc[key]) {
        acc[key] = {
          period: key,
          total_orders: 0,
          total_amount: 0,
          total_items: 0,
          maleta_sales: 0,
          store_sales: 0
        };
      }
      acc[key].total_orders += 1;
      acc[key].total_amount += sale.total_amount;
      acc[key].total_items += sale.items_count;
      
      if (sale.source === 'maleta') {
        acc[key].maleta_sales += sale.total_amount;
      } else {
        acc[key].store_sales += sale.total_amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(periodSales).sort((a: any, b: any) => 
      new Date(b.period).getTime() - new Date(a.period).getTime()
    );
  }, [mockSalesData, selectedPeriod]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calcular métricas reais
  const totalRevenue = orders.reduce((total, order) => 
    total + parseFloat(order.total || '0'), 0
  );

  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const completedOrders = orders.filter(order => order.status === 'completed');
  const conversionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Vendas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análise detalhada de vendas e performance
          </p>
        </div>
      </div>

      {/* KPIs Overview */}
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Data Início</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Data Fim</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="representative">Representante</Label>
              <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {mockRepresentatives.map(rep => (
                    <SelectItem key={rep.id} value={rep.name}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos Originais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Lucro por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              vendas: { label: "Vendas", color: "#3B82F6" },
              lucro: { label: "Lucro", color: "#10B981" }
            }} className="h-[300px]">
              <BarChart data={[
                { name: 'Jan', vendas: 4000, lucro: 2400 },
                { name: 'Fev', vendas: 3000, lucro: 1398 },
                { name: 'Mar', vendas: 2000, lucro: 9800 },
                { name: 'Abr', vendas: 2780, lucro: 3908 },
                { name: 'Mai', vendas: 1890, lucro: 4800 },
                { name: 'Jun', vendas: 2390, lucro: 3800 },
              ]}>
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={products.slice(0, 5).map((product, index) => ({
                      name: product.name.substring(0, 15) + '...',
                      value: Math.max(5, 30 - index * 5),
                      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {products.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendência de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            vendas: { label: "Vendas", color: "#3B82F6" },
            lucro: { label: "Lucro", color: "#10B981" }
          }} className="h-[400px]">
            <LineChart data={[
              { name: 'Jan', vendas: 4000, lucro: 2400 },
              { name: 'Fev', vendas: 3000, lucro: 1398 },
              { name: 'Mar', vendas: 2000, lucro: 9800 },
              { name: 'Abr', vendas: 2780, lucro: 3908 },
              { name: 'Mai', vendas: 1890, lucro: 4800 },
              { name: 'Jun', vendas: 2390, lucro: 3800 },
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="vendas" stroke="var(--color-vendas)" strokeWidth={3} />
              <Line type="monotone" dataKey="lucro" stroke="var(--color-lucro)" strokeWidth={3} />
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
      {/* Análises Detalhadas */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers">Análise por Cliente</TabsTrigger>
          <TabsTrigger value="representatives">Análise por Representante</TabsTrigger>
          <TabsTrigger value="period">Análise por Período</TabsTrigger>
        </TabsList>

        {/* Vendas por Cliente */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Vendas por Cliente
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(customerAnalysis, 'vendas-por-cliente')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerAnalysis.slice(0, 10).map((customer: any, index) => (
                  <div key={customer.customer_email} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{customer.customer_name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.customer_email}</p>
                      </div>
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pedidos</p>
                        <p className="font-medium">{customer.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-medium text-success">R$ {customer.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ticket Médio</p>
                        <p className="font-medium">R$ {customer.average_order.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última Compra</p>
                        <p className="font-medium">{new Date(customer.last_purchase).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendas por Representante */}
        <TabsContent value="representatives">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance de Representantes
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(representativeAnalysis, 'representantes')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {representativeAnalysis.map((rep: any, index) => (
                  <div key={rep.representative_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{rep.representative_name}</h3>
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        Top {index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vendas Total</p>
                        <p className="font-medium text-success">R$ {rep.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pedidos</p>
                        <p className="font-medium">{rep.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clientes</p>
                        <p className="font-medium">{rep.customers_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">% Maletas</p>
                        <p className="font-medium text-orange-600">{rep.maleta_percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendas por Período */}
        <TabsContent value="period">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Vendas por {selectedPeriod === 'month' ? 'Mês' : 'Período'}
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => exportToCSV(periodAnalysis, 'vendas-periodo')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {periodAnalysis.map((period: any, index) => (
                  <div key={period.period} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {selectedPeriod === 'month' 
                          ? new Date(period.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                          : selectedPeriod === 'year'
                          ? period.period
                          : new Date(period.period).toLocaleDateString('pt-BR')
                        }
                      </h3>
                      <Badge variant="outline">
                        Período {index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Pedidos</p>
                        <p className="font-medium">{period.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-medium text-success">R$ {period.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Itens</p>
                        <p className="font-medium">{period.total_items}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vendas Maleta</p>
                        <p className="font-medium text-orange-600">R$ {period.maleta_sales.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vendas Loja</p>
                        <p className="font-medium text-blue-600">R$ {period.store_sales.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
