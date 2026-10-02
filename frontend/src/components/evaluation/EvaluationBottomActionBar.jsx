import React from 'react';
import { Trophy, Download, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Плавающая нижняя панель подтверждения и печати для экрана оценки.
 */
export default function EvaluationBottomActionBar({
  awardedLotsCount = 0,
  lotsWithOffersCount = 0,
  allLotsAwarded = false,
  onPrint,
  onComplete,
  t = (k, f) => f
}) {
  const percent = lotsWithOffersCount > 0 
    ? Math.round((awardedLotsCount / lotsWithOffersCount) * 100)
    : 0;

  return (
    <div className="sticky bottom-0 z-30 -mx-6 -mb-6 px-6 sm:px-8 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Индикатор прогресса слева */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{t('allocationSummaryTitle', 'Итоги распределения:')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {awardedLotsCount} {t('fromWord', 'из')} {lotsWithOffersCount} {t('lotsCountSuffix', 'лотов')}
              </span>
              {allLotsAwarded && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                  {t('allLotsAllocatedBadge', 'Все лоты распределены')}
                </span>
              )}
            </div>
            <div className="w-48 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Кнопки действий справа */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrint}
            leftIcon={<Download size={14} />}
            className="text-xs font-bold"
          >
            {t('exportPrintBtn', 'Экспорт / Печать')}
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={onComplete}
            leftIcon={<CheckCircle2 size={16} />}
            className="text-xs font-bold shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            {t('approveProtocolBtn', 'Утвердить протокол и объявить победителей')}
          </Button>
        </div>
      </div>
    </div>
  );
}
