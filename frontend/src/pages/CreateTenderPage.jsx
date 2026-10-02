import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import { CatalogFormModal } from '../components/catalogs';

// Subcomponents & Hook
import {
  TenderHeader,
  TenderTopNavigationTabs,
  TenderGeneralParamsTab,
  TenderLotsManagerTab,
  TenderGeneralDocumentsTab,
  useCreateTenderState,
} from '../components/tender';

/**
 * Страница создания / редактирования тендера (Admin).
 * Декомпозирована по стандартам Senior Fullstack Architect:
 * - Бизнес-логика, API-запросы и валидации вынесены в `useCreateTenderState`.
 * - Интерфейс организован в модульные компоненты табов и навигации.
 */
export default function CreateTenderPage({
  onNavigate: _onNavigate,
  role,
  isDarkMode,
  lang = 'RU',
  isEdit: _isEdit = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm, showToast } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = useCallback((key, fallback, params) => getTranslation(lang, key, fallback, params), [lang]);

  // Единый хук управления состоянием тендера
  const state = useCreateTenderState({
    id,
    navigate,
    showAlert,
    showConfirm,
    showToast,
    t,
  });

  if (state.pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-slate-500">
        <RefreshCw className="animate-spin text-emerald-600" size={28} />
        <span className="text-sm font-medium">{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 🟢 ШАПКА ТЕНДЕРА: Номер, статус, прогресс, публикация */}
      <TenderHeader
        tenderId={state.tenderId}
        formData={state.formData}
        activeTopTab={state.activeTopTab}
        setActiveTopTab={state.setActiveTopTab}
        progressPercent={state.progressPercent}
        canAccessLots={state.canAccessLots}
        canAccessDocs={state.canAccessDocs}
        onNavigateTab={state.handleNavigateTab}
        canPublish={state.canPublish}
        publishing={state.publishing}
        publishDisabledReason={state.publishDisabledReason}
        onPublishTender={state.handlePublishTender}
        theme={theme}
        t={t}
      />

      {/* 🟢 ЕДИНЫЙ БРАУЗЕРНЫЙ БЛОК: ВКЛАДКИ + СОДЕРЖИМОЕ (CHROME-STYLE TABS) */}
      <div className="relative">
        {/* Вкладки браузера */}
        <TenderTopNavigationTabs
          activeTopTab={state.activeTopTab}
          onNavigateTab={state.handleNavigateTab}
          canAccessLots={state.canAccessLots}
          canAccessDocs={state.canAccessDocs}
          lotsCount={state.lots.length}
          tenderFilesCount={state.tenderFiles.length}
          t={t}
        />

        {/* Контейнер активной вкладки */}
        <div className={`rounded-2xl ${state.activeTopTab === 'params' ? 'rounded-tl-none' : ''} border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs overflow-hidden`}>
          {/* 🟢 ВКЛАДКА 1: ПАРАМЕТРЫ ЗАКУПКИ */}
          <TenderGeneralParamsTab
            activeTopTab={state.activeTopTab}
            formData={state.formData}
            handleFormChange={state.handleFormChange}
            tenderId={state.tenderId}
            setFormData={state.setFormData}
            clients={state.clients}
            categories={state.categories}
            role={role}
            isDarkMode={isDarkMode}
            theme={theme}
            lang={lang}
            savingBase={state.savingBase}
            handleUpdateBaseTender={state.handleUpdateBaseTender}
            handleCreateBaseTender={state.handleCreateBaseTender}
            t={t}
          />

          {/* 🟢 ВКЛАДКА 2: ЛОТЫ И СПЕЦИФИКАЦИИ */}
          <TenderLotsManagerTab
            activeTopTab={state.activeTopTab}
            tenderId={state.tenderId}
            lots={state.lots}
            activeLot={state.activeLot}
            activeLotIndex={state.activeLotIndex}
            setActiveLotIndex={state.setActiveLotIndex}
            activeLotDirty={state.activeLotDirty}
            setActiveLotDirty={state.setActiveLotDirty}
            handleDeleteActiveLot={state.handleDeleteActiveLot}
            handleAddNewLotTab={state.handleAddNewLotTab}
            handleActiveLotChange={state.handleActiveLotChange}
            handleLotFileUpload={state.handleLotFileUpload}
            handleLotFileDelete={state.handleLotFileDelete}
            products={state.products}
            units={state.units}
            manufacturers={state.manufacturers}
            categories={state.categories}
            deliveryTerms={state.deliveryTerms}
            handleAddSpecRow={state.handleAddSpecRow}
            handleSpecChange={state.handleSpecChange}
            handleRemoveSpec={state.handleRemoveSpec}
            handleOpenProductModal={state.handleOpenProductModal}
            savingActiveLot={state.savingActiveLot}
            handleSaveActiveLot={state.handleSaveActiveLot}
            role={role}
            isDarkMode={isDarkMode}
            theme={theme}
            lang={lang}
            t={t}
          />

          {/* 🟢 ВКЛАДКА 3: ОБЩИЕ ДОКУМЕНТЫ ТЕНДЕРА */}
          {state.activeTopTab === 'docs' && state.tenderId && (
            <TenderGeneralDocumentsTab
              tenderId={state.tenderId}
              tenderFiles={state.tenderFiles}
              handleTenderFileUpload={state.handleTenderFileUpload}
              handleTenderFileDelete={state.handleTenderFileDelete}
              theme={theme}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Модальное окно быстрого добавления позиции (товара, работы, услуги) в каталог */}
      {state.catalogModal.isOpen && (
        <CatalogFormModal
          isOpen={state.catalogModal.isOpen}
          onClose={() => state.setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null })}
          onSave={state.handleSaveProductFromModal}
          catalogId={state.catalogModal.catalogId || 'productsMNN'}
          editingItem={state.catalogModal.editingItem}
          categories={state.categories}
          existingProducts={state.products}
          theme={theme}
          t={t}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
