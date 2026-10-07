import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';
import {
  useOfferDetailsState,
  OfferDetailsHeader,
  OfferLotGroupCard,
  OfferStandaloneTable,
  OfferDetailsDocuments
} from '../components/offer-details';

/**
 * OfferDetailsPage
 * Detailed commercial proposal view, supporting single & multi-lot tenders,
 * specifications breakdown, commercial terms, and attached documentation.
 */
export default function OfferDetailsPage({ role, lang = 'RU', isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';

  const {
    offer,
    loading,
    currencyCode,
    supplierName,
    tenderNumber,
    tenderTitle,
    rawSpecs,
    lotGroups,
    unassignedSpecs,
    formatDate,
    handleDownload
  } = useOfferDetailsState(id);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center justify-center space-y-3">
        <div className={`w-9 h-9 border-3 rounded-full animate-spin border-t-transparent ${
          isAdmin ? 'border-emerald-600' : 'border-blue-600'
        }`} />
        <span className="text-sm font-semibold">{t('loading', 'Загрузка данных заявки...')}</span>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className={`p-12 rounded-2xl border text-center text-slate-500 max-w-lg mx-auto my-8 ${theme.cardBg}`}>
        <p className="text-base font-bold text-slate-800 dark:text-slate-100">
          {t('offerNotFoundTitle', 'Коммерческое предложение не найдено')}
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {t('goBackBtn', 'Вернуться назад')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header & Commercial Terms Overview */}
      <OfferDetailsHeader
        offer={offer}
        role={role}
        lang={lang}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
        formatDate={formatDate}
        currencyCode={currencyCode}
        supplierName={supplierName}
        tenderNumber={tenderNumber}
        tenderTitle={tenderTitle}
        rawSpecsCount={rawSpecs.length}
        lotGroups={lotGroups}
      />

      {/* 2. Specifications & Lots Breakdown */}
      <section className="space-y-4" aria-label={t('offeredItemsByLotsTitle', 'Предложенные товары по лотам')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={20} className={theme.primaryText} />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {t('offeredItemsByLotsTitle', 'Предложенные товары по лотам')}
            </h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            isAdmin
              ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
          }`}>
            {t('lotsCountLabel', 'Лотов')}: {lotGroups.length || 1} | {t('positionsCountLabel', 'Позиций')}: {rawSpecs.length}
          </span>
        </div>

        {/* Multi-lot Breakdown or Standalone Table */}
        {lotGroups.length > 0 ? (
          lotGroups.map((group, groupIdx) => (
            <OfferLotGroupCard
              key={group.lot?.id || groupIdx}
              group={group}
              groupIdx={groupIdx}
              offer={offer}
              role={role}
              currencyCode={currencyCode}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />
          ))
        ) : (
          <OfferStandaloneTable
            specs={rawSpecs}
            currencyCode={currencyCode}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        )}

        {/* Unassigned Specifications (if present alongside lots) */}
        {unassignedSpecs.length > 0 && lotGroups.length > 0 && (
          <OfferStandaloneTable
            specs={unassignedSpecs}
            currencyCode={currencyCode}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
            isUnassigned={true}
          />
        )}

        {/* Total Cost Summary Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
            {t('totalCommercialProposalCostLabel', 'Итоговая стоимость коммерческого предложения:')}
          </span>
          <span className={`text-xl sm:text-2xl font-black ${theme.primaryText}`}>
            {(offer.offeredPrice || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
          </span>
        </div>
      </section>

      {/* 3. Attached Supplier Documents */}
      <OfferDetailsDocuments
        files={offer.files || []}
        handleDownload={handleDownload}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />
    </div>
  );
}
