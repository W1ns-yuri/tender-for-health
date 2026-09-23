import React from 'react';
import { RefreshCw, Save, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import CustomSelect from '../CustomSelect';
import CustomDateInput from './CustomDateInput';

export default function TenderGeneralParamsTab({
  activeTopTab,
  formData,
  handleFormChange,
  tenderId,
  setFormData,
  clients = [],
  categories = [],
  role,
  isDarkMode,
  theme,
  lang = 'RU',
  savingBase,
  handleUpdateBaseTender,
  handleCreateBaseTender,
  t = (k, f) => f
}) {
  if (activeTopTab !== 'params') return null;

  return (
    <div className={`p-6 rounded-2xl border shadow-xs space-y-5 animate-in fade-in duration-200 ${theme?.cardBg || ''}`}>
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className={`text-base font-black ${theme?.primaryText || ''}`}>
            {t('tabGeneralParams', 'Параметры закупки')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('generalParamsHint', 'Основные реквизиты, классификация, сроки и квалификационные требования')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Номер тендера */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('tenderNumberLabel', 'Номер тендера')} *
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={formData.tenderNumber}
              onChange={(e) => handleFormChange('tenderNumber', e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none border ${theme?.inputBg || ''}`}
              placeholder="TNDR-2026-09-001"
            />
            {!tenderId && (
              <button
                type="button"
                onClick={() => {
                  API.get('/tenders/next-number').then(res => {
                    if (res.data?.nextTenderNumber) setFormData(p => ({ ...p, tenderNumber: res.data.nextTenderNumber }));
                  });
                }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                title={t('generateNumber', 'Автогенерация')}
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Заказчик */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('client', 'Заказчик')} *
          </label>
          <CustomSelect
            role={role}
            value={formData.clientId}
            onChange={(val) => handleFormChange('clientId', val)}
            options={clients.map(c => ({ id: c.id, name: c.name }))}
            placeholder={t('selectClient', 'Выберите заказчика...')}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>

        {/* Общая категория тендера */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('tenderGeneralCategory', 'Категория тендера')} *
          </label>
          <CustomSelect
            role={role}
            value={formData.categoryId}
            onChange={(val) => handleFormChange('categoryId', val)}
            options={categories.map(c => ({ id: c.id, name: c.name }))}
            placeholder={t('selectCategory', 'Выберите категорию...')}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>
      </div>

      {/* Наименование тендера */}
      <div>
        <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
          {t('tenderTitleLabel', 'Наименование тендера')} *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleFormChange('title', e.target.value)}
          className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold outline-none border ${theme?.inputBg || ''}`}
          placeholder={t('tenderTitlePlaceholder', 'Например: Закупка лекарственных средств и расходных материалов для стационаров')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Дата объявления */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('announcementDate', 'Дата объявления')} *
          </label>
          <CustomDateInput
            value={formData.announcementDate}
            onChange={(val) => handleFormChange('announcementDate', val)}
            isDarkMode={isDarkMode}
            theme={theme}
            lang={lang}
          />
        </div>

        {/* Дедлайн */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('deadline', 'Крайний срок подачи')} *
          </label>
          <CustomDateInput
            value={formData.deadline}
            onChange={(val) => handleFormChange('deadline', val)}
            isDarkMode={isDarkMode}
            theme={theme}
            lang={lang}
          />
        </div>

        {/* Тип тендера (Местный / Международный) */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('tenderTypeLabel', 'Тип тендера')}
          </label>
          <CustomSelect
            role={role}
            value={formData.type}
            onChange={(val) => handleFormChange('type', val)}
            options={[
              { id: 'YERLI', name: t('typeLocal', 'Местный (Ýerli)') },
              { id: 'HALKARA', name: t('typeGlobal', 'Международный (Halkara)') }
            ]}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>

        {/* Тип закупки (Товары / Работы / Услуги) */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('procurementTypeLabel', 'Тип предмета закупки')}
          </label>
          <CustomSelect
            role={role}
            value={formData.procurementType}
            onChange={(val) => handleFormChange('procurementType', val)}
            options={[
              { id: 'GOODS', name: t('catProducts', 'Товары (Harytlar)') },
              { id: 'SERVICES_WORKS', name: t('servicesAndWorks', 'Работы и услуги') },
              { id: 'MIXED', name: t('mixedType', 'Смешанный') }
            ]}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>
      </div>

      {/* Описание и требования */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('description', 'Описание тендера')}
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
            placeholder={t('descriptionPlaceholder', 'Краткая аннотация и цели закупки...')}
          />
        </div>
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('technicalSpecs', 'Общие требования к участникам')}
          </label>
          <textarea
            rows={3}
            value={formData.technicalSpecs}
            onChange={(e) => handleFormChange('technicalSpecs', e.target.value)}
            className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
            placeholder={t('techSpecsPlaceholder', 'Общие квалификационные требования...')}
          />
        </div>
      </div>

      {/* Кнопка сохранения общих данных */}
      <div className="pt-2 flex justify-end">
        {tenderId ? (
          <button
            type="button"
            onClick={handleUpdateBaseTender}
            disabled={savingBase}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{savingBase ? t('saving', 'Сохранение...') : t('saveBaseInfo', 'Сохранить общие данные')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreateBaseTender}
            disabled={savingBase}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>{savingBase ? t('saving', 'Создание...') : t('saveDraftAndProceed', 'Создать черновик и перейти к лотам →')}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
