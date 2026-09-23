import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';

export function TableContainer({ children, className = '', ...props }) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ children, className = '', ...props }) {
  return (
    <table className={`w-full text-left border-collapse text-sm ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <thead
      className={`bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableRow({ children, isSelected = false, className = '', onClick, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={`
        border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 transition-colors
        ${onClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  sortable = false,
  sortDirection = null, // 'asc' | 'desc' | null
  onSort,
  align = 'left', // 'left' | 'center' | 'right'
  className = '',
  ...props
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align] || 'text-left';

  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`
        py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400
        ${sortable ? 'cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors' : ''}
        ${alignClass}
        ${className}
      `}
      {...props}
    >
      <div className={`inline-flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
        <span>{children}</span>
        {sortable && (
          <span className="shrink-0 text-slate-400">
            {sortDirection === 'asc' ? (
              <ArrowUp size={13} className="text-blue-600 dark:text-blue-400" />
            ) : sortDirection === 'desc' ? (
              <ArrowDown size={13} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <ArrowUpDown size={13} className="opacity-60" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableCell({
  children,
  align = 'left',
  className = '',
  ...props
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align] || 'text-left';

  return (
    <td
      className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 align-middle ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableEmptyState({
  title = 'Maglumat tapylmady',
  description = 'Gözleg kriteriýalaryny üýtgedip görüň ýa-da täze ýazgy goşuň.',
  icon = null,
  action = null,
  colSpan = 1,
  className = '',
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`py-12 px-4 text-center ${className}`}>
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
            {icon || <Inbox size={24} />}
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            {description}
          </p>
          {action && <div>{action}</div>}
        </div>
      </td>
    </tr>
  );
}

export default Table;
