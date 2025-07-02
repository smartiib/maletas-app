import { useState, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
}

export interface PaginationInfo {
  totalPages: number;
  startItem: number;
  endItem: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pages: number[];
}

export const usePagination = (totalItems: number, initialItemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const paginationInfo = useMemo((): PaginationInfo => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    // Generate page numbers for pagination
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      }
    }

    return {
      totalPages,
      startItem,
      endItem,
      hasNextPage,
      hasPreviousPage,
      pages
    };
  }, [currentPage, itemsPerPage, totalItems]);

  const actions: PaginationActions = {
    setCurrentPage: (page: number) => {
      if (page >= 1 && page <= paginationInfo.totalPages) {
        setCurrentPage(page);
      }
    },
    setItemsPerPage: (items: number) => {
      setItemsPerPage(items);
      setCurrentPage(1); // Reset to first page when changing items per page
    },
    nextPage: () => {
      if (paginationInfo.hasNextPage) {
        setCurrentPage(prev => prev + 1);
      }
    },
    previousPage: () => {
      if (paginationInfo.hasPreviousPage) {
        setCurrentPage(prev => prev - 1);
      }
    },
    goToPage: (page: number) => {
      if (page >= 1 && page <= paginationInfo.totalPages) {
        setCurrentPage(page);
      }
    }
  };

  return {
    state: { currentPage, itemsPerPage, totalItems },
    info: paginationInfo,
    actions
  };
};