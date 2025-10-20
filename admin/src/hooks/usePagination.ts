import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  totalItems: number;
  itemsPerPage: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const usePagination = <T>({
  data,
  itemsPerPage = 5,
  initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset to first page if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return {
    currentPage,
    totalPages,
    paginatedData,
    totalItems,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage,
    hasPrevPage,
  };
};

export default usePagination;
