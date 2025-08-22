
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockHistoryService, StockHistoryEntry } from './StockHistoryService';

interface LastChangeLabelProps {
  productId: number;
  variationId?: number;
}

const formatRelative = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffInMinutes = Math.floor(diffMs / (1000 * 60));
  const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
};

export const LastChangeLabel: React.FC<LastChangeLabelProps> = ({ productId, variationId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-last-change', productId, variationId ?? null],
    queryFn: async (): Promise<StockHistoryEntry | null> => {
      const history = await stockHistoryService.getProductHistory(productId, variationId);
      return history[0] ?? null;
    },
    staleTime: 60_000,
  });

  if (isLoading) return <span>Carregando...</span>;
  if (!data) return <span>Nunca alterado</span>;
  return <span>{formatRelative(data.date)}</span>;
};

export default LastChangeLabel;
