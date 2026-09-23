import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required = false,
    options = [],
    placeholder = '',
    fullWidth = true,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    children,
    value,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          value={value}
          className={`
            w-full pl-3.5 pr-10 py-2.5 text-sm transition-all duration-150 rounded-xl appearance-none cursor-pointer
            bg-slate-50 dark:bg-slate-950/60
            border text-slate-800 dark:text-slate-100
            ${
              error
                ? 'border-rose-400 dark:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-700'
            }
            ${disabled ? 'opacity-60 bg-slate-100 dark:bg-slate-900 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400 dark:text-slate-500">
              {placeholder}
            </option>
          )}

          {Array.isArray(options) && options.length > 0
            ? options.map((opt, idx) => {
                const isObj = typeof opt === 'object' && opt !== null;
                const val = isObj ? (opt.value ?? opt.id ?? '') : opt;
                const lab = isObj ? (opt.label ?? opt.name ?? opt.title ?? opt.value ?? opt.id ?? '') : opt;
                const optDisabled = isObj ? Boolean(opt.disabled) : false;
                return (
                  <option
                    key={isObj && opt.value !== undefined ? opt.value : (isObj && opt.id !== undefined ? opt.id : `${val}-${idx}`)}
                    value={val}
                    disabled={optDisabled}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-1"
                  >
                    {lab}
                  </option>
                );
              })
            : children}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
          <ChevronDown size={16} />
        </div>
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

export default Select;
