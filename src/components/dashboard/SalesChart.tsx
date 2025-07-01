import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Order } from '@/services/woocommerce';

interface SalesChartProps {
  orders: Order[];
}

const SalesChart = ({ orders }: SalesChartProps) => {
  // Processar dados dos últimos 7 dias
  const processChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.date_created);
        return orderDate.toDateString() === date.toDateString();
      });

      const totalSales = dayOrders.reduce((sum, order) => 
        sum + parseFloat(order.total || '0'), 0
      );

      return {
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        sales: totalSales,
        orders: dayOrders.length
      };
    });
  };

  const chartData = processChartData();
  const totalWeekSales = chartData.reduce((sum, day) => sum + day.sales, 0);
  const totalWeekOrders = chartData.reduce((sum, day) => sum + day.orders, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{`${label} - ${data.fullDate}`}</p>
          <p className="text-primary">
            Vendas: <span className="font-bold">R$ {data.sales.toFixed(2)}</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Pedidos: <span className="font-medium">{data.orders}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Vendas dos Últimos 7 Dias
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total da Semana</p>
            <p className="text-lg font-bold text-primary">R$ {totalWeekSales.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-xs"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalWeekOrders}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Pedidos Totais</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {totalWeekOrders > 0 ? (totalWeekSales / totalWeekOrders).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Ticket Médio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;