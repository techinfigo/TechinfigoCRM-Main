
import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  setEntriesPerPage: (num: number) => void;
  entriesPerPage: number;
  startIndex: number;
  endIndex: number;
  totalEntries: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  setEntriesPerPage,
  entriesPerPage,
  startIndex,
  endIndex,
  totalEntries
}) => {
  if (totalEntries <= 10 && totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 py-3 text-sm text-text-muted dark:text-slate-400">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <span>Show</span>
        <select
          value={entriesPerPage}
          onChange={(e) => setEntriesPerPage(Number(e.target.value))}
          className="p-1.5 border border-border-base dark:border-slate-600 rounded-md bg-bg-base dark:bg-slate-700 text-text-base dark:text-slate-200 focus:ring-1 focus:ring-premium-accent"
        >
          {[10, 25, 50, 100].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>entries</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Showing {startIndex} to {endIndex} of {totalEntries} entries</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="!px-2.5 !py-1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="!px-2.5 !py-1"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
