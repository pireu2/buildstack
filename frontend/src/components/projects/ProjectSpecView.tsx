'use client';

import React from 'react';
import Link from 'next/link';
import { SolutionOption } from '@/lib/api/solutions';
import { ProjectRecord } from '@/types/project';
import { Check, ExternalLink } from 'lucide-react';

interface ProjectSpecViewProps {
  project: ProjectRecord;
  selectedOption: SolutionOption;
}

export function ProjectSpecView({
  project,
  selectedOption,
}: ProjectSpecViewProps) {
  const dims = project.data?.dimensions || { length_m: 5.0, height_m: 2.8, area_m2: 14.0 };
  const areaM2 = dims.area_m2 || parseFloat((dims.length_m * dims.height_m).toFixed(1));

  const tierName =
    selectedOption.tier === 'budget'
      ? 'Budget Option'
      : selectedOption.tier === 'balanced'
      ? 'Balanced Standard'
      : 'Premium Option';

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
      {/* 1. Header Section */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/75 shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-zinc-950 font-heading">
          {selectedOption.title}
        </h2>
        <p className="text-xs text-zinc-600 leading-relaxed mt-1">
          {selectedOption.description}
        </p>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Standards & Key Benefits (Clean List) */}
        {selectedOption.key_benefits && selectedOption.key_benefits.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Standards & Key Benefits
            </h3>
            <ul className="space-y-1.5">
              {selectedOption.key_benefits.map((benefit, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-700 flex items-start gap-2 leading-relaxed"
                >
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specified Materials (Clean Stacked List) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Specified Materials ({selectedOption.products?.length || 0})
            </h3>
            <span className="text-[11px] text-zinc-400">
              Area: {areaM2} m²
            </span>
          </div>

          <div className="space-y-1.5">
            {selectedOption.products?.map((prod, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-200/80 transition-all flex items-center justify-between gap-3 shadow-2xs group"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/catalog/${prod.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-zinc-950 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5 truncate max-w-full"
                    title={prod.name}
                  >
                    <span className="truncate">{prod.name}</span>
                    <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-amber-600 shrink-0" />
                  </Link>
                  <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                    {prod.role || 'Assembly Component'}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold text-zinc-900 bg-white px-2.5 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                    {prod.unit_price?.toFixed(2)} € <span className="text-[10px] font-normal text-zinc-500">/ {prod.unit || 'm²'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation Notes (Clean List) */}
        {selectedOption.installation_notes && selectedOption.installation_notes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Installation Notes
            </h3>
            <ul className="space-y-1.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl p-3.5">
              {selectedOption.installation_notes.map((note, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-700 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-zinc-400 font-bold">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cost Summary (Clean Light Box) */}
        <div className="p-4 bg-zinc-50/90 rounded-xl border border-zinc-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Room Area ({dims.length_m}m × {dims.height_m}m)</span>
            <span className="font-semibold text-zinc-900">{areaM2} m²</span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Assembly Unit Rate</span>
            <span className="font-semibold text-zinc-900">
              {selectedOption.pricing?.cost_per_m2?.toFixed(2) || '0.00'} € / m²
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900">Total Material Estimate</span>
            <span className="text-base font-extrabold text-zinc-950">
              {selectedOption.pricing?.total_estimated_cost?.toFixed(2) || '0.00'} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
