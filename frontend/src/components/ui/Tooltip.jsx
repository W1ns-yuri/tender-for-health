import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Tooltip Component for W1ns UI Kit
 * Supports positions: 'top' | 'bottom' | 'left' | 'right'
 * Variants: 'dark' (default) | 'emerald' | 'blue' | 'light'
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  variant = 'dark',
  arrow = true,
  delay = 150,
  maxWidth = 'max-w-xs',
  className = '',
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content || disabled) {
    return children;
  }

  // Positioning styles
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  // Arrow orientation styles
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-current border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-current border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-current border-y-transparent border-l-transparent',
  }[position] || 'top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent';

  // Color variant themes
  const variantStyles = {
    dark: 'bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 border border-slate-700/80 shadow-xl shadow-black/30 text-current-slate-900',
    emerald: 'bg-emerald-900/95 text-emerald-100 border border-emerald-700/80 shadow-xl shadow-emerald-950/30 text-current-emerald-900',
    blue: 'bg-blue-900/95 text-blue-100 border border-blue-700/80 shadow-xl shadow-blue-950/30 text-current-blue-900',
    light: 'bg-white text-slate-800 border border-slate-200/90 shadow-xl shadow-slate-900/15',
  }[variant] || 'bg-slate-900/95 text-slate-100 border border-slate-700/80';

  const arrowColorClass = {
    dark: 'text-slate-900 dark:text-slate-950',
    emerald: 'text-emerald-900',
    blue: 'text-blue-900',
    light: 'text-white',
  }[variant] || 'text-slate-900';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`
            absolute z-50 pointer-events-none whitespace-normal
            px-2.5 py-1.5 rounded-lg text-xs font-medium leading-relaxed
            transition-all duration-150 animate-in fade-in zoom-in-95
            ${positionClasses}
            ${variantStyles}
            ${maxWidth}
            ${className}
          `}
        >
          {content}

          {arrow && (
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses} ${arrowColorClass}`}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
}
