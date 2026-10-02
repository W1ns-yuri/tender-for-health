import React, { useMemo } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import CustomSelect from '../CustomSelect';

export default function TenderLotDetailsCard({
  activeLot,
  activeLotIndex,
  lots = [],
  handleActiveLotChange,
  handleDeleteActiveLot,
  categories = [],
  deliveryTerms = [],
  role,
  isDarkMode,
  theme,
  t = (k, f) => f
}) {
  const relevantCategories = useMemo(() => {
    const targetType = activeLot?.lotType || 'GOODS';
    const filtered = categories.filter(c => !c.type || c.type === targetType);
    return filtered.length > 0 ? filtered : categories;
  }, [categories, activeLot?.lotType]);

  if (!activeLot) return null;

  return (
    <div className="space-y-6">
      {/* Шапка карточки лота: Номер, Название и безопасная кнопка Удалить лот */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className={`text-sm font-black ${theme?.primaryText || ''}`}>
            {`Лот №${activeLot.lotNumber || activeLotIndex + 1}: ${activeLot.name || ''}`}
          </h3>
        </div>

        {lots.length > 1 && (
          <button
            type="button"
            onClick={() => handleDeleteActiveLot(activeLotIndex)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
          >
            <Trash2 size={13} />
            <span>{t('deleteLotBtn', 'Удалить этот лот')}</span>
          </button>
        )}
      </div>

      {/* Ряд 1: Номер, Название, Тип, Категория */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('lotNumberLabel', 'Номер лота')} *
          </label>
          <input
            type="number"
            min="1"
            value={activeLot.lotNumber || ''}
            onChange={(e) => handleActiveLotChange('lotNumber', e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none border ${theme?.inputBg || ''}`}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('lotNameLabel', 'Название лота')} *
          </label>
          <input
            type="text"
            value={activeLot.name || ''}
            onChange={(e) => handleActiveLotChange('name', e.target.value)}
            className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold outline-none border ${theme?.inputBg || ''}`}
            placeholder="Например: Поставка антибиотиков"
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('lotTypeLabel', 'Тип лота')} *
          </label>
          <CustomSelect
            role={role}
            value={activeLot.lotType || 'GOODS'}
            onChange={(val) => handleActiveLotChange('lotType', val)}
            options={[
              { id: 'GOODS', name: t('catProducts', 'Товары (Goods)') },
              { id: 'WORKS', name: t('worksType', 'Работы (Works)') },
              { id: 'SERVICES', name: t('servicesType', 'Услуги (Services)') }
            ]}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
            {t('lotCategory', 'Категория лота')} *
          </label>
          <CustomSelect
            role={role}
            value={activeLot.categoryId || ''}
            onChange={(val) => handleActiveLotChange('categoryId', val)}
            options={relevantCategories.map(c => ({ id: c.id, name: c.name }))}
            placeholder={t('selectCategory', 'Категория лота...')}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>
      </div>

      {/* Ряд 2: Параметры поставки товаров */}
      {activeLot.lotType === 'GOODS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('deliveryTerm', 'Условие поставки (Incoterms)')} *
              </label>
              <CustomSelect
                role={role}
                value={activeLot.deliveryTermId || ''}
                onChange={(val) => handleActiveLotChange('deliveryTermId', val)}
                options={deliveryTerms.map(dt => ({ id: dt.id, name: `${dt.shortName} — ${dt.name}` }))}
                placeholder={t('selectDeliveryTerm', 'Выберите базис поставки...')}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('endUser', 'Конечный получатель (Бенефициар)')} *
              </label>
              <input
                type="text"
                value={activeLot.endUser || ''}
                onChange={(e) => handleActiveLotChange('endUser', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder={t('endUserPlaceholder', 'Например: Госпиталь №1, Центр кардиологии')}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('deliveryAddressLabel', 'Пункт назначения / Адрес поставки')} *
              </label>
              <input
                type="text"
                value={activeLot.deliveryAddress || ''}
                onChange={(e) => handleActiveLotChange('deliveryAddress', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder={t('deliveryAddressPlaceholder', 'г. Ашхабад, Склад №2')}
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(activeLot.licenseRequired)}
                onChange={(e) => handleActiveLotChange('licenseRequired', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
              />
              <span>{t('licenseRequired', 'Требуется лицензия')}</span>
            </label>
          </div>
        </div>
      )}

      {/* Параметры услуг */}
      {activeLot.lotType === 'SERVICES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('serviceFormat', 'Формат оказания услуг')} *
              </label>
              <CustomSelect
                role={role}
                value={activeLot.serviceFormat || 'ON_SITE'}
                onChange={(val) => handleActiveLotChange('serviceFormat', val)}
                options={[
                  { id: 'ON_SITE', name: t('onCustomerSiteFormat', 'На объекте заказчика (On-site)') },
                  { id: 'REMOTE', name: t('remoteFormat', 'Удаленно (Remote)') },
                  { id: 'HYBRID', name: t('formatHybrid', 'Гибридный (Hybrid)') }
                ]}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('endUser', 'Конечный получатель (Бенефициар)')} *
              </label>
              <input
                type="text"
                value={activeLot.endUser || ''}
                onChange={(e) => handleActiveLotChange('endUser', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder={t('endUserPlaceholder', 'Например: Госпиталь №1')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('deliveryAddressLabel', 'Место оказания услуг')} *
              </label>
              <input
                type="text"
                value={activeLot.deliveryAddress || ''}
                onChange={(e) => handleActiveLotChange('deliveryAddress', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder="г. Ашхабад, Центр телемедицины"
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('slaPeriod', 'Требования к SLA / Реакции')}
              </label>
              <input
                type="text"
                value={activeLot.slaPeriod || ''}
                onChange={(e) => handleActiveLotChange('slaPeriod', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder="24/7, реакция до 2 часов"
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(activeLot.licenseRequired)}
                onChange={(e) => handleActiveLotChange('licenseRequired', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
              />
              <span>{t('licenseRequired', 'Требуется лицензия')}</span>
            </label>
          </div>
        </div>
      )}

      {/* Параметры работ */}
      {activeLot.lotType === 'WORKS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('termLabel', 'Срок выполнения работ')} *
              </label>
              {(() => {
                const raw = String(activeLot.workPeriod || '').trim();
                const match = raw.match(/^(\d+)\s*(.*)$/);
                const val = match ? match[1] : raw.replace(/\D/g, '');
                const rawUnit = match && match[2] ? match[2].trim() : '';
                const unit = rawUnit || 'календарных дней';

                const handleValueChange = (newVal) => {
                  const cleaned = newVal.replace(/\D/g, '');
                  if (!cleaned) {
                    handleActiveLotChange('workPeriod', '');
                  } else {
                    handleActiveLotChange('workPeriod', `${cleaned} ${unit}`);
                  }
                };

                const handleUnitChange = (newUnit) => {
                  if (val) {
                    handleActiveLotChange('workPeriod', `${val} ${newUnit}`);
                  }
                };

                return (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={val}
                      onChange={(e) => handleValueChange(e.target.value)}
                      className={`w-28 px-3.5 py-2 rounded-xl text-xs font-mono font-bold outline-none border ${theme?.inputBg || ''}`}
                      placeholder="60"
                    />
                    <div className="flex-1">
                      <CustomSelect
                        role={role}
                        value={unit}
                        onChange={handleUnitChange}
                        options={[
                          { id: 'календарных дней', name: t('daysCalendar', 'календарных дней') },
                          { id: 'рабочих дней', name: t('daysWork', 'рабочих дней') },
                          { id: 'недель', name: t('weeks', 'недель') },
                          { id: 'месяцев', name: t('months', 'месяцев') }
                        ]}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('endUser', 'Конечный получатель (Бенефициар)')} *
              </label>
              <input
                type="text"
                value={activeLot.endUser || ''}
                onChange={(e) => handleActiveLotChange('endUser', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder={t('endUserPlaceholder', 'Например: Госпиталь №1')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme?.subText || ''}`}>
                {t('siteLabel', 'Объект выполнения работ / Адрес')} *
              </label>
              <input
                type="text"
                value={activeLot.workAddress || ''}
                onChange={(e) => handleActiveLotChange('workAddress', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                placeholder="г. Ашхабад, ул. Здоровья 14"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(activeLot.licenseRequired)}
                  onChange={(e) => handleActiveLotChange('licenseRequired', e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
                />
                <span>{t('licenseRequired', 'Требуется лицензия')}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
