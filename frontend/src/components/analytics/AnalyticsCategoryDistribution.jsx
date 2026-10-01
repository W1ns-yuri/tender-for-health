import React from 'react';
import { formatCurrency } from './analyticsUtils';

export default function AnalyticsCategoryDistribution({
  categories = [],
  currencySymbol = 'TMT',
  isDarkMode = false,
  t,
}) {
  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-[#111827] border-slate-800 shadow-md'
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('topCategoriesTitle', 'Топ категорий по бюджету')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Распределение финансового объема по отраслевым сегментам медицины
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {categories.length} сегментов
        </span>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400">
            {t('noCategoriesData', 'Нет зарегистрированных категорий за период')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center min-w-0 pr-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold mr-2 shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="truncate" title={cat.name}>
                    {cat.name}
                  </span>
                </span>
                <div className="flex items-center space-x-2 tabular-nums shrink-0 whitespace-nowrap">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount, currencySymbol)}
                  </span>
                  <span className="text-slate-400 text-[11px]">({cat.percent}%)</span>
                </div>
              </div>

              {/* Прогресс-бар с изумрудным градиентом */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{ width: `${Math.max(cat.percent, 3)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>
                  {cat.tenders} {t('tendersCount', 'тендеров')}
                </span>
                <span>Доля: {cat.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
