import React from 'react';
import { Building2 } from 'lucide-react';
import { formatCurrency } from './analyticsUtils';

export default function AnalyticsTopClientsCards({
  topClients = [],
  currencySymbol = 'TMT',
  isDarkMode = false,
  t,
}) {
  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('topClientsTitle', 'Ключевые заказчики')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Организации Минздрава по бюджетной активности
          </p>
        </div>
        <Building2 size={18} className="text-slate-400" />
      </div>

      {!topClients || topClients.length === 0 ? (
        <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
            <Building2 size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('noClientsData', 'Нет данных по заказчикам')}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Список заказчиков появится при публикации процедур в системе.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topClients.map((client) => (
            <div
              key={client.rank}
              className={`p-3.5 rounded-xl border transition-all ${
                isDarkMode
                  ? 'bg-[#0b0f17] border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 leading-snug">
                {client.name}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {client.procedures} {t('proceduresCount', 'процедур')}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                  {formatCurrency(client.budget, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 pt-1 border-t border-slate-200/40 dark:border-slate-800">
                <span>{t('averageCompetition', 'Конкуренция')}:</span>
                <span className="font-semibold">{client.avgCompetition} заявки / лот</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
