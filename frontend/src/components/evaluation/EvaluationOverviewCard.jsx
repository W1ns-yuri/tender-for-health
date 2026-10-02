import React from 'react';
import { Building2, Clock } from 'lucide-react';
import { getStatusBadge } from '../../utils/statusUtils';
import { pluralize } from '../../utils/pluralize';

/**
 * Сводная карточка информации о тендере:
 * Номер, статус закупки, счетчик распределенных лотов, наименование и 4 блока метаданных.
 */
export default function EvaluationOverviewCard({
  tenderDetails,
  effectiveStatus,
  awardedLotsCount = 0,
  lotsWithOffersCount = 0,
  lotsList = [],
  theme = {},
  isDarkMode = false,
  lang = 'RU',
  t = (k, f) => f
}) {
  if (!tenderDetails) return null;

  return (
    <div className={`rounded-2xl border shadow-xs p-6 ${theme.cardBg || ''} space-y-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {tenderDetails.tenderNumber}
            </span>
            {getStatusBadge(effectiveStatus, lang, isDarkMode)}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {t('resultsByLotsSummary', 'Итоги по лотам')}:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {awardedLotsCount}
              </strong>{' '}
              / {lotsWithOffersCount}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
            {tenderDetails.title}
          </h2>
        </div>
      </div>

      {/* 4 блока метаданных */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Заказчик */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            {t('client', 'Заказчик')}
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 size={15} className="text-slate-400 shrink-0" />
            <span className="truncate">{tenderDetails.client?.name || '—'}</span>
          </p>
        </div>

        {/* Категория и тип */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            {t('categoryAndTypeSummary', 'Категория и тип')}
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {tenderDetails.category?.name || '—'}
            <span className="text-xs text-slate-400 font-normal ml-1.5">
              ({tenderDetails.type === 'YERLI' ? t('typeLocal', 'Местный') : t('typeGlobal', 'Международный')})
            </span>
          </p>
        </div>

        {/* Срок подачи */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            {t('submissionDeadlineSummary', 'Крайний срок подачи')}
          </p>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Clock size={15} className="shrink-0" />
            <span>
              {tenderDetails.deadline ? new Date(tenderDetails.deadline).toLocaleDateString('ru-RU') : '—'}
            </span>
          </p>
        </div>

        {/* Лоты и заявки */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            {t('lotsAndBidsTab', 'Лоты и заявки')}
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {pluralize(lotsList.length, ['лот', 'лота', 'лотов'])} •{' '}
            {pluralize((tenderDetails.offers || []).length, ['заявка', 'заявки', 'заявок'])}
          </p>
        </div>
      </div>
    </div>
  );
}
