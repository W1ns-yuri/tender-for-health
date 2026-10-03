import React from 'react';
import { Package, Plus } from 'lucide-react';
import TenderLotsTabBar from './TenderLotsTabBar';
import TenderLotDetailsCard from './TenderLotDetailsCard';
import TenderLotDocuments from './TenderLotDocuments';
import TenderLotItemsTable from './TenderLotItemsTable';
import TenderLotStickyFooter from './TenderLotStickyFooter';
import Button from '../ui/Button';

/**
 * Вкладка 2: Управление лотами и спецификацией.
 * Отображает переключение закладок лотов, карточку активного лота,
 * прикрепленные файлы, таблицу спецификации и закрепленный футер сохранения.
 */
export default function TenderLotsManagerTab({
  activeTopTab,
  tenderId,
  lots = [],
  activeLot,
  activeLotIndex = 0,
  setActiveLotIndex,
  activeLotDirty = false,
  setActiveLotDirty,
  handleDeleteActiveLot,
  handleAddNewLotTab,
  handleActiveLotChange,
  handleLotFileUpload,
  handleLotFileUpdate,
  handleLotFileDelete,
  products = [],
  units = [],
  manufacturers = [],
  categories = [],
  deliveryTerms = [],
  handleAddSpecRow,
  handleSpecChange,
  handleRemoveSpec,
  handleOpenProductModal,
  savingActiveLot = false,
  handleSaveActiveLot,
  role,
  isDarkMode = false,
  theme = {},
  lang = 'RU',
  t = (k, f) => f
}) {
  if (activeTopTab !== 'lots' || !tenderId) return null;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Шапка секции лотов */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className={`text-base font-black ${theme.primaryText || ''}`}>
            {t('step2Title', 'Управление лотами и спецификацией')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('lotsAtomicHint', 'Каждый лот сохраняется и обрабатывается независимо в виде отдельной вкладки')}
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500">
          {t('totalLotsCount', 'Всего лотов')}:{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
            {lots.length}
          </span>
        </div>
      </div>

      {/* Браузерные закладки лотов (Chrome/Edge style) */}
      <div className="relative">
        <TenderLotsTabBar
          lots={lots}
          activeLotIndex={activeLotIndex}
          setActiveLotIndex={setActiveLotIndex}
          activeLotDirty={activeLotDirty}
          setActiveLotDirty={setActiveLotDirty}
          handleDeleteActiveLot={handleDeleteActiveLot}
          handleAddNewLotTab={handleAddNewLotTab}
          t={t}
        />

        {/* Содержимое активного лота */}
        {activeLot ? (
          <div className={`p-6 rounded-2xl ${activeLotIndex === 0 ? 'rounded-tl-none' : ''} border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 ${theme.cardBg || 'bg-white dark:bg-[#111827]'}`}>
            {/* Параметры лота */}
            <TenderLotDetailsCard
              activeLot={activeLot}
              activeLotIndex={activeLotIndex}
              lots={lots}
              handleActiveLotChange={handleActiveLotChange}
              handleDeleteActiveLot={handleDeleteActiveLot}
              categories={categories}
              deliveryTerms={deliveryTerms}
              role={role}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />

            {/* Документы лота */}
            <TenderLotDocuments
              activeLot={activeLot}
              handleLotFileUpload={handleLotFileUpload}
              handleLotFileUpdate={handleLotFileUpdate}
              handleLotFileDelete={handleLotFileDelete}
              t={t}
            />

            {/* Спецификация позиций */}
            <TenderLotItemsTable
              activeLot={activeLot}
              products={products}
              units={units}
              manufacturers={manufacturers}
              handleAddSpecRow={handleAddSpecRow}
              handleSpecChange={handleSpecChange}
              handleRemoveSpec={handleRemoveSpec}
              handleOpenProductModal={handleOpenProductModal}
              isDarkMode={isDarkMode}
              theme={theme}
              lang={lang}
              t={t}
              role={role}
            />

            {/* Закрепленный футер лота */}
            <TenderLotStickyFooter
              activeLot={activeLot}
              activeLotIndex={activeLotIndex}
              activeLotDirty={activeLotDirty}
              savingActiveLot={savingActiveLot}
              handleSaveActiveLot={handleSaveActiveLot}
              t={t}
            />
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-3">
            <Package size={36} className="mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-medium">
              {t('noLotsYet', 'У тендера пока нет лотов. Нажмите «+ Добавить лот», чтобы создать первый лот.')}
            </p>
            <Button
              variant="success"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleAddNewLotTab}
            >
              {t('addLotTab', '+ Добавить лот')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
