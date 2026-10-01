import React from 'react';

export function Skeleton({
  variant = 'text', // 'text' | 'circular' | 'rounded' | 'rectangular'
  width,
  height,
  className = '',
  ...props
}) {
  const variantClass = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
    rectangular: 'rounded-none',
  }[variant] || 'rounded-md';

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      style={style}
      className={`
        animate-pulse bg-slate-200 dark:bg-slate-800/80
        ${variantClass}
        ${className}
      `}
      {...props}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`w-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 p-4 ${className}`}>
      {/* Header bar */}
      <div className="flex gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-3.5 bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                variant="text"
                className={`flex-1 ${c === 0 ? 'h-4 w-3/4' : 'h-3.5'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Drop-in skeleton rows for any standard <tbody>
 */
export function TableSkeletonRows({ rows = 5, cols = 8, className = '' }) {
  return Array.from({ length: rows }).map((_, rIdx) => (
    <tr key={`skel-row-${rIdx}`} className={`animate-pulse ${className}`}>
      {Array.from({ length: cols }).map((_, cIdx) => (
        <td key={`skel-col-${cIdx}`} className="py-4 px-4 text-center">
          <div
            className={`h-4 bg-slate-200/90 dark:bg-slate-800 rounded-md mx-auto ${
              cIdx === 0
                ? 'w-12'
                : cIdx === 1
                ? 'w-36'
                : cIdx === 2
                ? 'w-44'
                : cIdx === cols - 1
                ? 'w-8 h-8 rounded-lg'
                : 'w-20'
            }`}
          />
        </td>
      ))}
    </tr>
  ));
}

/**
 * Full page skeleton for Tender Details view
 */
export function TenderDetailsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Main card skeleton */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-80 bg-slate-200/70 dark:bg-slate-800/70 rounded-md" />
          </div>
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="flex gap-6 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded" />
          <div className="h-4 w-3/4 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
        </div>
      </div>

      {/* Lot tabs skeleton */}
      <div className="flex gap-2 -mb-px">
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-t-xl" />
        <div className="h-10 w-44 bg-slate-200/60 dark:bg-slate-800/60 rounded-t-xl" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
        <div className="space-y-4">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
