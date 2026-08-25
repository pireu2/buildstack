'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/catalog/FilterSidebar';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductGridSkeleton } from '@/components/catalog/ProductGridSkeleton';
import { Pagination } from '@/components/catalog/Pagination';
import { fetchCategories, fetchProducts } from '@/lib/api/catalog';
import { Category, Product, ProductQueryParams } from '@/types/catalog';
import {
  PackageSearch,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CatalogPage() {
  return (
    <React.Suspense fallback={<CatalogLoadingFallback />}>
      <CatalogContent />
    </React.Suspense>
  );
}

function CatalogLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <ProductGridSkeleton count={9} />
      </main>
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile Filter Drawer Toggle State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter & Search State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [manufacturers, setManufacturers] = useState<string[]>(
    searchParams.get('manufacturer')
      ? searchParams.get('manufacturer')!.split(',')
      : []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState<ProductQueryParams['sortBy']>(
    (searchParams.get('sortBy') as ProductQueryParams['sortBy']) || 'newest'
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [availableManufacturers, setAvailableManufacturers] = useState<string[]>([]);

  // 1. Initial Load: Fetch Categories
  useEffect(() => {
    async function loadCategories() {
      const cats = await fetchCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  // 2. Debounce Search Input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 3. Sync State to URL Query Parameters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (manufacturers.length > 0)
      params.set('manufacturer', manufacturers.join(','));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const newQuery = params.toString();
    const target = newQuery ? `/catalog?${newQuery}` : '/catalog';
    router.replace(target, { scroll: false });
  }, [
    debouncedSearch,
    category,
    manufacturers,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    router,
  ]);

  // 4. Fetch Products whenever filters change
  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setLoading(true);

      const params: ProductQueryParams = {
        page: currentPage,
        limit: 12,
        search: debouncedSearch || undefined,
        category: category || undefined,
        manufacturer:
          manufacturers.length > 0 ? manufacturers : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy,
      };

      const response = await fetchProducts(params);

      if (!isCancelled) {
        if (response && response.data) {
          setProducts(response.data);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalProducts(response.pagination?.total || 0);

          if (availableManufacturers.length === 0 && response.data.length > 0) {
            const mfgs = Array.from(
              new Set(
                response.data
                  .map((p) => p.manufacturer)
                  .filter(Boolean) as string[]
              )
            ).sort();
            setAvailableManufacturers(mfgs);
          }
        }
        setLoading(false);
      }
    }

    loadProducts();
    updateUrlParams();

    return () => {
      isCancelled = true;
    };
  }, [
    debouncedSearch,
    category,
    manufacturers,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    updateUrlParams,
  ]);

  // Filter Handlers
  const handleToggleManufacturer = (mfg: string) => {
    setManufacturers((prev) =>
      prev.includes(mfg) ? prev.filter((item) => item !== mfg) : [...prev, mfg]
    );
    setCurrentPage(1);
  };

  const handleSelectCategory = (catSlug: string) => {
    setCategory(catSlug);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setManufacturers([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const selectedCategoryObj = categories.find((c) => c.slug === category);
  const activeFiltersCount =
    (category ? 1 : 0) +
    manufacturers.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full flex-1">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Materials & Systems Catalog
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Filter certified building products by acoustic rating (dB), fire resistance (EI), dimensions, and manufacturer.
          </p>
        </div>

        {/* MOBILE FILTERS TOGGLE BUTTON (Placed at the TOP on mobile) */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-2xs text-sm font-medium text-zinc-900 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              <span>Filters & Categories</span>
              {activeFiltersCount > 0 && (
                <span className="h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-mono font-semibold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {mobileFiltersOpen ? (
              <ChevronUp className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            )}
          </button>

          {/* Collapsible Filter Panel on Mobile */}
          {mobileFiltersOpen && (
            <div className="mt-3 p-5 bg-white border border-zinc-200 rounded-xl shadow-sm animate-in fade-in duration-150">
              <FilterSidebar
                categories={categories}
                selectedCategory={category}
                onSelectCategory={(slug) => {
                  handleSelectCategory(slug);
                  setMobileFiltersOpen(false);
                }}
                selectedManufacturers={manufacturers}
                onToggleManufacturer={handleToggleManufacturer}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={(val) => {
                  setMinPrice(val);
                  setCurrentPage(1);
                }}
                onMaxPriceChange={(val) => {
                  setMaxPrice(val);
                  setCurrentPage(1);
                }}
                onResetFilters={handleResetFilters}
                availableManufacturers={availableManufacturers}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          )}
        </div>

        {/* 2-Column Catalog Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Filter Sidebar (Visible on Desktop) */}
          <div className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-2xs sticky top-20">
            <FilterSidebar
              categories={categories}
              selectedCategory={category}
              onSelectCategory={handleSelectCategory}
              selectedManufacturers={manufacturers}
              onToggleManufacturer={handleToggleManufacturer}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={(val) => {
                setMinPrice(val);
                setCurrentPage(1);
              }}
              onMaxPriceChange={(val) => {
                setMaxPrice(val);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              availableManufacturers={availableManufacturers}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Right Product Grid Column */}
          <div className="lg:col-span-3">
            {/* Header: Search, Sort, Filter Chips */}
            <CatalogHeader
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={(val) => {
                setSortBy(val);
                setCurrentPage(1);
              }}
              totalProducts={totalProducts}
              selectedCategoryName={selectedCategoryObj?.name}
              onClearCategory={() => setCategory('')}
              selectedManufacturers={manufacturers}
              onRemoveManufacturer={handleToggleManufacturer}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onClearPrice={() => {
                setMinPrice('');
                setMaxPrice('');
              }}
            />

            {/* Product Cards or Skeleton Loader */}
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            ) : (
              /* Clean Empty State */
              <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8">
                <PackageSearch className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-zinc-900">
                  No materials match your filters
                </h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query, clearing specific manufacturers, or broadening your price bounds.
                </p>
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-zinc-200 text-xs font-medium cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  <span>Reset All Filters</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
