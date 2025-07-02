import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationInfo, PaginationActions } from '@/hooks/usePagination';

interface PaginationControlsProps {
  info: PaginationInfo;
  actions: PaginationActions;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  info,
  actions,
  itemsPerPage,
  totalItems,
  currentPage,
  className
}) => {
  const itemsPerPageOptions = [10, 20, 50, 100];

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className || ''}`}>
      {/* Items info and per page selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando {info.startItem}-{info.endItem} de {totalItems || 0} itens
        </span>
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => actions.setItemsPerPage(Number(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination */}
      {info.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={actions.previousPage}
                className={!info.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {info.pages.map((page, index) => (
              <PaginationItem key={index}>
                {page === -1 ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => actions.goToPage(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={actions.nextPage}
                className={!info.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default PaginationControls;