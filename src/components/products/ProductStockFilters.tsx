
import React from 'react';
import { Badge } from '@/components/ui/badge';

export type StockFilter = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock';

interface ProductStockFiltersProps {
  selectedFilter: StockFilter;
  onFilterChange: (filter: StockFilter) => void;
  counts: {
    all: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
}

export const ProductStockFilters: React.FC<ProductStockFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  counts
}) => {
  const filters = [
    { key: 'all' as StockFilter, label: 'Todos', count: counts.all },
    { key: 'in-stock' as StockFilter, label: 'Em Estoque', count: counts.inStock },
    { key: 'low-stock' as StockFilter, label: 'Estoque Baixo', count: counts.lowStock },
    { key: 'out-of-stock' as StockFilter, label: 'Sem Estoque', count: counts.outOfStock },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant={selectedFilter === filter.key ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-1"
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label} ({filter.count})
        </Badge>
      ))}
    </div>
  );
};
