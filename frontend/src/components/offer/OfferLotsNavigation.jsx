import React from 'react';

export default function OfferLotsNavigation({
  tender,
  viewMode,
  setViewMode,
  activeLotTab,
  setActiveLotTab,
  selectedLots = {},
  supplierCategoryIds = [],
  calculateLotTotal,
  currencyCode = 'TMT',
  t
}) {
  if (!tender?.lots || tender.lots.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t('lotsPricesSpecsTitle', 'Цены и спецификации по лотам')}
          </h3>
          {tender.lots.length > 1 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {t('lotsNavigationHint', 'Переключайтесь между лотами для заполнения цен и условий')}
            </p>
          )}
        </div>

        {tender.lots.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('viewModeByLots', 'По лотам')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('viewModeAllLots', 'Все лоты сразу')}
            </button>
          </div>
        )}
      </div>

      {/* Табы лотов (при наличии нескольких лотов в режиме по лотам) */}
      {tender.lots.length > 1 && viewMode === 'tabs' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {tender.lots.map((lot, idx) => {
            const isAllowed = !lot.categoryId || supplierCategoryIds.length === 0 || supplierCategoryIds.includes(lot.categoryId);
            const isSelected = Boolean(selectedLots[lot.id]) && isAllowed;
            const lotTotal = calculateLotTotal ? calculateLotTotal(lot.id) : 0;
            const isActiveTab = activeLotTab === idx;

            return (
              <button
                key={lot.id || idx}
                type="button"
                onClick={() => setActiveLotTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
                  isActiveTab
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : isSelected
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-transparent opacity-60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? (isActiveTab ? 'bg-white' : 'bg-blue-500') : 'bg-slate-300'}`}></span>
                <span>{t('lotUpperLabel', 'Лот')} #{idx + 1}: {lot.name}</span>
                {isSelected && lotTotal > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActiveTab ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
