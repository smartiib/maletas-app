import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, DollarSign, Target, Download, ShoppingCart, Percent, Store, UserCheck, Filter } from 'lucide-react';
import { useReportsData } from '@/hooks/useReports';
import { useCustomerSalesReport } from '@/hooks/useCustomerSalesReport';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import ReportsKPI from '@/components/reports/ReportsKPI';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';

// Type interfaces for type safety
interface RepresentativeWithStats {
  id: string;
  name: string;
  totalMaletas: number;
  totalSales: number;
  totalReturns: number;
  conversionRate: number;
  totalValue: number;
  totalCommission: number;
  averageTicket: number;
}

interface PeriodData {
  period: string;
  sales: number;
  commission: number;
  returns: number;
}

const Reports = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedRepresentative, setSelectedRepresentative] = useState<string>('all');

  const { maletas, returns, representatives, maletaItems, orders } = useReportsData();
  const customerSalesReport = useCustomerSalesReport(dateFrom || undefined, dateTo || undefined);
  const salesComparison = useSalesComparison(12);

  // Filtrar dados por período se especificado
  const filteredMaletas = useMemo(() => {
    if (!dateFrom && !dateTo) return maletas;
    
    return maletas.filter((maleta: any) => {
      const maletaDate = new Date(maleta.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      return maletaDate >= fromDate && maletaDate <= toDate;
    });
  }, [maletas, dateFrom, dateTo]);

  const filteredReturns = useMemo(() => {
    if (!dateFrom && !dateTo) return returns;
    
    return returns.filter((returnItem: any) => {
      const returnDate = new Date(returnItem.return_date);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      return returnDate >= fromDate && returnDate <= toDate;
    });
  }, [returns, dateFrom, dateTo]);

  // Análise de status das maletas
  const maletasStatusAnalysis = useMemo(() => {
    const statusCount = filteredMaletas.reduce((acc: any, maleta: any) => {
      acc[maleta.status] = (acc[maleta.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: filteredMaletas.length,
      active: statusCount.active || 0,
      returned: statusCount.returned || 0,
      extended: statusCount.extended || 0,
      completed: statusCount.completed || 0
    };
  }, [filteredMaletas]);

  // Análise por representante
  const representativeAnalysis = useMemo(() => {
    const repMap = representatives.reduce((acc: any, rep: any) => {
      acc[rep.id] = { 
        ...rep, 
        totalMaletas: 0, 
        totalSales: 0, 
        totalReturns: 0,
        totalValue: 0, 
        totalCommission: 0,
        averageTicket: 0,
        conversionRate: 0
      };
      return acc;
    }, {} as Record<string, any>);

    filteredMaletas.forEach((maleta: any) => {
      if (repMap[maleta.representative_id]) {
        repMap[maleta.representative_id].totalMaletas += 1;
      }
    });

    filteredReturns.forEach((returnItem: any) => {
      const maleta = maletas.find((m: any) => m.id === returnItem.maleta_id);
      if (maleta && repMap[maleta.representative_id]) {
        repMap[maleta.representative_id].totalReturns += 1;
        repMap[maleta.representative_id].totalSales += 1;
        repMap[maleta.representative_id].totalCommission += Number(returnItem.commission_amount) || 0;
        repMap[maleta.representative_id].totalValue += Number(returnItem.final_amount) || 0;
      }
    });

    // Calcular métricas finais
    Object.values(repMap).forEach((rep: any) => {
      rep.conversionRate = rep.totalMaletas > 0 ? (rep.totalReturns / rep.totalMaletas) * 100 : 0;
      rep.averageTicket = rep.totalReturns > 0 ? rep.totalValue / rep.totalReturns : 0;
    });

    return Object.values(repMap).sort((a: any, b: any) => b.totalValue - a.totalValue) as RepresentativeWithStats[];
  }, [representatives, filteredMaletas, filteredReturns, maletas]);

  // Análise de vendas por período
  const salesByPeriod = useMemo(() => {
    const periodMap = filteredReturns.reduce((acc: any, returnItem: any) => {
      const date = new Date(returnItem.return_date);
      let key = '';
      
      switch (selectedPeriod) {
        case 'week':
          key = format(date, 'yyyy-\'W\'w', { locale: ptBR });
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        case 'quarter':
          key = format(date, 'yyyy-\'Q\'Q');
          break;
        case 'year':
          key = format(date, 'yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM');
      }
      
      if (!acc[key]) {
        acc[key] = {
          period: key,
          sales: 0,
          commission: 0,
          returns: 0
        };
      }
      
      acc[key].sales += Number(returnItem.final_amount) || 0;
      acc[key].commission += Number(returnItem.commission_amount) || 0;
      acc[key].returns += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(periodMap).sort((a: any, b: any) => 
      new Date(b.period).getTime() - new Date(a.period).getTime()
    ) as PeriodData[];
  }, [filteredReturns, selectedPeriod]);

  // Métricas principais
  const totalSalesFromReturns = filteredReturns.reduce((sum: number, returnItem: any) => sum + (Number(returnItem.final_amount) || 0), 0);
  const totalSalesFromOrders = (orders || []).reduce((sum: number, order: any) => sum + (parseFloat(order.total || '0') || 0), 0);
  const totalSales = totalSalesFromReturns + totalSalesFromOrders;
  
  const totalCommission = filteredReturns.reduce((sum: number, returnItem: any) => sum + (Number(returnItem.commission_amount) || 0), 0);
  const totalTransactions = filteredReturns.length + (orders || []).length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const conversionRate = filteredMaletas.length > 0 ? (filteredReturns.length / filteredMaletas.length) * 100 : 0;

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

  return (
    <div className="space-y-6">
      <PageHelp 
        title={helpContent.relatorios.title}
        description={helpContent.relatorios.description}
        helpContent={helpContent.relatorios}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Vendas</h1>
          <p className="text-muted-foreground">
            Análise completa de vendas, clientes e representantes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <ReportsKPI
          title="Total de Vendas"
          value={`R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${filteredReturns.length + (orders?.length || 0)} pedidos`}
          icon={DollarSign}
        />
        <ReportsKPI
          title="Vendas Loja"
          value={`R$ ${(orders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${orders?.length || 0} pedidos online`}
          icon={Store}
        />
        <ReportsKPI
          title="Vendas Representantes"
          value={`R$ ${filteredReturns.reduce((sum, ret) => sum + (ret.final_amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${filteredReturns.length} vendas diretas`}
          icon={UserCheck}
        />
        <ReportsKPI
          title="Comissões Pagas"
          value={`R$ ${totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${filteredReturns.length} vendas`}
          icon={Percent}
        />
        <ReportsKPI
          title="Ticket Médio"
          value={`R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Por pedido"
          icon={Target}
        />
      </div>

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
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="quarter">Trimestral</SelectItem>
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
                  {representatives.map((rep: any) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              sales: { label: "Vendas", color: "hsl(var(--primary))" },
              commission: { label: "Comissão", color: "hsl(var(--secondary))" }
            }} className="h-[300px]">
              <BarChart data={salesByPeriod.slice(0, 12)}>
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                <Bar dataKey="commission" fill="var(--color-commission)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Representantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {representativeAnalysis.slice(0, 5).map((rep, index) => (
                <div key={rep.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{rep.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rep.totalMaletas} maletas • {rep.totalReturns} retornos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R$ {rep.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-muted-foreground">
                      Comissão: R$ {rep.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="representatives" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="representatives">Representantes</TabsTrigger>
          <TabsTrigger value="customers">Vendas por Cliente</TabsTrigger>
          <TabsTrigger value="comparison">Loja vs Representantes</TabsTrigger>
          <TabsTrigger value="temporal">Análise Temporal</TabsTrigger>
        </TabsList>

        <TabsContent value="representatives" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Análise Detalhada por Representante</h3>
            <Button onClick={() => exportToCSV(representativeAnalysis, 'analise-representantes')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Representante</TableHead>
                  <TableHead>Maletas</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Retornos</TableHead>
                  <TableHead>Taxa Conversão</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {representativeAnalysis.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.totalMaletas}</TableCell>
                    <TableCell>{rep.totalSales}</TableCell>
                    <TableCell>{rep.totalReturns}</TableCell>
                    <TableCell>
                      <Badge variant={rep.conversionRate >= 70 ? "default" : rep.conversionRate >= 50 ? "secondary" : "destructive"}>
                        {rep.conversionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {rep.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {rep.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {rep.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Ranking de Clientes por Volume de Vendas</h3>
            <Button 
              onClick={() => customerSalesReport.data && exportToCSV(customerSalesReport.data, 'vendas-por-cliente')}
              disabled={!customerSalesReport.data}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {customerSalesReport.isLoading ? (
            <div className="text-center py-8">Carregando dados dos clientes...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Pedidos</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead>Loja Online</TableHead>
                    <TableHead>Maletas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSalesReport.data?.slice(0, 50).map((customer, index) => (
                    <TableRow key={`${customer.customer_id}-${index}`}>
                      <TableCell className="font-medium">{customer.customer_name}</TableCell>
                      <TableCell>{customer.customer_email}</TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>R$ {customer.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>R$ {customer.average_order_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{customer.last_order_date ? format(parseISO(customer.last_order_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={customer.wc_orders > 0 ? "default" : "secondary"}>
                          {customer.wc_orders}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.maleta_purchases > 0 ? "default" : "secondary"}>
                          {customer.maleta_purchases}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Comparativo: Loja Online vs Representantes</h3>
            <Button 
              onClick={() => salesComparison.data && exportToCSV(salesComparison.data, 'comparativo-vendas')}
              disabled={!salesComparison.data}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {salesComparison.isLoading ? (
            <div className="text-center py-8">Carregando dados comparativos...</div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Vendas: Loja vs Representantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    store_sales: { label: "Vendas Loja", color: "hsl(var(--primary))" },
                    representative_sales: { label: "Vendas Representantes", color: "hsl(var(--secondary))" },
                    total_sales: { label: "Total", color: "hsl(var(--accent))" }
                  }} className="h-80">
                    <ComposedChart data={salesComparison.data}>
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="store_sales" fill="var(--color-store_sales)" name="Vendas Loja" />
                      <Bar dataKey="representative_sales" fill="var(--color-representative_sales)" name="Vendas Representantes" />
                      <Line type="monotone" dataKey="total_sales" stroke="var(--color-total_sales)" name="Total" strokeWidth={3} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Vendas Loja</TableHead>
                      <TableHead>Vendas Representantes</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Ticket Médio Loja</TableHead>
                      <TableHead>Ticket Médio Rep.</TableHead>
                      <TableHead>Comissões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesComparison.data?.map((period) => (
                      <TableRow key={period.period}>
                        <TableCell className="font-medium">{period.period}</TableCell>
                        <TableCell>R$ {period.store_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {period.representative_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-bold">R$ {period.total_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {period.store_avg_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {period.representative_avg_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {period.commission_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Análise Temporal de Vendas</h3>
            <Button onClick={() => exportToCSV(salesByPeriod, 'analise-temporal')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Retornos</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByPeriod.map((period) => (
                  <TableRow key={period.period}>
                    <TableCell className="font-medium">{period.period}</TableCell>
                    <TableCell>{period.returns}</TableCell>
                    <TableCell>R$ {period.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {period.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {period.returns > 0 ? (period.sales / period.returns).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;