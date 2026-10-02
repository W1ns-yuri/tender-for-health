import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import {
  useEvaluationDetails,
  EvaluationDetailsHeader,
  EvaluationOverviewCard,
  EvaluationLotCard,
  EvaluationBottomActionBar,
} from '../components/evaluation';

/**
 * Страница детальной оценки и подведения итогов тендера (Evaluation Details).
 * Архитектурно декомпозирована на специализированные компоненты и кастомный хук useEvaluationDetails.
 */
export default function EvaluationDetailsPage({ role, isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const theme = getRoleTheme(role, isDarkMode);
  const t = useCallback((key, fallback) => getTranslation(lang, key, fallback), [lang]);
  const { showAlert, showConfirm } = useAlert();

  const {
    tenderDetails,
    loading,
    expandedOffers,
    toggleOfferDetails,
    handleAwardLot,
    handleCompleteEvaluation,
    handlePrint,
    lotsList,
    lotsWithOffers,
    awardedLots,
    allLotsAwarded,
    effectiveStatus,
  } = useEvaluationDetails({
    id,
    showAlert,
    showConfirm,
    t,
  });

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('loadingEvaluationWorkspace', 'Загрузка рабочего стола оценки...')}
        </p>
      </div>
    );
  }

  if (!tenderDetails) {
    return (
      <div className="p-12 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('tenderNotFoundTitle', 'Тендер не найден')}
        </h2>
        <Link
          to="/evaluation"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
        >
          <ArrowLeft size={14} />
          {t('returnToEvaluationRegistry', 'Вернуться к реестру оценки')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* 1. Верхняя панель навигации с кнопкой «Назад» и печатью */}
      <EvaluationDetailsHeader
        tenderId={tenderDetails.id}
        tenderNumber={tenderDetails.tenderNumber}
        onPrint={handlePrint}
        t={t}
      />

      {/* 2. Сводная карточка тендера с метаданными и статусом */}
      <EvaluationOverviewCard
        tenderDetails={tenderDetails}
        effectiveStatus={effectiveStatus}
        awardedLotsCount={awardedLots.length}
        lotsWithOffersCount={lotsWithOffers.length}
        lotsList={lotsList}
        theme={theme}
        isDarkMode={isDarkMode}
        lang={lang}
        t={t}
      />

      {/* 3. Рабочая область по лотам с попозиционным сравнением */}
      <div className="space-y-8 mb-16">
        {lotsList.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${theme.cardBg} text-slate-400`}>
            <AlertCircle size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold">{t('noItemsOrLotsInTender', 'В данном тендере нет позиций или лотов')}</p>
          </div>
        ) : (
          lotsList.map((lot, lotIndex) => (
            <EvaluationLotCard
              key={lot.id}
              lot={lot}
              lotIndex={lotIndex}
              offers={tenderDetails.offers || []}
              expandedOffers={expandedOffers}
              toggleOfferDetails={toggleOfferDetails}
              handleAwardLot={handleAwardLot}
              theme={theme}
              t={t}
            />
          ))
        )}
      </div>

      {/* 4. Плавающая нижняя панель подтверждения и печати */}
      <EvaluationBottomActionBar
        awardedLotsCount={awardedLots.length}
        lotsWithOffersCount={lotsWithOffers.length}
        allLotsAwarded={allLotsAwarded}
        onPrint={handlePrint}
        onComplete={handleCompleteEvaluation}
        t={t}
      />
    </div>
  );
}
