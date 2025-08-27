
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';

export type ReviewFilter = 'all' | 'normal' | 'em-revisao' | 'nao-alterar';

interface ProductReviewFiltersProps {
  selectedFilter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  counts: {
    all: number;
    normal: number;
    emRevisao: number;
    naoAlterar: number;
  };
}

export const ProductReviewFilters: React.FC<ProductReviewFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  counts
}) => {
  const filters = [
    { 
      key: 'all' as ReviewFilter, 
      label: 'Todos', 
      count: counts.all,
      colorClass: 'text-blue-600 border-blue-300',
      selectedClass: 'bg-blue-500 text-white border-blue-500',
      iconBgClass: 'bg-blue-100'
    },
    { 
      key: 'normal' as ReviewFilter, 
      label: 'Sem Marcação', 
      count: counts.normal,
      colorClass: 'text-gray-600 border-gray-300',
      selectedClass: 'bg-gray-500 text-white border-gray-500',
      iconBgClass: 'bg-gray-100'
    },
    { 
      key: 'em-revisao' as ReviewFilter, 
      label: 'Em Revisão', 
      count: counts.emRevisao,
      colorClass: 'text-yellow-600 border-yellow-300',
      selectedClass: 'bg-yellow-500 text-white border-yellow-500',
      iconBgClass: 'bg-yellow-100'
    },
    { 
      key: 'nao-alterar' as ReviewFilter, 
      label: 'Não Alterar', 
      count: counts.naoAlterar,
      colorClass: 'text-green-600 border-green-300',
      selectedClass: 'bg-green-500 text-white border-green-500',
      iconBgClass: 'bg-green-100'
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
            <Edit className="w-2.5 h-2.5" />
          </div>
          {filter.label} ({filter.count})
        </div>
      ))}
    </div>
  );
};
