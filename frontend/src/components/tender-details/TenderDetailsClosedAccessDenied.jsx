import React from 'react';
import { Lock } from 'lucide-react';

export default function TenderDetailsClosedAccessDenied({
  fetchError,
  theme,
  onBack,
  t,
}) {
  return (
    <div
      className={`p-8 rounded-2xl border shadow-sm ${theme.cardBg} flex flex-col items-center justify-center text-center my-8`}
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-xs border border-amber-200/80 dark:border-amber-800/60">
        <Lock size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
        {t('closedTenderAccessDeniedTitle', 'Доступ к закрытому тендеру ограничен')}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {fetchError}
      </p>
      <button
        type="button"
        onClick={onBack}
        className={`px-5 py-2.5 ${theme.primaryBtn} rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer`}
      >
        {t('backToTendersList', 'Вернуться к списку тендеров')}
      </button>
    </div>
  );
}
