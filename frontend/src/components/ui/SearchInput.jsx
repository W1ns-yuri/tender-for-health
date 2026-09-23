import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onSearch,
  placeholder = 'Gözleg...',
  debounceMs = 300,
  isLoading = false,
  size = 'md', // 'sm' | 'md'
  className = '',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const isFirstRun = useRef(true);

  // Synchronize controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounced search trigger
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (!onSearch) return;

    const timer = setTimeout(() => {
      onSearch(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    onChange?.(e);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.({ target: { value: '' } });
    onSearch?.('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
        <Search size={size === 'sm' ? 14 : 16} />
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full rounded-xl border border-slate-200 dark:border-slate-800
          bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          transition-all duration-150 pl-10 pr-9
          focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          ${size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'}
        `}
        {...props}
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isLoading && (
          <Loader2 size={14} className="animate-spin text-slate-400" />
        )}

        {internalValue && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors cursor-pointer"
            title="Arassala"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
