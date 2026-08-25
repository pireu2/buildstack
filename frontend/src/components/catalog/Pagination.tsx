'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Windowed pagination logic: e.g. [1, '...', 4, 5, 6, '...', 20]
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const delta = 1;

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-zinc-200">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 px-3 text-xs font-medium border-zinc-200"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span>Previous</span>
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span
                key={`${item}-${idx}`}
                className="h-9 w-7 flex items-center justify-center text-xs font-mono text-zinc-400 select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`h-9 w-9 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 px-3 text-xs font-medium border-zinc-200"
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
