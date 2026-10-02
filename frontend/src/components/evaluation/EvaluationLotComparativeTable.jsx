import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingDown, CheckCircle, X, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import EvaluationLotSpecBreakdown from './EvaluationLotSpecBreakdown';

/**
 * Сравнительная таблица предложений поставщиков по конкретному лоту.
 */
export default function EvaluationLotComparativeTable({
  lot,
  competingOffers = [],
  minPrice = 0,
  expandedOffers = {},
  toggleOfferDetails,
  handleAwardLot,
  theme = {},
  t = (k, f) => f
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={theme.tableHeaderBg || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}>
            <th className="py-3 px-4 font-semibold">{t('supplierStr', 'Поставщик')}</th>
            <th className="py-3 px-4 font-semibold text-center w-36">{t('lotCoverageColumn', 'Покрытие лота')}</th>
            <th className="py-3 px-4 font-semibold text-right w-48">{t('lotTotalAmountColumn', 'Итоговая сумма лота')}</th>
            <th className="py-3 px-4 font-semibold text-center w-32">{t('priceComparisonColumn', 'Сравнение цен')}</th>
            <th className="py-3 px-4 font-semibold text-center w-48">{t('lotDecisionColumn', 'Решение по лоту')}</th>
            <th className="py-3 px-4 font-semibold text-right w-36">{t('lotOfferDetailsBtn', 'Подробности')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {competingOffers.map(co => {
            const isLowest = minPrice > 0 && Math.abs(co.numericTotal - minPrice) < 0.01;
            const priceDiffPercent = minPrice > 0 
              ? (((co.numericTotal - minPrice) / minPrice) * 100).toFixed(1)
              : 0;

            return (
              <React.Fragment key={co.offerId}>
                <tr className={`${co.isAwarded ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : theme.tableRowHover || ''} transition-colors`}>
                  {/* Поставщик */}
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {co.isAwarded && <Trophy size={16} className="text-amber-500 shrink-0" />}
                      <Link
                        to={`/suppliers/${co.supplierId}`}
                        className={`font-semibold text-sm ${
                          co.isAwarded 
                            ? 'text-emerald-700 dark:text-emerald-400' 
                            : 'text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400'
                        } transition-colors underline decoration-dotted underline-offset-4`}
                      >
                        {co.supplierName}
                      </Link>
                    </div>

                    {/* Условия поставки поставщика */}
                    {co.deliveryTerm && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t('deliveryLabel', 'Поставка:')}
                        </span>
                        <span 
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            lot.deliveryTerm && (co.deliveryTerm?.shortName || '').toLowerCase() !== (lot.deliveryTerm?.shortName || '').toLowerCase()
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                          title={co.deliveryTerm?.name}
                        >
                          {co.deliveryTerm?.shortName || co.deliveryTerm?.name}
                          {lot.deliveryTerm && (co.deliveryTerm?.shortName || '').toLowerCase() !== (lot.deliveryTerm?.shortName || '').toLowerCase() && (
                            <span className="ml-1 text-[9px] font-sans font-normal opacity-90">
                              ({t('differsFromSpecsBadge', 'отличается от ТЗ')})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Покрытие лота */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      co.itemsCount === co.totalItems
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {co.itemsCount} / {co.totalItems} {t('positionsAbbr', 'поз.')} ({Math.round((co.itemsCount / co.totalItems) * 100)}%)
                    </span>
                  </td>

                  {/* Итоговая сумма с кодом валюты */}
                  <td className="py-3 px-4 text-right">
                    <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      {Number(co.totalLotPrice).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {co.currencyCode}
                    </div>
                    {isLowest && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        <TrendingDown size={11} />
                        {t('bestPriceBadge', 'Лучшая цена')}
                      </span>
                    )}
                  </td>

                  {/* Сравнение цен */}
                  <td className="py-3 px-4 text-center">
                    {isLowest ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        {t('baselineMinBadge', 'Базовая мин.')}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        +{priceDiffPercent}%
                      </span>
                    )}
                  </td>

                  {/* Кнопка решения по лоту (Победитель / Снять выбор) */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleAwardLot(lot.id, co.offerId, co.isAwarded)}
                      title={co.isAwarded ? t('clickToDeselectTooltip', 'Нажмите, чтобы снять выбор') : undefined}
                      className={`group/award px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                        co.isAwarded 
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-700 border border-emerald-600' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {co.isAwarded ? (
                        <>
                          <CheckCircle size={14} className="group-hover/award:hidden" />
                          <X size={14} className="hidden group-hover/award:inline text-rose-600 dark:text-rose-400" />
                          <span className="group-hover/award:hidden">{t('winnerBadge', 'Победитель')}</span>
                          <span className="hidden group-hover/award:inline text-rose-600 dark:text-rose-400">
                            {t('deselectChoice', 'Снять выбор')}
                          </span>
                        </>
                      ) : (
                        <span>{t('selectAsWinnerBtn', 'Выбрать победителем')}</span>
                      )}
                    </button>
                  </td>

                  {/* Действия и спецификация */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/offers/${co.offerId}`}
                        className={theme.actionBtn || 'p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}
                        title={t('openCompleteBidBtn', 'Открыть полную заявку')}
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleOfferDetails(co.offerId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <span>{t('specificationTabTitle', 'Спецификация')}</span>
                        {expandedOffers[co.offerId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Вложенная спецификация лота */}
                {expandedOffers[co.offerId] && (
                  <EvaluationLotSpecBreakdown
                    co={co}
                    lot={lot}
                    t={t}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
