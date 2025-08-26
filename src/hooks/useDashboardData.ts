
import { useState, useEffect } from 'react';

interface DashboardData {
  salesToday: number;
  salesTrend: { value: number; isPositive: boolean };
  ordersCount: number;
  productsCount: number;
  customersCount: number;
  salesData: Array<{ day: string; sales: number }>;
  recentActivities: Array<{ id: string; type: string; title: string; description: string; time: string }>;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    salesToday: 2500.50,
    salesTrend: { value: 12, isPositive: true },
    ordersCount: 15,
    productsCount: 124,
    customersCount: 89,
    salesData: [
      { day: 'Seg', sales: 1200 },
      { day: 'Ter', sales: 1800 },
      { day: 'Qua', sales: 1600 },
      { day: 'Qui', sales: 2200 },
      { day: 'Sex', sales: 2500 },
      { day: 'Sáb', sales: 1900 },
      { day: 'Dom', sales: 1400 },
    ],
    recentActivities: [
      { id: '1', type: 'order', title: 'Novo Pedido', description: 'Pedido #1234 recebido', time: '5 min atrás' },
      { id: '2', type: 'product', title: 'Produto Cadastrado', description: 'Produto XYZ adicionado', time: '15 min atrás' },
      { id: '3', type: 'customer', title: 'Novo Cliente', description: 'Cliente João Silva cadastrado', time: '30 min atrás' },
    ],
    isLoading: false,
    error: null,
  });

  return data;
}
