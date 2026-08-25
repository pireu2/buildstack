"use client";

import React from "react";
import { Search, X, ArrowUpDown, Sparkles } from "lucide-react";
import { ProductQueryParams } from "@/types/catalog";

interface CatalogHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  isAiSearch: boolean;
  onToggleAiSearch: (active: boolean) => void;
  sortBy: ProductQueryParams["sortBy"];
  onSortChange: (value: ProductQueryParams["sortBy"]) => void;
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
  isAiSearch,
  onToggleAiSearch,
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
    <div className="space-y-3 mb-6">
      {/* Full-Width Hero Search Bar */}
      <div className="relative w-full group">
        <div
          className={`flex items-center w-full h-11 sm:h-12 px-3.5 rounded-xl border bg-white shadow-2xs transition-all duration-200 ${
            isAiSearch
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-zinc-200/90 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-950/5"
          }`}
        >
          {/* Search Icon */}
          <Search className="h-4 w-4 text-zinc-400 shrink-0 mr-2.5" />

          {/* Main Input */}
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isAiSearch
                ? "Describe what you need in natural language (e.g. soundproof studio wall, wet room)..."
                : "Search materials, SKUs, standards (e.g. DIN 4109, Knauf, CW 75)..."
            }
            className="w-full h-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden"
          />

          {/* Clear Input Button */}
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer mr-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* AI Semantic Search Toggle Button (Icon Only, No Tooltip) */}
          <div className="relative shrink-0 flex items-center pl-1.5 border-l border-zinc-200">
            <button
              type="button"
              onClick={() => onToggleAiSearch(!isAiSearch)}
              aria-label="Toggle Natural Language Search"
              className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                isAiSearch
                  ? "bg-amber-500 text-white shadow-2xs hover:bg-amber-600"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900 border border-zinc-200/60"
              }`}
            >
              <Sparkles
                className={`h-4 w-4 ${isAiSearch ? "text-white fill-white/20" : "text-zinc-500"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Natural Language Information Banner */}
      {isAiSearch && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-amber-950">
              Natural Language Search:
            </span>{" "}
            <span className="text-amber-900/90">
              Describe your search using natural language to find materials by
              performance, room use-case, acoustic isolation etc.
            </span>
          </p>
        </div>
      )}

      {/* Inline Results Count & Sort Dropdown */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs font-mono text-zinc-500">
          Showing{" "}
          <span className="font-semibold text-zinc-900">{totalProducts}</span>{" "}
          {isAiSearch ? "matched" : "certified"} materials
        </p>

        {/* Compact Inline Sort Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label className="text-xs text-zinc-500 font-medium whitespace-nowrap flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
            <span className="hidden sm:inline">Sort:</span>
          </label>
          <select
            value={sortBy || "newest"}
            onChange={(e) =>
              onSortChange(e.target.value as ProductQueryParams["sortBy"])
            }
            className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-900 shadow-2xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Filter Chips Bar (rendered when active) */}
      {hasActiveChips && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
          {selectedCategoryName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
              <span>{selectedCategoryName}</span>
              <button
                onClick={onClearCategory}
                className="hover:text-amber-700 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedManufacturers.map((mfg) => (
            <span
              key={mfg}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800"
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-800">
              <span>
                €{minPrice || "0"} – €{maxPrice || "∞"}
              </span>
              <button
                onClick={onClearPrice}
                className="hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
