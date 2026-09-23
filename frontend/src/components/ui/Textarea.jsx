import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    required = false,
    rows = 3,
    mono = false,
    fullWidth = true,
    showCount = false,
    maxLength,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    value,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${containerClassName}`}>
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}

        {showCount && maxLength && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        value={value}
        maxLength={maxLength}
        className={`
          w-full px-3.5 py-2.5 text-sm transition-all duration-150 rounded-xl resize-y
          bg-slate-50 dark:bg-slate-950/60
          border text-slate-800 dark:text-slate-100
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          ${mono ? 'font-mono text-xs' : 'font-sans'}
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

export default Textarea;
