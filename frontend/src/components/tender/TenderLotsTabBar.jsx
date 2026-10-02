import React from 'react';
import { Bookmark, X, Plus } from 'lucide-react';

export default function TenderLotsTabBar({
  lots = [],
  activeLotIndex,
  setActiveLotIndex,
  activeLotDirty,
  setActiveLotDirty,
  handleDeleteActiveLot,
  handleAddNewLotTab,
  t = (k, f) => f
}) {
  return (
    <div className="flex items-end gap-1.5 -mb-[1px] relative z-10 overflow-x-auto scrollbar-thin">
      {lots.map((lot, idx) => {
        const isActive = activeLotIndex === idx;
        const specsCount = (lot.specs || []).length;
        const isDirty = isActive && activeLotDirty;
        const isReady = specsCount > 0 && !isDirty;

        return (
          <div
            key={lot.id || idx}
            onClick={() => {
              if (activeLotIndex !== idx) {
                setActiveLotIndex(idx);
                setActiveLotDirty(false);
              }
            }}
            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-t-2 border-x transition-all cursor-pointer shrink-0 select-none ${
              isActive
                ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs z-10'
                : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
            }`}
          >
            {/* Трехцветный микро-индикатор готовности */}
            {isDirty ? (
              <span 
                className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" 
                title={t('unsavedDraft', 'Есть несохраненные правки')}
              />
            ) : isReady ? (
              <span 
                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" 
                title={t('lotReady', 'Готов к торгам')}
              />
            ) : (
              <span 
                className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" 
                title={t('lotEmpty', 'Пустой (0 поз.)')}
              />
            )}

            <Bookmark size={13} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
            
            {/* Информативный заголовок лота */}
            <span className={`max-w-xs md:max-w-sm truncate ${isActive ? 'font-black text-slate-800 dark:text-slate-100' : 'font-medium'}`}>
              {`Лот ${lot.lotNumber || idx + 1}: ${lot.name || `Лот №${lot.lotNumber || idx + 1}`}`}
            </span>

            {/* Счетчик позиций спецификации */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {specsCount} {t('shortPosition', 'поз.')}
            </span>

            {/* Кнопка закрытия / удаления лота */}
            {lots.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteActiveLot(idx);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                title={t('closeLotTab', 'Удалить лот')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      {/* Кнопка добавления нового таба лота */}
      <button
        type="button"
        onClick={handleAddNewLotTab}
        className="px-3.5 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer shrink-0 border border-dashed border-emerald-400/60 dark:border-emerald-700/60 mb-0.5"
      >
        <Plus size={14} />
        <span>{t('addLotTab', '+ Добавить лот')}</span>
      </button>
    </div>
  );
}
