import React from 'react';
import { Lock } from 'lucide-react';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { TenderDetailsSkeleton } from '../components/ui';
import { useTenderDetailsState } from '../components/tender-details/useTenderDetailsState';
import TenderDetailsClosedAccessDenied from '../components/tender-details/TenderDetailsClosedAccessDenied';
import TenderDetailsHeader from '../components/tender-details/TenderDetailsHeader';
import TenderDetailsStepper from '../components/tender-details/TenderDetailsStepper';
import TenderDetailsLotsTab from '../components/tender-details/TenderDetailsLotsTab';
import TenderDetailsLegacySpecs from '../components/tender-details/TenderDetailsLegacySpecs';
import TenderDetailsDocuments from '../components/tender-details/TenderDetailsDocuments';
import TenderDetailsInvitedSuppliers from '../components/tender-details/TenderDetailsInvitedSuppliers';

export default function TenderDetails({
  tenderId,
  role,
  isDarkMode,
  lang = 'RU',
}) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const {
    tender,
    data,
    loading,
    fetchError,
    activeLotTab,
    setActiveLotTab,
    supplierProfile,
    isSupplierVerified,
    hasSubmittedOffer,
    docsList,
    winningOffer,
    lifecycleStep,
    formatDate,
    getClientName,
    getCategoryName,
    handleDownload,
    navigate,
  } = useTenderDetailsState({ tenderId, role, t });

  // Ошибка доступа к закрытому тендеру
  if (fetchError) {
    return (
      <TenderDetailsClosedAccessDenied
        fetchError={fetchError}
        theme={theme}
        onBack={() => navigate('/tenders')}
        t={t}
      />
    );
  }

  // Скелетон загрузки
  if (loading || !tender) {
    return <TenderDetailsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Главная карточка с параметрами, статусами и действиями */}
      <TenderDetailsHeader
        data={data}
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        isSupplierVerified={isSupplierVerified}
        hasSubmittedOffer={hasSubmittedOffer}
        supplierProfile={supplierProfile}
        formatDate={formatDate}
        getClientName={getClientName}
        getCategoryName={getCategoryName}
        navigate={navigate}
        lang={lang}
        t={t}
      />

      {/* 2. Интерактивный 5-шаговый прогресс-бар жизненного цикла закупки */}
      <TenderDetailsStepper
        status={data?.status}
        lifecycleStep={lifecycleStep}
        theme={theme}
        isDarkMode={isDarkMode}
        t={t}
      />

      {/* 3. Лоты и спецификации либо резервная таблица для старых тендеров */}
      <div className="space-y-4">
        {data?.lots && data.lots.length > 0 ? (
          <TenderDetailsLotsTab
            lots={data.lots}
            activeLotTab={activeLotTab}
            setActiveLotTab={setActiveLotTab}
            winningOffer={winningOffer}
            role={role}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        ) : (
          <TenderDetailsLegacySpecs
            specs={data.specs}
            offers={data.offers}
            status={data.status}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        )}

        {/* Баннер закрытого тендера для приглашенного поставщика */}
        {role === 'SUPPLIER' && data?.visibility === 'YAPYK' && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <Lock size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                {t('invitedToClosedTenderTitle', 'Вы приглашены к участию в закрытой закупке')}
              </h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {t(
                  'invitedToClosedTenderDesc',
                  'Данный тендер является закрытым и доступен только для выбранного круга поставщиков. Вы можете изучить документацию и подать коммерческое предложение.'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Таблица тендерной документации */}
      <TenderDetailsDocuments
        docsList={docsList}
        onDownload={handleDownload}
        formatDate={formatDate}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 5. Мониторинг приглашенных участников (для Администратора при закрытом тендере) */}
      {role === 'ADMIN' && data?.visibility === 'YAPYK' && (
        <TenderDetailsInvitedSuppliers
          invitedSuppliers={data?.invitedSuppliers}
          offers={data?.offers}
          formatDate={formatDate}
          isDarkMode={isDarkMode}
          theme={theme}
          t={t}
        />
      )}
    </div>
  );
}
