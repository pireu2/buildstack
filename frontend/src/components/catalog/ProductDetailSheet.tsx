'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import {
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  Box,
} from 'lucide-react';

interface ProductDetailSheetProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailSheet({ product, onClose }: ProductDetailSheetProps) {
  if (!product) return null;

  const { data } = product;
  const ragChunk = data?.rag_chunk as string | undefined;

  // Filter out internal/rag fields for the clean specs table
  const specEntries = Object.entries(data || {}).filter(
    ([key]) => key !== 'rag_chunk' && typeof data[key] !== 'object'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-Over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl border-l border-zinc-200 flex flex-col justify-between animate-in slide-in-from-right duration-200 z-10">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
              {product.sku}
            </span>
            {product.category && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                {product.category.name}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image */}
          {product.imageUrl ? (
            <div className="w-full h-56 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-44 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
              <Box className="h-12 w-12 stroke-[1.25]" />
            </div>
          )}

          {/* Title & Manufacturer */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 font-mono">
              {product.manufacturer || 'Certified Manufacturer'}
            </span>
            <h2 className="text-2xl font-bold text-zinc-950 mt-1">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Technical Specs Table */}
          {specEntries.length > 0 && (
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-900 mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-600" />
                <span>Physical & Performance Specifications</span>
              </h3>

              <div className="rounded-lg border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                {specEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 px-3.5 py-2.5 text-xs odd:bg-zinc-50/50"
                  >
                    <span className="font-medium text-zinc-600">
                      {formatSpecKey(key)}
                    </span>
                    <span className="font-mono text-zinc-900 text-right font-medium">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured RAG Specification Box */}
          {ragChunk && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/90 text-xs leading-relaxed space-y-3">
              <div className="flex items-center gap-1.5 text-zinc-950 font-semibold font-mono uppercase tracking-wider text-[11px]">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>RAG Specification & Standards Knowledge</span>
              </div>
              <p className="text-zinc-700 whitespace-pre-line font-sans">
                {ragChunk}
              </p>
            </div>
          )}
        </div>

        {/* Footer with Price & Build Action */}
        <div className="p-6 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-500 font-medium block">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-zinc-950">
                €{Number(product.price).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                / {product.unit}
              </span>
            </div>
          </div>

          <Link href={`/solutions?query=${encodeURIComponent(`Build assembly using ${product.name}`)}`}>
            <Button className="h-11 px-5 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 text-sm font-medium shadow-sm flex items-center gap-2">
              <span>Start Plan with Material</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </Button>
          </Link>
        </div>
      </div>
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
