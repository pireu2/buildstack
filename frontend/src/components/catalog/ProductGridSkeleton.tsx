import React from 'react';

export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col justify-between animate-pulse"
        >
          <div>
            {/* Image Placeholder */}
            <div className="w-full h-44 rounded-lg bg-zinc-100 mb-4" />

            {/* Manufacturer & SKU Skeleton */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="h-3.5 w-24 bg-zinc-100 rounded" />
              <div className="h-3.5 w-16 bg-zinc-100 rounded" />
            </div>

            {/* Title Skeleton */}
            <div className="h-5 w-3/4 bg-zinc-200 rounded mb-2" />
            <div className="h-4 w-full bg-zinc-100 rounded mb-4" />

            {/* Spec Badges Skeleton */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <div className="h-5 w-14 bg-zinc-100 rounded-md" />
              <div className="h-5 w-16 bg-zinc-100 rounded-md" />
              <div className="h-5 w-12 bg-zinc-100 rounded-md" />
            </div>
          </div>

          {/* Price & Action Skeleton */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <div className="h-6 w-20 bg-zinc-200 rounded" />
            <div className="h-8 w-24 bg-zinc-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
