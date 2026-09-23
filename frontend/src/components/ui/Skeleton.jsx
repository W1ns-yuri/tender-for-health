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

export default Skeleton;
