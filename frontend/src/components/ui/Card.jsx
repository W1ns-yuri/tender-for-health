import React from 'react';

export function Card({
  children,
  hoverable = false,
  bordered = true,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-900 rounded-2xl transition-all duration-200
        ${bordered ? 'border border-slate-200/80 dark:border-slate-800/80 shadow-xs' : ''}
        ${hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, icon = null, className = '', ...props }) {
  return (
    <h3
      className={`text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{icon}</span>}
      <span>{children}</span>
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p
      className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardAction({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', noPadding = false, ...props }) {
  return (
    <div className={`${noPadding ? '' : 'p-5 sm:p-6'} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-5 py-3.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
