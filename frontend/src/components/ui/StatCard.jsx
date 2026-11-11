import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const COLORS = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    accent: 'from-blue-600 to-indigo-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    accent: 'from-emerald-600 to-teal-600',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    accent: 'from-amber-500 to-orange-600',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    accent: 'from-purple-600 to-pink-600',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    accent: 'from-rose-600 to-red-600',
  },
  cyan: {
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
    accent: 'from-cyan-600 to-blue-600',
  },
};

export default function StatCard({
  title,
  value,
  icon = null,
  color = 'blue',
  trend = null, // { value: '+14.2%', direction: 'up' | 'down' | 'neutral', isPositive: true }
  subtitle = '',
  loading = false,
  onClick,
  className = '',
  ...props
}) {
  const currentColor = COLORS[color] || COLORS.blue;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-24" />
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 mb-2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-40" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs
        transition-all duration-200 relative overflow-hidden group
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Decorative top accent line on hover */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentColor.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>

        {icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${currentColor.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={`
              inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md gap-0.5
              ${
                trend.isPositive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
              }
            `}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight size={13} className="shrink-0" />
            ) : trend.direction === 'down' ? (
              <ArrowDownRight size={13} className="shrink-0" />
            ) : (
              <Minus size={13} className="shrink-0" />
            )}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
