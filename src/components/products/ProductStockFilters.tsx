
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

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
    { 
      key: 'all' as StockFilter, 
      label: 'Todos', 
      count: counts.all,
      colorClass: 'text-blue-600 border-blue-300',
      selectedClass: 'bg-blue-500 text-white border-blue-500',
      iconBgClass: 'bg-blue-100'
    },
    { 
      key: 'in-stock' as StockFilter, 
      label: 'Estoque OK', 
      count: counts.inStock,
      colorClass: 'text-green-600 border-green-300',
      selectedClass: 'bg-green-500 text-white border-green-500',
      iconBgClass: 'bg-green-100'
    },
    { 
      key: 'low-stock' as StockFilter, 
      label: 'Estoque Baixo', 
      count: counts.lowStock,
      colorClass: 'text-yellow-600 border-yellow-300',
      selectedClass: 'bg-yellow-500 text-white border-yellow-500',
      iconBgClass: 'bg-yellow-100'
    },
    { 
      key: 'out-of-stock' as StockFilter, 
      label: 'Sem Estoque', 
      count: counts.outOfStock,
      colorClass: 'text-red-600 border-red-300',
      selectedClass: 'bg-red-500 text-white border-red-500',
      iconBgClass: 'bg-red-100'
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <div
          key={filter.key}
          className={`
            inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80
            ${selectedFilter === filter.key ? filter.selectedClass : `bg-white ${filter.colorClass}`}
          `}
          onClick={() => onFilterChange(filter.key)}
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 ${filter.iconBgClass}`}>
            <Package className="w-2.5 h-2.5" />
          </div>
          {filter.label} ({filter.count})
        </div>
      ))}
    </div>
  );
};
