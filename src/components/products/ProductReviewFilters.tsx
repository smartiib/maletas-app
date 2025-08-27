
import React from 'react';
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
    <div>
      <p className="text-xs text-muted-foreground mb-2">Filtrar por revisão:</p>
      <div className="flex flex-wrap gap-1">
        {filters.map((filter) => (
          <div
            key={filter.key}
            className={`
              inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 cursor-pointer hover:opacity-80
              ${selectedFilter === filter.key ? filter.selectedClass : `bg-white ${filter.colorClass}`}
            `}
            onClick={() => onFilterChange(filter.key)}
          >
            <div className={`w-3 h-3 rounded flex items-center justify-center mr-1.5 ${filter.iconBgClass}`}>
              <Edit className="w-1.5 h-1.5" />
            </div>
            {filter.label} ({filter.count})
          </div>
        ))}
      </div>
    </div>
  );
};
