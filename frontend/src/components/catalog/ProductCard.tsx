'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/catalog';
import { ArrowRight, Volume2, ShieldAlert, Layers, Gauge, Box } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const specs = extractSpecHighlights(product.data);

  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group relative rounded-xl border border-zinc-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-amber-500/60 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Image Container with Smooth Zoom */}
        <div className="relative w-full h-44 rounded-lg overflow-hidden bg-zinc-100 mb-3.5 border border-zinc-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <Box className="h-10 w-10 stroke-[1.25]" />
            </div>
          )}

          {/* Category Tag Overlay */}
          {product.category && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[11px] font-medium text-zinc-800 border border-zinc-200/80 shadow-2xs">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Manufacturer & SKU */}
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1">
          <span className="font-semibold text-amber-700 truncate tracking-tight">
            {product.manufacturer || 'Standard Build'}
          </span>
          <span className="font-mono text-[10px] text-zinc-400 shrink-0">
            {product.sku}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="text-base font-semibold text-zinc-950 group-hover:text-amber-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.description && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Technical Spec Badges */}
        {specs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specs.map((spec, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-700"
              >
                {spec.icon && <spec.icon className="h-3 w-3 text-amber-600" />}
                <span>{spec.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing & CTA */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400 block leading-none mb-0.5">
            Price
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-zinc-950">
              €{Number(product.price).toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              / {product.unit || 'unit'}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 group-hover:text-amber-600 transition-colors">
          <span>View Specs</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

function extractSpecHighlights(data: Record<string, any> = []) {
  const highlights: { label: string; icon?: React.ElementType }[] = [];

  if (
    data.sound_reduction_index_rw_db ||
    data.sound_insulation_rw_db ||
    data.weighted_sound_reduction_index_rw_db
  ) {
    const db =
      data.sound_reduction_index_rw_db ||
      data.sound_insulation_rw_db ||
      data.weighted_sound_reduction_index_rw_db;
    highlights.push({ label: `${db} dB`, icon: Volume2 });
  }

  if (
    data.fire_classification ||
    data.fire_resistance ||
    data.fire_reaction_class ||
    data.fire_rating
  ) {
    const fire =
      data.fire_classification ||
      data.fire_resistance ||
      data.fire_reaction_class ||
      data.fire_rating;
    highlights.push({ label: String(fire).split(' ')[0], icon: ShieldAlert });
  }

  if (data.thickness_mm || data.board_thickness_mm || data.core_thickness_mm) {
    const thk =
      data.thickness_mm || data.board_thickness_mm || data.core_thickness_mm;
    highlights.push({ label: `${thk} mm`, icon: Layers });
  }

  if (data.thermal_conductivity_lambda_w_mk || data.thermal_conductivity_w_mk) {
    const lambda =
      data.thermal_conductivity_lambda_w_mk || data.thermal_conductivity_w_mk;
    highlights.push({ label: `λ ${lambda}`, icon: Gauge });
  }

  return highlights.slice(0, 3);
}
