import React, { forwardRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required = false,
    leftIcon = null,
    rightIcon = null,
    clearable = false,
    onClear,
    mono = false,
    fullWidth = true,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    value,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          className={`
            w-full py-2.5 text-sm transition-all duration-150 rounded-xl
            bg-slate-50 dark:bg-slate-950/60
            border text-slate-800 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon || (clearable && hasValue) ? 'pr-10' : 'pr-3.5'}
            ${mono ? 'font-mono tracking-wider' : 'font-sans'}
            ${
              error
                ? 'border-rose-400 dark:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-700'
            }
            ${disabled ? 'opacity-60 bg-slate-100 dark:bg-slate-900 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

        {clearable && hasValue && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        )}

        {rightIcon && !clearable && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {hint && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
