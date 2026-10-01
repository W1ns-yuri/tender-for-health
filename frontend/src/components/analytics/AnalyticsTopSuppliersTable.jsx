import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import { formatCurrency } from './analyticsUtils';

export default function AnalyticsTopSuppliersTable({
  topSuppliers = [],
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
            {t('topSuppliersLeaderboard', 'Топ-5 поставщиков по сумме побед')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Рейтинг победителей по общему объему заключенных государственных контрактов
          </p>
        </div>
        <Award size={20} className="text-amber-500" />
      </div>

      {!topSuppliers || topSuppliers.length === 0 ? (
        <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
            <Award size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('noCompletedTendersYet', 'Нет завершенных торгов с победителями')}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {t(
              'noCompletedTendersDesc',
              'Рейтинг поставщиков сформируется автоматически после подведения итогов открытых процедур.'
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-3 px-3 font-semibold whitespace-nowrap">{t('rankColumn', '#')}</th>
                <th className="py-3 px-3 font-semibold min-w-50">
                  {t('companyName', 'Наименование компании')}
                </th>
                <th className="py-3 px-3 font-semibold">{t('directionField', 'Направление')}</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  {t('lotsWonCount', 'Выиграно лотов')}
                </th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                  {t('totalContractSum', 'Сумма контрактов')}
                </th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                  {t('winRateLabel', 'Win Rate %')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topSuppliers.map((sup) => {
                const isTop1 = sup.rank === 1;
                const isTop2 = sup.rank === 2;
                const isTop3 = sup.rank === 3;
                return (
                  <tr
                    key={sup.rank}
                    className={`transition-colors ${
                      isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Позиция с медалью */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                          isTop1
                            ? 'bg-amber-400 text-slate-900 shadow-xs shadow-amber-400/50'
                            : isTop2
                            ? 'bg-slate-300 text-slate-900'
                            : isTop3
                            ? 'bg-amber-700/80 text-white'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sup.rank}
                      </span>
                    </td>

                    {/* Компания */}
                    <td className="py-3.5 px-3 min-w-50">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center">
                        <span
                          className="max-w-45 sm:max-w-65 md:max-w-85 truncate"
                          title={sup.name}
                        >
                          {sup.name}
                        </span>
                        <ShieldCheck size={13} className="text-emerald-500 ml-1.5 shrink-0" />
                      </div>
                    </td>

                    {/* Направление */}
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {sup.category}
                    </td>

                    {/* Выиграно лотов */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {sup.winsCount}
                    </td>

                    {/* Сумма контрактов */}
                    <td className="py-3.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(sup.totalContracts, currencySymbol)}
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {sup.winRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
