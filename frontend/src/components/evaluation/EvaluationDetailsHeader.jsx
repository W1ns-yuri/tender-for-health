import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ExternalLink } from 'lucide-react';

/**
 * Верхняя панель навигации страницы оценки:
 * Кнопка «Назад», хлебные крошки, заголовок процедуры, печать и переход к тендеру.
 */
export default function EvaluationDetailsHeader({
  tenderId,
  tenderNumber = '',
  onPrint,
  t = (k, f) => f
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/evaluation')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs"
          title={t('backToTendersList', 'Назад к списку тендеров')}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/evaluation" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t('evaluationTab', 'Оценка заявок')}
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
              {tenderNumber}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            {t('evaluationDetailsHeading', 'Оценка предложений по закупке')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Printer size={14} />
          <span>{t('printProtocolBtn', 'Печать протокола')}</span>
        </button>

        <Link
          to={`/tenders/${tenderId}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-colors shadow-2xs"
        >
          <ExternalLink size={14} />
          <span>{t('openTenderAction', 'Открыть тендер')}</span>
        </Link>
      </div>
    </div>
  );
}
