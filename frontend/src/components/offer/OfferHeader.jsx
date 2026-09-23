import React from 'react';
import { Clock, CheckCircle2, Info } from 'lucide-react';

export default function OfferHeader({
  tender,
  isVerified,
  grandTotal = 0,
  currencyCode = 'TMT',
  pricedItemsCount = 0,
  totalActiveItemsCount = 0,
  theme,
  navigate,
  t
}) {
  return (
    <div className="space-y-6">
      {/* 1. Верхняя навигация и заголовок */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-black tracking-tight ${theme?.primaryText || ''}`}>
            {t('offerDetailsTitle', 'Подача коммерческого предложения')}
          </h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
            {tender?.tenderNumber}
          </span>
        </div>
      </div>

      {/* Баннер предупреждения для неверифицированного поставщика */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">
                {t('verificationRequiredToBidTitle', 'Требуется верификация компании')}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {t('completeProfileToBidNotice', 'Для подачи ценовых предложений необходимо заполнить реквизиты и прикрепить документы в профиле.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            {t('goToProfileBtn', 'Перейти в профиль')}
          </button>
        </div>
      )}

      {/* 2. Карточка тендера и Информационный блок */}
      <div className={`p-6 rounded-2xl border shadow-xs ${theme?.cardBg || ''}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{tender?.title}</h2>
            {tender?.description && (
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">{tender.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 font-medium pt-1">
              {tender?.client?.name && (
                <span>
                  <span className="text-slate-400">{t('clientWithColon', 'Заказчик:')}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{tender.client.name}</strong>
                </span>
              )}
              {tender?.deadline && (
                <span>
                  <span className="text-slate-400">{t('deadlineUntilLabel', 'Срок подачи до:')}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{new Date(tender.deadline).toLocaleDateString('ru-RU')}</strong>
                </span>
              )}
              <span>
                <span className="text-slate-400">{t('statusWithColon', 'Статус:')}</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('visibilityPublic', 'Прием заявок открыт')}</strong>
              </span>
            </div>
          </div>

          {/* Виджет итоговой суммы предложения (компактный, расширяется по контенту) */}
          <div className="shrink-0 px-5 py-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-right shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
              {t('totalOfferCost', 'Итоговая стоимость заявки')}
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 my-0.5 whitespace-nowrap">
              {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={13} className={pricedItemsCount > 0 ? "text-emerald-600" : "text-slate-400"} />
              <span>{t('pricedItemsProgress', `Оценено: ${pricedItemsCount} из ${totalActiveItemsCount} позиций`, { pricedItemsCount, totalActiveItemsCount })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Памятка об эквивалентах и процедуре равных условий */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {t('analogsProcedureNotice', 'Процедура предложения аналогов и эквивалентов')}
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
            {t('analogsGuidelinesText', 'Количество позиций зафиксировано в строгом соответствии с потребностью заказчика. Если вы предлагаете сертифицированный эквивалент/аналог, включите опцию «Предложить эквивалент / аналог» в строке позиции и подробно укажите торговое наименование и обоснование (МНН, характеристики, дозировка). Все заявки с эквивалентами оцениваются экспертной комиссией на общих основаниях.')}
          </p>
        </div>
      </div>
    </div>
  );
}
