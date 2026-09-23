import React from 'react';
import { AlertCircle, Check, Save } from 'lucide-react';

export default function TenderLotStickyFooter({
  activeLot,
  activeLotIndex,
  activeLotDirty,
  savingActiveLot,
  handleSaveActiveLot,
  t
}) {
  if (!activeLot) return null;

  return (
    <div className="sticky bottom-0 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-4 -mx-6 -mb-6 rounded-b-2xl shadow-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        {activeLotDirty ? (
          <span className="text-xs text-amber-600 font-bold flex items-center gap-1.5 animate-pulse">
            <AlertCircle size={15} />
            <span>● {t('unsavedChanges', 'Есть несохраненные изменения')}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
            <Check size={15} className="text-emerald-600" />
            <span>{t('allChangesSaved', 'Все изменения сохранены')}</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleSaveActiveLot}
        disabled={savingActiveLot}
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
      >
        <Save size={15} />
        <span>
          {savingActiveLot 
            ? t('saving', 'Сохранение...') 
            : t('saveLotBtn', `Сохранить лот №${activeLot.lotNumber || activeLotIndex + 1}`)}
        </span>
      </button>
    </div>
  );
}
