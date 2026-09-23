import React from 'react';

const VARIANTS = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    pulse: 'bg-emerald-400',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    pulse: 'bg-amber-400',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    pulse: 'bg-rose-400',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    dot: 'bg-blue-500',
    pulse: 'bg-blue-400',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
    dot: 'bg-purple-500',
    pulse: 'bg-purple-400',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60',
    dot: 'bg-cyan-500',
    pulse: 'bg-cyan-400',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
    pulse: 'bg-slate-300',
  },
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px] font-semibold gap-1 rounded-md',
  md: 'px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-lg',
  lg: 'px-3 py-1.5 text-sm font-semibold gap-2 rounded-xl',
};

export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  pulse = false,
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.slate;
  const currentSize = SIZES[size] || SIZES.md;

  return (
    <span
      className={`
        inline-flex items-center border select-none transition-colors
        ${currentVariant.badge}
        ${currentSize}
        ${className}
      `}
      {...props}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentVariant.pulse}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentVariant.dot}`} />
        </span>
      ) : dot ? (
        <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${currentVariant.dot}`} />
      ) : null}

      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </span>
  );
}
