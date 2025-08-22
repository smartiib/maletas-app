
import React from 'react';
import { Badge } from '@/components/ui/badge';

export type StockFilter = 'all' | 'stock-ok' | 'out-of-stock' | 'low-stock';

interface ProductStockFiltersProps {
  selectedFilter: StockFilter;
  onFilterChange: (filter: StockFilter) => void;
  counts: {
    all: number;
    stockOk: number;
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
    { 
      key: 'all' as StockFilter, 
      label: 'Todos', 
      count: counts.all,
      colorClasses: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    },
    { 
      key: 'stock-ok' as StockFilter, 
      label: 'Estoque OK', 
      count: counts.stockOk,
      colorClasses: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
    },
    { 
      key: 'low-stock' as StockFilter, 
      label: 'Estoque Baixo', 
      count: counts.lowStock,
      colorClasses: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
    },
    { 
      key: 'out-of-stock' as StockFilter, 
      label: 'Sem Estoque', 
      count: counts.outOfStock,
      colorClasses: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="outline"
          className={`cursor-pointer text-xs px-3 py-1.5 border transition-all duration-200 ${
            selectedFilter === filter.key 
              ? filter.colorClasses.replace('50', '100').replace('hover:bg-', 'bg-')
              : filter.colorClasses
          }`}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label} ({filter.count})
        </Badge>
      ))}
    </div>
  );
};
