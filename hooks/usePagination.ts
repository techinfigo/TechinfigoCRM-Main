
import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationProps<T> {
  data: T[];
  initialEntriesPerPage?: number;
}

export const usePagination = <T>({ data, initialEntriesPerPage = 10 }: UsePaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(initialEntriesPerPage);

  const totalPages = useMemo(() => Math.ceil(data.length / entriesPerPage), [data.length, entriesPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, entriesPerPage]);
  
  const startIndex = useMemo(() => (currentPage - 1) * entriesPerPage, [currentPage, entriesPerPage]);
  const endIndex = useMemo(() => Math.min(startIndex + entriesPerPage, data.length), [startIndex, entriesPerPage, data.length]);
  const totalEntries = data.length;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToPage = (page: number) => {
    if(page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  };

  const handleSetEntriesPerPage = (num: number) => {
    setEntriesPerPage(num);
    setCurrentPage(1); // Reset to first page
  };

  // Reset current page if it becomes invalid after data changes
  useEffect(() => {
      const newTotalPages = Math.ceil(data.length / entriesPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
      } else if (newTotalPages === 0 && currentPage > 1) { // If filters result in 0 pages
          setCurrentPage(1);
      }
  }, [data.length, entriesPerPage, currentPage]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    entriesPerPage,
    setEntriesPerPage: handleSetEntriesPerPage,
    nextPage,
    prevPage,
    goToPage,
    startIndex: totalEntries > 0 ? startIndex + 1 : 0,
    endIndex,
    totalEntries,
  };
};
