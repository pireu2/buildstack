'use client';

import React from 'react';
import { Category } from '@/types/catalog';
import {
  Layers,
  Volume2,
  Grid,
  Brush,
  Wrench,
  ShieldAlert,
  Building2,
  SquareStack,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  selectedManufacturers: string[];
  onToggleManufacturer: (mfg: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onResetFilters: () => void;
  availableManufacturers: string[];
  hasActiveFilters: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Volume2,
  Grid,
  Brush,
  Wrench,
  ShieldAlert,
  Building2,
  SquareStack,
};

export function FilterSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedManufacturers,
  onToggleManufacturer,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onResetFilters,
  availableManufacturers,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <aside className="w-full space-y-6">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-zinc-950">Refine Materials</h2>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 1. Category Taxonomy Navigation */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
          Categories
        </h3>
        <nav className="space-y-1">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
              !selectedCategory
                ? 'bg-zinc-900 text-zinc-50 font-semibold shadow-2xs'
                : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const Icon = (cat.icon && ICON_MAP[cat.icon]) || Layers;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-zinc-50 font-semibold shadow-2xs'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Manufacturer Multi-Select */}
      {availableManufacturers.length > 0 && (
        <div className="pt-5 border-t border-zinc-200">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
            Manufacturers
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {availableManufacturers.map((mfg) => {
              const isChecked = selectedManufacturers.includes(mfg);
              return (
                <label
                  key={mfg}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleManufacturer(mfg)}
                    className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="truncate">{mfg}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Price Range Filter */}
      <div className="pt-5 border-t border-zinc-200">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
          Price Range (€)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1 font-mono">MIN</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1 font-mono">MAX</label>
            <input
              type="number"
              min="0"
              placeholder="200"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
