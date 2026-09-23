import React from 'react';
import { AlertCircle, CheckCircle2, Info, Send } from 'lucide-react';

export default function OfferStickyFooter({
  errorRef,
  errorMsg,
  isVerified = true,
  grandTotal = 0,
  currencyCode = 'TMT',
  activeLotIds = [],
  pricedItemsCount = 0,
  totalActiveItemsCount = 0,
  isSubmitting = false,
  handleSubmitOffer,
  navigate,
  t
}) {
  return (
    <div ref={errorRef} className="space-y-4 pt-2">
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-md">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-30 -mx-6 -mb-6 px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        {!isVerified && (
          <div className="w-full p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200">
            <AlertCircle size={15} />
            {t('unverifiedProfileBlockNotice', 'Ваш профиль не прошел верификацию. Подача предложений заблокирована.')}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          {/* Левая часть: сумма, индикатор готовности и статистика */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full transition-all shrink-0 ${
                grandTotal > 0 && pricedItemsCount > 0
                  ? 'bg-blue-600 shadow-sm shadow-blue-500/50 ring-4 ring-blue-100 dark:ring-blue-900/40'
                  : 'bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-900/30'
              }`} />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                  {t('totalOfferAmountTitle', 'Итоговая сумма заявки')}:
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                </span>
              </div>
            </div>
            <div className="hidden md:block pl-5 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {t('selectedLotsCountStr', `Выбрано лотов: ${activeLotIds.length}`, { count: activeLotIds.length, activeLotsCount: activeLotIds.length })}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} className={pricedItemsCount > 0 ? "text-emerald-500" : "text-slate-400"} />
                <span>{t('pricedItemsProgress', `Оценено: ${pricedItemsCount} из ${totalActiveItemsCount} позиций`, { pricedItemsCount, totalActiveItemsCount })}</span>
              </div>
            </div>
          </div>

          {/* Правая часть: подсказка при нуле + кнопки действий */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {grandTotal <= 0 && isVerified && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Info size={14} className="shrink-0" />
                <span>{t('specifyAtLeastOnePrice', 'Укажите цену хотя бы по одной позиции выбранного лота')}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate ? navigate(-1) : window.history.back()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer"
            >
              {t('cancelBtn', 'Отмена')}
            </button>

            <button
              type="button"
              onClick={handleSubmitOffer}
              disabled={isSubmitting || grandTotal <= 0 || !isVerified}
              className={`px-7 py-3 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                grandTotal <= 0 || !isVerified
                  ? 'bg-blue-300 dark:bg-blue-900/40 text-white cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <Send size={16} />
              <span>
                {isSubmitting 
                  ? t('saving', 'Iberilýär...') 
                  : (t('submitProposalBtn', 'Отправить коммерческое предложение'))
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
