import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Users, ShoppingBag, Filter, Download, BarChart3, Briefcase, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useReportsData } from '@/hooks/useReports';
import ReportsKPI from '@/components/reports/ReportsKPI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Reports = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRepresentative, setSelectedRepresentative] = useState('all');

  const { maletas, returns, representatives, maletaItems, orders } = useReportsData();

  // Filtrar dados por período se especificado
  const filteredMaletas = useMemo(() => {
    if (!dateFrom && !dateTo) return maletas;
    
    return maletas.filter(maleta => {
      const maletaDate = new Date(maleta.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      return maletaDate >= fromDate && maletaDate <= toDate;
    });
  }, [maletas, dateFrom, dateTo]);

  const filteredReturns = useMemo(() => {
    if (!dateFrom && !dateTo) return returns;
    
    return returns.filter(returnItem => {
      const returnDate = new Date(returnItem.return_date);
      const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      return returnDate >= fromDate && returnDate <= toDate;
    });
  }, [returns, dateFrom, dateTo]);

  // Análise de status das maletas
  const maletasStatusAnalysis = useMemo(() => {
    const statusCount = filteredMaletas.reduce((acc, maleta) => {
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

  // Análise por representante (incluindo pedidos)
  const representativeAnalysis = useMemo(() => {
    const repMap = representatives.reduce((acc, rep) => {
      acc[rep.id] = { ...rep, maletas: 0, returns: 0, totalValue: 0, commission: 0, orders: 0 };
      return acc;
    }, {} as Record<string, any>);

    filteredMaletas.forEach(maleta => {
      if (repMap[maleta.representative_id]) {
        repMap[maleta.representative_id].maletas += 1;
        repMap[maleta.representative_id].totalValue += Number(maleta.total_value) || 0;
      }
    });

    filteredReturns.forEach(returnItem => {
      const maleta = maletas.find(m => m.id === returnItem.maleta_id);
      if (maleta && repMap[maleta.representative_id]) {
        repMap[maleta.representative_id].returns += 1;
        repMap[maleta.representative_id].commission += Number(returnItem.commission_amount) || 0;
        repMap[maleta.representative_id].totalValue += Number(returnItem.final_amount) || 0;
      }
    });

    // Adicionar dados dos pedidos WooCommerce se disponível
    // Para isso, seria necessário mapear pedidos aos representantes
    // Por ora, vamos focar nos dados das maletas

    return Object.values(repMap).sort((a: any, b: any) => b.totalValue - a.totalValue);
  }, [representatives, filteredMaletas, filteredReturns, maletas]);

  // Análise de vendas por período
  const salesByPeriod = useMemo(() => {
    const periodMap = filteredReturns.reduce((acc, returnItem) => {
      const date = new Date(returnItem.return_date);
      let key = '';
      
      switch (selectedPeriod) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'month':
          key = format(date, 'yyyy-MM');
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
    );
  }, [filteredReturns, selectedPeriod]);

  // Métricas principais (incluindo pedidos WooCommerce)
  const totalSalesFromReturns = filteredReturns.reduce((sum, returnItem) => sum + (Number(returnItem.final_amount) || 0), 0);
  const totalSalesFromOrders = (orders || []).reduce((sum: number, order: any) => sum + (parseFloat(order.total || '0') || 0), 0);
  const totalSales = totalSalesFromReturns + totalSalesFromOrders;
  
  const totalCommission = filteredReturns.reduce((sum, returnItem) => sum + (Number(returnItem.commission_amount) || 0), 0);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Vendas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análise detalhada de maletas e vendas
          </p>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportsKPI
          title="Vendas Totais"
          value={`R$ ${totalSales.toFixed(2)}`}
          subtitle={`${filteredReturns.length} retornos`}
          icon={BarChart3}
          trend={{ value: 12.5, isPositive: true }}
        />

        <ReportsKPI
          title="Maletas Ativas"
          value={maletasStatusAnalysis.active.toString()}
          subtitle={`${maletasStatusAnalysis.total} total`}
          icon={Briefcase}
          trend={{ value: 8.2, isPositive: true }}
        />

        <ReportsKPI
          title="Ticket Médio"
          value={`R$ ${averageTicket.toFixed(2)}`}
          subtitle="Valor médio por venda"
          icon={TrendingUp}
          trend={{ value: 2.1, isPositive: false }}
        />

        <ReportsKPI
          title="Taxa Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          subtitle="Maletas → Vendas"
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
                  {representatives.map(rep => (
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Período */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              sales: { label: "Vendas", color: "#3B82F6" },
              commission: { label: "Comissão", color: "#10B981" }
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

        {/* Top Representantes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Representantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {representativeAnalysis.slice(0, 5).map((rep, index) => (
                <div key={rep.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{rep.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {rep.maletas} maletas • {rep.returns} retornos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R$ {rep.totalValue.toFixed(2)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Comissão: R$ {rep.commission.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Tabs defaultValue="representatives" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="representatives">Análise por Representante</TabsTrigger>
          <TabsTrigger value="period">Análise Temporal</TabsTrigger>
        </TabsList>

        <TabsContent value="representatives" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes dos Representantes</CardTitle>
              <Button 
                onClick={() => exportToCSV(representativeAnalysis, 'representantes')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Representante</th>
                      <th className="text-left p-2">Maletas</th>
                      <th className="text-left p-2">Retornos</th>
                      <th className="text-left p-2">Valor Total</th>
                      <th className="text-left p-2">Comissão</th>
                      <th className="text-left p-2">Taxa Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representativeAnalysis.map((rep) => (
                      <tr key={rep.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-2 font-medium">{rep.name}</td>
                        <td className="p-2">{rep.maletas}</td>
                        <td className="p-2">{rep.returns}</td>
                        <td className="p-2">R$ {rep.totalValue.toFixed(2)}</td>
                        <td className="p-2">R$ {rep.commission.toFixed(2)}</td>
                        <td className="p-2">
                          {rep.maletas > 0 ? ((rep.returns / rep.maletas) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="period" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendas por Período</CardTitle>
              <Button 
                onClick={() => exportToCSV(salesByPeriod, 'vendas-periodo')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Período</th>
                      <th className="text-left p-2">Retornos</th>
                      <th className="text-left p-2">Vendas</th>
                      <th className="text-left p-2">Comissão</th>
                      <th className="text-left p-2">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByPeriod.map((period) => (
                      <tr key={period.period} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-2 font-medium">{period.period}</td>
                        <td className="p-2">{period.returns}</td>
                        <td className="p-2">R$ {period.sales.toFixed(2)}</td>
                        <td className="p-2">R$ {period.commission.toFixed(2)}</td>
                        <td className="p-2">R$ {period.returns > 0 ? (period.sales / period.returns).toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;