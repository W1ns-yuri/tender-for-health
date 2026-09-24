import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import CustomSelect from '../CustomSelect';

/**
 * Reusable TableFilters component for W1ns UI Kit
 * Standardized across All Tenders (Screen 3), My Offers (Screen 4), and Evaluation (Screen 6)
 */
export default function TableFilters({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Поиск...',
  filters = [], // Array of { id, value, onChange, options, placeholder, width, searchable }
  customControls = null, // Extra elements (e.g. date pickers)
  onReset = null, // Callback to clear all filters
  hasActiveFilters = false,
  role = 'ADMIN',
  isDarkMode = false,
  theme = {},
  className = '',
  t = (k, f) => f
}) {
  const inputBg = theme.inputBg || (isDarkMode 
    ? 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500' 
    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400');

  const cardBg = theme.cardBg || (isDarkMode 
    ? 'bg-[#111827] border-slate-800' 
    : 'bg-white border-slate-200/80');

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs transition-all ${cardBg} ${className}`}>
      {/* 1. Поисковая строка (слева, растягивается) */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-lg transition-all focus:outline-none ${inputBg}`}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title={t('clear', 'Очистить')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* 2. Правая часть: Набор селектов и кастомных фильтров */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Фильтры-дропдауны */}
        {filters.map((f) => {
          if (!f) return null;
          return (
            <div key={f.id} className={f.width || 'min-w-[160px]'}>
              <CustomSelect
                role={role}
                size="sm"
                value={f.value}
                onChange={f.onChange}
                options={f.options || []}
                searchable={Boolean(f.searchable)}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            </div>
          );
        })}

        {/* Кастомные контролы (например, DatePicker) */}
        {customControls}

        {/* Кнопка сброса фильтров (если активны) */}
        {onReset && hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className={`px-3 py-2 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={t('resetFilters', 'Сбросить фильтры')}
          >
            <RotateCcw size={13} />
            <span>{t('resetBtn', 'Сбросить')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
