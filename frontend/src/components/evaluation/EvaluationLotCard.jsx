import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import { cleanLotTitle } from '../../utils/pluralize';
import { formatIncoterms } from './evaluationUtils';
import EvaluationLotComparativeTable from './EvaluationLotComparativeTable';

/**
 * Карточка лота в рабочем столе оценки:
 * Шапка с номером, названием, статусом победителя, условиями поставки Incoterms,
 * и блок предложений (empty state либо сравнительная таблица поставщиков).
 */
export default function EvaluationLotCard({
  lot,
  lotIndex = 0,
  offers = [],
  expandedOffers = {},
  toggleOfferDetails,
  handleAwardLot,
  theme = {},
  t = (k, f) => f
}) {
  const lotSpecIds = (lot.specs || []).map(s => s.id);

  // Сбор предложений, поданных на этот лот
  const competingOffers = [];
  offers.forEach(offer => {
    const offerSpecsForLot = (offer.specs || []).filter(os => lotSpecIds.includes(os.tenderSpecId));
    if (offerSpecsForLot.length > 0) {
      const totalLotPrice = offerSpecsForLot.reduce((sum, os) => sum + (os.quantity * os.unitPrice), 0);
      const isAwarded = offerSpecsForLot.some(os => os.isAwarded);
      const currencyCode = offer.baseCurrency?.code || offer.currency || 'TMT';

      competingOffers.push({
        offerId: offer.id,
        supplierId: offer.supplier?.id || offer.supplierId,
        supplierName: offer.supplier?.name || 'Unknown',
        totalLotPrice: totalLotPrice.toFixed(2),
        numericTotal: totalLotPrice,
        currencyCode,
        isAwarded,
        itemsCount: offerSpecsForLot.length,
        totalItems: (lot.specs || []).length,
        offerSpecs: offerSpecsForLot,
        deliveryTerm: offer.deliveryTerm,
      });
    }
  });

  const minPrice = competingOffers.length > 0
    ? Math.min(...competingOffers.map(o => o.numericTotal))
    : 0;

  const hasWinner = competingOffers.some(o => o.isAwarded);
  const incotermsDisplay = formatIncoterms(lot.deliveryTerm);
  const dtName = (lot.deliveryTerm?.name || '').trim();

  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg || 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} transition-all`}>
      {/* Шапка лота */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
              {t('lotUpperLabel', 'ЛОТ')} #{lotIndex + 1}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {cleanLotTitle(lot.name, lotIndex)}
            </h3>
            {hasWinner && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle size={13} />
                {t('winnerSelectedBadge', 'Победитель выбран')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
            <p>
              {t('specItemsCountLabel', 'Позиций в спецификации:')}{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-bold">{(lot.specs || []).length}</strong>
            </p>
            {lot.deliveryTerm && (
              <p className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-4">
                <span className="uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
                  {t('deliveryIncotermsLabel', 'Поставка (Incoterms):')}
                </span>
                <strong 
                  className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded-md font-mono font-bold text-xs"
                  title={dtName ? `${incotermsDisplay} — ${dtName}` : undefined}
                >
                  {incotermsDisplay}
                </strong>
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('offersSubmittedCountLabel', 'Подано предложений:')}{' '}
            <strong className="text-slate-800 dark:text-slate-100 font-bold">{competingOffers.length}</strong>
          </span>
        </div>
      </div>

      {/* Контент лота */}
      {competingOffers.length === 0 ? (
        <div className="p-8">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 rounded-xl p-5 flex items-center gap-3.5 text-xs">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('noOffersForThisLot', 'Нет поданных предложений по данному лоту')}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('noSupplierBidsForLot', 'Ни один поставщик пока не подал заявку на спецификацию этого лота.')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <EvaluationLotComparativeTable
            lot={lot}
            competingOffers={competingOffers}
            minPrice={minPrice}
            expandedOffers={expandedOffers}
            toggleOfferDetails={toggleOfferDetails}
            handleAwardLot={handleAwardLot}
            theme={theme}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
