import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Sparkles,
  Briefcase,
  Layers,
  Users,
} from 'lucide-react';
import { pluralize } from '../../utils/pluralize';
import { formatNumber, formatCurrency } from './analyticsUtils';

export default function AnalyticsKpiCards({
  kpi,
  meta,
  currencySymbol,
  isDarkMode,
  t,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* KPI 1: Общий объем торгов */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-medium">{t('totalProcurementVolume', 'Общий объем закупок')}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={15} />
          </div>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatCurrency(kpi?.totalVolume || 0, currencySymbol)}
        </div>
        <div className="flex items-center mt-2.5">
          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
            <TrendingUp size={11} className="mr-1" />
            {Number(kpi?.totalVolume || 0) > 0 ? meta?.delta || '+14.2%' : '0.0%'}
          </span>
          <span className="text-[11px] text-slate-400 ml-2">
            {Number(kpi?.totalVolume || 0) > 0
              ? t('vsPreviousPeriod', 'к прошлому периоду')
              : 'Ожидается запуск'}
          </span>
        </div>
      </div>

      {/* KPI 2: Экономия бюджета */}
      <div
        className={`p-5 rounded-2xl border transition-all relative group ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-medium">{t('budgetSavings', 'Экономия бюджета')}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles size={15} />
          </div>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatCurrency(kpi?.savingsAmount || 0, currencySymbol)}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {kpi?.savingsPercent || '0.0'}% {t('budgetSavings', 'экономии')}
          </span>
          <span
            className="text-[10px] text-slate-400 cursor-help"
            title={t('savingsHint', 'Разница между НМЦК и ценой победителей')}
          >
            ⓘ{' '}
            {Number(kpi?.savingsAmount || 0) === 0
              ? 'Торги на стадии приема'
              : t('savingsHint', 'НМЦК vs финал')}
          </span>
        </div>
      </div>

      {/* KPI 3: Проведено процедур */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-medium">{t('proceduresConducted', 'Проведено процедур')}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Briefcase size={15} />
          </div>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatNumber(kpi?.totalProcedures || 0)}{' '}
          <span className="text-sm font-normal text-slate-400">
            {pluralize(Number(kpi?.totalProcedures || 0), ['тендер', 'тендера', 'тендеров']).replace(
              /^\d+\s*/,
              ''
            )}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {kpi?.successfulProcedures || 0} {t('completedShort', 'успешно')}
          </span>
          <span>/</span>
          <span className="text-slate-400">
            {kpi?.cancelledProcedures || 0} {t('cancelledShort', 'не сост.')}
          </span>
        </div>
      </div>

      {/* KPI 4: Подано предложений (Конкуренция) */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-medium">{t('bidsSubmitted', 'Подано предложений')}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layers size={15} />
          </div>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatNumber(kpi?.totalOffers || 0)}{' '}
          <span className="text-sm font-normal text-slate-400">
            {pluralize(Number(kpi?.totalOffers || 0), ['заявка', 'заявки', 'заявок']).replace(
              /^\d+\s*/,
              ''
            )}
          </span>
        </div>
        <div className="flex items-center mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {t(
              'competitionAvg',
              `В среднем ${kpi?.competitionIndex || '0.0'} заявки на лот`,
              { ratio: kpi?.competitionIndex || '0.0' }
            )}
          </span>
        </div>
      </div>

      {/* KPI 5: Активные поставщики */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-medium">{t('activeSuppliersCount', 'Активные поставщики')}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users size={15} />
          </div>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatNumber(kpi?.activeSuppliers || 0)}{' '}
          <span className="text-sm font-normal text-slate-400">
            {pluralize(Number(kpi?.activeSuppliers || 0), ['компания', 'компании', 'компаний']).replace(
              /^\d+\s*/,
              ''
            )}
          </span>
        </div>
        <div className="flex items-center mt-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>+{kpi?.newSuppliersPeriod || 0} новых за период</span>
        </div>
      </div>
    </div>
  );
}
