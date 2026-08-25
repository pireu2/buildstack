'use client';

import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { ProductQueryParams } from '@/types/catalog';

interface CatalogHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: ProductQueryParams['sortBy'];
  onSortChange: (value: ProductQueryParams['sortBy']) => void;
  totalProducts: number;
  selectedCategoryName?: string;
  onClearCategory: () => void;
  selectedManufacturers: string[];
  onRemoveManufacturer: (mfg: string) => void;
  minPrice: string;
  maxPrice: string;
  onClearPrice: () => void;
}

export function CatalogHeader({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  totalProducts,
  selectedCategoryName,
  onClearCategory,
  selectedManufacturers,
  onRemoveManufacturer,
  minPrice,
  maxPrice,
  onClearPrice,
}: CatalogHeaderProps) {
  const hasActiveChips =
    selectedCategoryName ||
    selectedManufacturers.length > 0 ||
    minPrice ||
    maxPrice;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Row: Search Input & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search materials, SKUs, standards, or performance specs..."
            className="w-full h-10 pl-10 pr-9 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="text-xs text-zinc-500 font-medium whitespace-nowrap flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort:</span>
          </label>
          <select
            value={sortBy || 'newest'}
            onChange={(e) => onSortChange(e.target.value as ProductQueryParams['sortBy'])}
            className="h-10 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-900 shadow-2xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Results Count & Active Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100">
        <p className="text-xs font-mono text-zinc-500">
          Showing <span className="font-semibold text-zinc-900">{totalProducts}</span> certified materials
        </p>

        {/* Filter Chips Bar */}
        {hasActiveChips && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedCategoryName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
                <span>{selectedCategoryName}</span>
                <button onClick={onClearCategory} className="hover:text-amber-700 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedManufacturers.map((mfg) => (
              <span
                key={mfg}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800"
              >
                <span>{mfg}</span>
                <button
                  onClick={() => onRemoveManufacturer(mfg)}
                  className="hover:text-zinc-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-800">
                <span>
                  €{minPrice || '0'} – €{maxPrice || '∞'}
                </span>
                <button onClick={onClearPrice} className="hover:text-zinc-600 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
