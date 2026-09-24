import React from 'react';

const SIZES = {
  sm: 'w-8 h-8 rounded-lg text-sm',
  md: 'w-10 h-10 rounded-xl text-base',
  lg: 'w-11 h-11 rounded-xl text-lg',
  xl: 'w-12 h-12 rounded-2xl text-xl',
};

const VARIANTS = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/80',
  blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/80',
  amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/80',
  rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/80',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/80',
};

export default function IconBox({
  icon = null,
  children,
  variant = 'emerald',
  size = 'lg',
  className = '',
  ...props
}) {
  const sizeClasses = SIZES[size] || SIZES.lg;
  const variantClasses = VARIANTS[variant] || VARIANTS.emerald;

  return (
    <div
      className={`${sizeClasses} ${variantClasses} flex items-center justify-center shrink-0 shadow-xs ${className}`}
      {...props}
    >
      {icon || children}
    </div>
  );
}
