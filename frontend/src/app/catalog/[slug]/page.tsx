import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { fetchProductByIdentifier, fetchProducts } from '@/lib/api/catalog';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ArrowRight,
  FileText,
  Box,
} from 'lucide-react';
import { ProductActions } from '@/components/catalog/ProductActions';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductByIdentifier(slug);

  if (!product) {
    notFound();
  }

  // Fetch companion/similar products in the same category
  const companionResponse = product.category?.slug
    ? await fetchProducts({ category: product.category.slug, limit: 3 })
    : null;

  const companionProducts = (companionResponse?.data || []).filter(
    (p) => p.id !== product.id
  );

  const { data } = product;

  const specEntries = Object.entries(data || {}).filter(
    ([key]) => key !== 'rag_chunk' && typeof data[key] !== 'object'
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-foreground selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-5 font-medium">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <Link href="/catalog" className="hover:text-zinc-900 transition-colors">
            Catalog
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
              <Link
                href={`/catalog?category=${product.category.slug}`}
                className="hover:text-zinc-900 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-900 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Balanced 2-Column Product Layout with Inline Sizing */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xs mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Image perfectly inline with right content height */}
            <div className="lg:col-span-5 relative w-full min-h-[320px] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-zinc-400">
                  <Box className="h-16 w-16 stroke-[1.25]" />
                </div>
              )}

              {/* Category Pill Overlay */}
              {product.category && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-xs font-medium text-zinc-800 border border-zinc-200 shadow-2xs">
                  {product.category.name}
                </span>
              )}

              {/* SKU Overlay at bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-md bg-zinc-950/75 backdrop-blur-md text-[11px] font-mono font-medium text-zinc-100 border border-white/10 shadow-xs">
                  SKU: {product.sku}
                </span>
              </div>
            </div>

            {/* Right Column: Details, Price/CTA, & 2-Column Specs Grid */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              {/* Header: Manufacturer & Title */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 font-mono">
                  {product.manufacturer || 'Building Manufacturer'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mt-1">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price & Action Bar */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-0.5">
                    Unit Price
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-950">
                      €{Number(product.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      / {product.unit}
                    </span>
                  </div>
                </div>

                <ProductActions 
                  productContext={{ 
                    name: product.name, 
                    sku: product.sku, 
                    slug: product.slug,
                    category: product.category?.name 
                  }} 
                />
              </div>

              {/* Physical & Engineering Specifications (Single Column Table List) */}
              {specEntries.length > 0 && (
                <div>
                  <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-900 mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <span>Physical & Engineering Properties</span>
                  </h2>

                  <div className="rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100 bg-white">
                    {specEntries.map(([key, val]) => (
                      <div
                        key={key}
                        className="grid grid-cols-2 px-3.5 py-2 text-xs odd:bg-zinc-50/50"
                      >
                        <span className="font-medium text-zinc-600">
                          {formatSpecKey(key)}
                        </span>
                        <span className="font-mono font-semibold text-zinc-950 text-right">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar / Companion Materials Section */}
        {companionProducts.length > 0 && (
          <section className="pt-6 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  Related Materials in {product.category?.name || 'Category'}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Compatible drywall boards, profiles, and companion insulation.
                </p>
              </div>
              <Link
                href={`/catalog?category=${product.category?.slug}`}
                className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                View category →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {companionProducts.map((comp) => (
                <ProductCard key={comp.id} product={comp} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function formatSpecKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Db', 'dB')
    .replace('Mm', 'mm')
    .replace('W Mk', 'W/mK')
    .replace('Kg M3', 'kg/m³');
}
