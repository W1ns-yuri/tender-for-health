import React from 'react';
import { MapPin } from 'lucide-react';
import { formatCurrency } from './analyticsUtils';

export default function AnalyticsRegionalDistribution({
  regions = [],
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
            {t('regionalActivityTitle', 'Географическая активность (Велаяты)')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Охват регионов Туркменистана и концентрация медицинских госзакупок
          </p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <MapPin size={16} />
        </div>
      </div>

      {!regions || regions.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400">
            {t('noRegionsData', 'Нет региональных данных за период')}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {regions.map((region) => (
            <div key={region.id} className="flex items-center justify-between gap-3 text-xs">
              {/* Название региона */}
              <div className="w-44 shrink-0">
                <div
                  className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                  title={region.name}
                >
                  {region.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {region.tenders} {t('tendersCount', 'тендеров')}
                </div>
              </div>

              {/* Полоса охвата */}
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(region.percent, 3)}%` }}
                />
              </div>

              {/* Финансовая сумма и процент */}
              <div className="w-28 text-right tabular-nums shrink-0 whitespace-nowrap">
                <div className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(region.amount, currencySymbol)}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {region.percent}% объема
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
