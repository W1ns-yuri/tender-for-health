import React from 'react';
import { 
  AlertCircle, 
  Package, 
  Wrench, 
  Settings2, 
  Paperclip, 
  FileText, 
  MapPin, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import CustomSelect from '../CustomSelect';
import OfferLotItemRow from './OfferLotItemRow';
import { resolveFileUrl } from '../../utils/themeUtils';

export default function OfferLotCard({
  lot,
  lotIdx,
  tender,
  viewMode = 'tabs',
  activeLotTab,
  setActiveLotTab,
  selectedLots = {},
  toggleLotSelection,
  supplierCategoryIds = [],
  offerItemsByLot = {},
  handleSpecFieldChange,
  deliveryTerms = [],
  lotDeliveryTerms = {},
  setLotDeliveryTerms,
  calculateLotTotal,
  currencyCode = 'TMT',
  products = [],
  onOpenCatalogModal,
  isDarkMode,
  theme,
  t
}) {
  const isAllowed = !lot.categoryId || supplierCategoryIds.length === 0 || supplierCategoryIds.includes(lot.categoryId);
  const isSelected = Boolean(selectedLots[lot.id]) && isAllowed;
  const lotItems = offerItemsByLot[lot.id] || [];
  const lotTotal = calculateLotTotal ? calculateLotTotal(lot.id) : 0;
  const customerDeliveryTerm = lot.deliveryTerm?.shortName || lot.deliveryTerm?.name || t('notSpecified', 'Не указано');
  const lotType = lot.lotType || 'GOODS';

  return (
    <div 
      className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${theme?.cardBg || ''} ${
        !isSelected ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Заголовок лота с динамическими параметрами */}
      <div className={`p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
      }`}>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`lot-toggle-${lot.id}`}
            checked={isSelected}
            disabled={!isAllowed}
            onChange={() => isAllowed && toggleLotSelection && toggleLotSelection(lot.id)}
            className={`w-5 h-5 rounded text-blue-600 focus:ring-blue-500 shrink-0 ${
              !isAllowed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
            }`}
          />
          <label htmlFor={`lot-toggle-${lot.id}`} className="font-extrabold text-base cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
            <span>{t('lotUpperLabel', 'Лот')} #{lotIdx + 1}: {lot.name}</span>
            {!isSelected && isAllowed && <span className="text-xs font-normal text-slate-400">({t('disabledBadge', 'отключен')})</span>}
          </label>

          {/* Бейдж вне категории */}
          {!isAllowed && (
            <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 border border-rose-200 dark:border-rose-900/60">
              <AlertCircle size={12} className="text-rose-500" />
              <span>{t('lotOutsideCategory', 'Лот вне вашей категории аккредитации')}</span>
            </span>
          )}

          {/* Бейдж типа предмета лота */}
          {lotType === 'GOODS' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
              <Package size={12} />
              <span>{t('catProducts', 'Товары')}</span>
            </span>
          )}
          {lotType === 'WORKS' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
              <Wrench size={12} />
              <span>{t('worksType', 'Работы')}</span>
            </span>
          )}
          {lotType === 'SERVICES' && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800/60">
              <Settings2 size={12} />
              <span>{t('servicesType', 'Услуги')}</span>
            </span>
          )}

          {lot.endUser && (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium pl-1">
              🏢 {t('endUser', 'Конечный получатель')}: <strong className="text-slate-800 dark:text-slate-200 font-bold">{lot.endUser}</strong>
            </span>
          )}

          {lot.files && lot.files.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Paperclip size={12} className="text-blue-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('lotDocuments', 'Документы лота')}:</span>
              {lot.files.map((f, fIdx) => {
                const doc = f.document || f;
                return (
                  <a
                    key={doc.id || fIdx}
                    href={resolveFileUrl(doc.filePath || doc.fileName || doc.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline text-[11px] font-bold flex items-center gap-1 border border-blue-200/60 dark:border-blue-800"
                    title={doc.fileName || doc.name}
                  >
                    <FileText size={11} />
                    <span className="max-w-28 truncate">{doc.fileName || doc.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Единая строка условий поставки / выполнения и сумма лота */}
        {isSelected && (
          <div className="flex flex-wrap items-center gap-4">
            {/* 1. Для ТОВАРОВ: сравнительная плашка Incoterms + адрес доставки */}
            {lotType === 'GOODS' && (
              <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t('customerConditionLabel', 'Условие заказчика:')}</span>
                  <strong className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                    {customerDeliveryTerm}
                  </strong>
                </div>

                <span className="text-slate-300 dark:text-slate-600 font-bold">➔</span>

                <div className="flex items-center gap-1.5 min-w-44">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold shrink-0">{t('yourConditionLabel', 'Ваше условие:')}</span>
                  <CustomSelect
                    role="SUPPLIER"
                    size="sm"
                    className="min-w-36"
                    options={deliveryTerms.map(dt => ({ id: dt.id, name: `${dt.shortName} — ${dt.name}` }))}
                    value={lotDeliveryTerms[lot.id] || ''}
                    placeholder={t('selectDeliveryTerm', 'Выберите базис поставки...')}
                    onChange={(val) => setLotDeliveryTerms(prev => ({ ...prev, [lot.id]: val }))}
                    searchable={deliveryTerms.length > 5}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    t={t}
                  />
                </div>

                {lot.deliveryAddress && (
                  <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="truncate max-w-45" title={lot.deliveryAddress}>{lot.deliveryAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. Для РАБОТ: Объект, график, строительная лицензия (Incoterms скрыт) */}
            {lotType === 'WORKS' && (
              <div className="flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                {lot.workAddress && (
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <MapPin size={13} className="text-amber-500 shrink-0" />
                    <span className="text-slate-400">{t('siteWithColon', 'Объект:')}</span>
                    <strong className="truncate max-w-45" title={lot.workAddress}>{lot.workAddress}</strong>
                  </div>
                )}
                {lot.workPeriod && (
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-400">{t('termWithColon', 'Срок:')}</span>
                    <strong>{lot.workPeriod}</strong>
                  </div>
                )}
                {lot.licenseRequired && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                    <ShieldCheck size={12} />
                    <span>{t('constructionLicenseRequired', 'Требуется строительная лицензия')}</span>
                  </span>
                )}
              </div>
            )}

            {/* 3. Для УСЛУГ: Формат оказания и SLA (Incoterms скрыт) */}
            {lotType === 'SERVICES' && (
              <div className="flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Settings2 size={13} className="text-blue-500 shrink-0" />
                  <span className="text-slate-400">{t('formatWithColon', 'Формат:')}</span>
                  <strong>
                    {lot.serviceFormat === 'REMOTE'
                      ? (t('remoteFormat', 'Удаленно'))
                      : lot.serviceFormat === 'HYBRID'
                      ? (t('formatHybrid', 'Гибридный'))
                      : (t('onCustomerSiteFormat', 'На объекте заказчика'))}
                  </strong>
                </div>
                {lot.slaPeriod && (
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-400">SLA:</span>
                    <strong>{lot.slaPeriod}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Итого по лоту */}
            <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700 shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                {t('lotSubtotal', 'Итого по лоту')}
              </span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400">
                {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Таблица спецификации: 1 товар = 2 строки (Сверху Запрос, Снизу Предложение) */}
      {isSelected ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-215">
            <thead>
              <tr className={`font-semibold ${theme?.tableHeaderBg || ''}`}>
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5 min-w-60">
                  {lotType === 'WORKS' 
                    ? (t('workStages', 'Этап / вид работ'))
                    : lotType === 'SERVICES'
                    ? (t('serviceName', 'Наименование услуги'))
                    : (t('itemOfferColumn', 'Товар / Предложение'))}
                </th>
                <th className="py-3 px-3.5 w-28 text-center">
                  {lotType === 'SERVICES' 
                    ? (t('volumePeriod', 'Объем / Период')) 
                    : (t('specQty', 'Количество'))}*
                </th>
                <th className="py-3 px-3.5 w-28 text-center">{t('specUnit', 'Ед. изм.')}</th>
                <th className="py-3 px-3.5 w-36 text-center">{t('unitPriceWithCurrency', `Цена за ед. (${currencyCode})`, { currencyCode })}*</th>
                <th className="py-3 px-3.5 w-36 text-right">{t('totalSumWithCurrency', `Сумма (${currencyCode})`, { currencyCode })}</th>
                <th className="py-3 px-3.5 min-w-45">
                  {lotType === 'WORKS'
                    ? (t('scopeOfWork', 'Состав и спецификация работ'))
                    : lotType === 'SERVICES'
                    ? (t('serviceRegulations', 'Регламент и описание услуги'))
                    : (t('specsJustificationColumn', 'Характеристики / Обоснование'))}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
              {lotItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {t('noItemsInLot', 'В этом лоте нет позиций')}
                  </td>
                </tr>
              ) : (
                lotItems.map((item, idx) => (
                  <OfferLotItemRow
                    key={item.tenderSpecId || idx}
                    item={item}
                    idx={idx}
                    lotId={lot.id}
                    lotType={lotType}
                    isAllowed={isAllowed}
                    isSelected={isSelected}
                    handleSpecFieldChange={handleSpecFieldChange}
                    products={products}
                    onOpenCatalogModal={onOpenCatalogModal}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    t={t}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5 text-center text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-900/20">
          {t('optedOutOfLotNotice', 'Вы отключили участие в данном лоте')}
        </div>
      )}

      {/* Навигация между лотами в табовом режиме */}
      {viewMode === 'tabs' && tender?.lots && tender.lots.length > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
          <button
            type="button"
            disabled={activeLotTab === 0}
            onClick={() => setActiveLotTab && setActiveLotTab(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {t('lotTabPrevBtn', '← Предыдущий лот')}
          </button>
          <span className="text-xs font-bold text-slate-400">
            {activeLotTab + 1} / {tender.lots.length}
          </span>
          <button
            type="button"
            disabled={activeLotTab >= tender.lots.length - 1}
            onClick={() => setActiveLotTab && setActiveLotTab(prev => Math.min(tender.lots.length - 1, prev + 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {t('lotTabNextBtn', 'Следующий лот →')}
          </button>
        </div>
      )}
    </div>
  );
}
