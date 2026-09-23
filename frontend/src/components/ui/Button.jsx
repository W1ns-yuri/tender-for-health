import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-500/20 border border-blue-600',
  success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-500/20 border border-emerald-600',
  danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-500/20 border border-rose-600',
  warning: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm shadow-amber-500/20 border border-amber-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  outline: 'bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs font-semibold rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-5 py-3 text-base font-semibold rounded-xl gap-2.5',
  icon: 'w-10 h-10 p-0 rounded-xl justify-center',
  'icon-sm': 'w-8 h-8 p-0 rounded-lg justify-center',
  'icon-xs': 'w-7 h-7 p-0 rounded-md justify-center',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  className = '',
  onClick,
  title,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`
        inline-flex items-center select-none font-sans cursor-pointer
        transition-all duration-150 active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${fullWidth ? 'w-full justify-center' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin shrink-0" size={size === 'xs' || size === 'sm' || size === 'icon-sm' ? 14 : 16} />
          {size !== 'icon' && size !== 'icon-sm' && size !== 'icon-xs' && children && (
            <span>{children}</span>
          )}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
