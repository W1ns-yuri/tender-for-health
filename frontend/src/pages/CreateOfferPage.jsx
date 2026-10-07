import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';
import { useAlert } from '../context/AlertContext';

// Subcomponents & Hook
import {
  OfferHeader,
  OfferCommercialTermsCard,
  OfferLotsNavigation,
  OfferLotCard,
  OfferDocumentsCard,
  OfferStickyFooter,
  useCreateOfferState,
  formatFileSize
} from '../components/offer';
import { CatalogFormModal } from '../components/catalogs';

/**
 * CreateOfferPage
 * High-performance commercial offer submission page for suppliers.
 * Supports multi-lot offers, currency calculations, equivalent products,
 * document attachments, and category-based participation rules.
 */
export default function CreateOfferPage({ role = 'SUPPLIER', isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useCallback((key, fallback, params) => getTranslation(lang, key, fallback, params), [lang]);
  const theme = getRoleTheme(role, isDarkMode);
  const { showAlert, showConfirm } = useAlert();

  const {
    tender,
    loading,
    isVerified,
    currencies,
    deliveryTerms,
    products,
    categories,
    catalogModal,
    setCatalogModal,
    currency,
    setCurrency,
    paymentTerms,
    setPaymentTerms,
    comment,
    setComment,
    activeLotTab,
    setActiveLotTab,
    viewMode,
    setViewMode,
    selectedLots,
    toggleLotSelection,
    lotDeliveryTerms,
    setLotDeliveryTerms,
    supplierCategoryIds,
    offerItemsByLot,
    handleSpecFieldChange,
    uploadedFiles,
    handleRemoveFile,
    fileInputRef,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
    fileUploadError,
    setFileUploadError,
    isSubmitting,
    errorMsg,
    errorRef,
    handleOpenCatalogModal,
    handleSaveProductFromModal,
    calculateLotTotal,
    grandTotal,
    currencyCode,
    activeLotIds,
    pricedItemsCount,
    totalActiveItemsCount,
    handleSubmitOffer
  } = useCreateOfferState({ id, role, t, showAlert, showConfirm, navigate });

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 text-sm max-w-7xl mx-auto">
      {/* 1. Верхняя навигация, заголовок, карточка тендера и памятка об эквивалентах */}
      <OfferHeader
        tender={tender}
        isVerified={isVerified}
        grandTotal={grandTotal}
        currencyCode={currencyCode}
        pricedItemsCount={pricedItemsCount}
        totalActiveItemsCount={totalActiveItemsCount}
        theme={theme}
        navigate={navigate}
        t={t}
      />

      {/* 2. Основные параметры предложения */}
      <OfferCommercialTermsCard
        currencies={currencies}
        currency={currency}
        setCurrency={setCurrency}
        paymentTerms={paymentTerms}
        setPaymentTerms={setPaymentTerms}
        comment={comment}
        setComment={setComment}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 3. Таблицы по лотам с переключением табов */}
      <div className="space-y-4">
        <OfferLotsNavigation
          tender={tender}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeLotTab={activeLotTab}
          setActiveLotTab={setActiveLotTab}
          selectedLots={selectedLots}
          supplierCategoryIds={supplierCategoryIds}
          calculateLotTotal={calculateLotTotal}
          currencyCode={currencyCode}
          t={t}
        />

        {tender?.lots && tender.lots.length > 0 ? (
          (viewMode === 'tabs' && tender.lots.length > 1
            ? [tender.lots[Math.min(activeLotTab, tender.lots.length - 1)]]
            : tender.lots
          ).map((lot) => {
            const lotIdx = tender.lots.findIndex((l) => l.id === lot.id);
            return (
              <OfferLotCard
                key={lot.id}
                lot={lot}
                lotIdx={lotIdx}
                tender={tender}
                viewMode={viewMode}
                activeLotTab={activeLotTab}
                setActiveLotTab={setActiveLotTab}
                selectedLots={selectedLots}
                toggleLotSelection={toggleLotSelection}
                supplierCategoryIds={supplierCategoryIds}
                offerItemsByLot={offerItemsByLot}
                handleSpecFieldChange={handleSpecFieldChange}
                deliveryTerms={deliveryTerms}
                lotDeliveryTerms={lotDeliveryTerms}
                setLotDeliveryTerms={setLotDeliveryTerms}
                calculateLotTotal={calculateLotTotal}
                currencyCode={currencyCode}
                products={products}
                onOpenCatalogModal={handleOpenCatalogModal}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            );
          })
        ) : (
          <div className={`p-8 rounded-2xl border text-center text-slate-400 ${theme?.cardBg || ''}`}>
            {t('noLotsInTender', 'В тендере отсутствуют лоты')}
          </div>
        )}
      </div>

      {/* 4. Документы: Заказчик и Интерактивная Дропзона поставщика */}
      <OfferDocumentsCard
        tender={tender}
        uploadedFiles={uploadedFiles}
        handleRemoveFile={handleRemoveFile}
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        isDragging={isDragging}
        fileUploadError={fileUploadError}
        setFileUploadError={setFileUploadError}
        formatFileSize={formatFileSize}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 5. Нижняя фиксированная панель действий (Sticky Action Bar) */}
      <OfferStickyFooter
        errorRef={errorRef}
        errorMsg={errorMsg}
        isVerified={isVerified}
        grandTotal={grandTotal}
        currencyCode={currencyCode}
        activeLotIds={activeLotIds}
        pricedItemsCount={pricedItemsCount}
        totalActiveItemsCount={totalActiveItemsCount}
        isSubmitting={isSubmitting}
        handleSubmitOffer={handleSubmitOffer}
        navigate={navigate}
        t={t}
      />

      {/* 6. Модальное окно быстрого добавления товара в каталог */}
      {catalogModal.isOpen && (
        <CatalogFormModal
          isOpen={catalogModal.isOpen}
          onClose={() => setCatalogModal({ isOpen: false, lotId: null, itemIdx: null, field: null, initialName: '' })}
          onSave={handleSaveProductFromModal}
          catalogId="productsMNN"
          editingItem={catalogModal.initialName ? { name: catalogModal.initialName } : null}
          categories={categories}
          existingProducts={products}
          role="SUPPLIER"
          theme={theme}
          t={t}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
