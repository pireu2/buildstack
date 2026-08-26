'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { SolutionOption } from '@/lib/api/solutions';
import { Button } from '@/components/ui/button';

interface OptionCardProps {
  option: SolutionOption;
  areaM2?: number;
  isSelected?: boolean;
  onSelect?: (option: SolutionOption) => void;
}

export function OptionCard({
  option,
  areaM2 = 14.0,
  isSelected = false,
  onSelect,
}: OptionCardProps) {
  const tierName =
    option.tier === 'budget'
      ? 'Budget Option'
      : option.tier === 'balanced'
      ? 'Balanced Standard'
      : 'Premium Option';

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 p-4 flex-1 min-h-0 flex flex-col justify-between ${
        isSelected
          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-white shadow-sm'
          : 'border-zinc-200 bg-white shadow-2xs hover:border-zinc-300'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full min-h-0 items-stretch">
        {/* 1. Left Section (4 cols / ~33%): Info, Highlights, and Cost Estimate */}
        <div className="md:col-span-4 flex flex-col justify-between h-full min-h-0 space-y-2 pr-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              {tierName}
            </span>
            <h3 className="text-base font-bold text-zinc-950 leading-snug line-clamp-1">
              {option.title}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal line-clamp-2">
              {option.tagline || option.description}
            </p>
          </div>

          {/* Highlights */}
          {option.key_benefits && option.key_benefits.length > 0 && (
            <ul className="space-y-1 pt-1.5 border-t border-zinc-100">
              {option.key_benefits.slice(0, 2).map((benefit, idx) => (
                <li
                  key={idx}
                  className="text-xs text-zinc-600 flex items-start gap-1.5 leading-tight"
                >
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Cost Estimate Box */}
          <div className="p-2.5 bg-zinc-50/90 rounded-xl border border-zinc-200/70 text-left space-y-0.5">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              Cost Estimate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight text-zinc-950">
                {option.pricing?.cost_per_m2?.toFixed(2) || '0.00'} €
              </span>
              <span className="text-xs text-zinc-500 font-medium">/ m²</span>
            </div>
            <p className="text-[11px] text-zinc-600 pt-0.5 border-t border-zinc-200/60">
              Total: <strong className="font-bold text-zinc-950">{option.pricing?.total_estimated_cost?.toFixed(2) || '0.00'} €</strong>
            </p>
          </div>
        </div>

        {/* 2. Right Section (8 cols / ~67%): Wide/Long Materials Stacked One Under The Other + Bottom-Right Select Button */}
        <div className="md:col-span-8 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-5 pt-2 md:pt-0 flex flex-col justify-between h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Selected Materials ({option.products?.length || 0})
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-normal">
              Click item for full catalog specs
            </span>
          </div>

          {/* Vertical Stack of Long Material Items */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
            {option.products?.map((prod, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-zinc-50 hover:bg-zinc-100/90 rounded-xl border border-zinc-200/80 hover:border-amber-400/80 transition-all group flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/catalog/${prod.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-zinc-900 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5 truncate max-w-full"
                    title={prod.name}
                  >
                    <span className="truncate">{prod.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-amber-600 shrink-0 transition-opacity" />
                  </Link>
                  <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                    {prod.role || 'Assembly Component'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-extrabold text-zinc-900 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                    {prod.unit_price?.toFixed(2)} € <span className="text-[10px] font-normal text-zinc-500">/ {prod.unit || 'm²'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Right: Select Solution Button */}
          <div className="flex justify-end pt-2 shrink-0">
            <Button
              onClick={() => onSelect?.(option)}
              className={`h-8 px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200'
              }`}
            >
              <span>{isSelected ? 'Selected' : 'Select Solution'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
