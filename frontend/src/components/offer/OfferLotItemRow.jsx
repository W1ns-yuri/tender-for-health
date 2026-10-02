import React from 'react';
import { CornerDownRight, Info, Plus } from 'lucide-react';
import ProductSearchableSelect from '../tender/ProductSearchableSelect';

export default function OfferLotItemRow({
  item,
  idx,
  lotId,
  lotType = 'GOODS',
  isAllowed = true,
  isSelected = true,
  handleSpecFieldChange,
  products = [],
  onOpenCatalogModal,
  isDarkMode = false,
  theme,
  t
}) {
  const lineTotal = (parseFloat(item.requestedQty) || 0) * (parseFloat(item.price) || 0);
  const hasPrice = parseFloat(item.price) > 0;
  const isEq = Boolean(item.isEquivalent);

  return (
    <React.Fragment key={item.tenderSpecId || idx}>
      {/* ВЕРХНЯЯ СТРОКА: ЗАПРОС ЗАКАЗЧИКА */}
      <tr className="bg-slate-100/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 font-medium">
        {/* Колонка 1: Номер */}
        <td className="py-3.5 px-3.5 text-center font-bold text-slate-400">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
            {idx + 1}
          </span>
        </td>

        {/* Колонка 2: Название товара заказчика */}
        <td className="py-3.5 px-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              {t('requestLabel', 'Запрос')}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {item.requestedName}
            </span>
          </div>
        </td>

        {/* Колонка 3: Ед. изм. */}
        <td className="py-3.5 px-3.5 text-center text-slate-600 dark:text-slate-400 font-bold text-xs">
          {item.requestedUnit || '-'}
        </td>

        {/* Колонка 4: Запрошенное количество */}
        <td className="py-3.5 px-3.5 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
          <span className="px-2.5 py-1 rounded-md bg-slate-200/80 dark:bg-slate-800">
            {item.requestedQty}
          </span>
        </td>

        {/* Колонка 5: Цена (прочерк для запроса) */}
        <td className="py-3.5 px-3.5 text-center text-slate-400 font-medium text-sm">
          —
        </td>

        {/* Колонка 6: Сумма (прочерк для запроса) */}
        <td className="py-3.5 px-3.5 text-right text-slate-400 font-medium text-sm">
          —
        </td>

        {/* Колонка 7: Требования заказчика */}
        <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
          {item.requestedBrand && (
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {item.requestedBrand}
            </div>
          )}
          {item.requestedDesc && (
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {item.requestedDesc}
            </div>
          )}
          {!item.requestedBrand && !item.requestedDesc && <span className="text-slate-400">—</span>}
        </td>
      </tr>

      {/* НИЖНЯЯ СТРОКА: ПРЕДЛОЖЕНИЕ ПОСТАВЩИКА */}
      <tr className={`bg-white dark:bg-slate-800/90 transition-colors ${hasPrice ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''}`}>
        {/* Колонка 1: Указатель предложения */}
        <td className="py-3.5 px-3.5 text-center text-blue-600 dark:text-blue-400 font-black text-sm">
          <CornerDownRight size={16} className="mx-auto" />
        </td>

        {/* Колонка 2: Предложение и чекбокс эквивалента */}
        <td className="py-3.5 px-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
              {t('yourBidColumn', 'Ваше КП')}
            </span>

            {/* Чекбокс эквивалента / аналога (только для товаров) */}
            {lotType === 'GOODS' && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                <input
                  type="checkbox"
                  checked={isEq}
                  onChange={(e) => handleSpecFieldChange(lotId, idx, 'isEquivalent', e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>{t('proposeAnalogBtn', 'Предложить эквивалент / аналог')}</span>
              </label>
            )}
          </div>

          {lotType === 'GOODS' ? (
            <ProductSearchableSelect
              products={products}
              disabled={!isAllowed || !isSelected}
              value={isEq ? (item.equivalentName || '') : (item.haryt || item.requestedName || '')}
              generalProductId={item.generalProductId}
              onChange={(val, genId) => {
                if (isEq) {
                  handleSpecFieldChange(lotId, idx, 'equivalentName', val);
                } else {
                  handleSpecFieldChange(lotId, idx, 'haryt', val);
                }
                if (genId) {
                  handleSpecFieldChange(lotId, idx, 'generalProductId', genId);
                }
              }}
              onOpenCreateModal={(initialName) => {
                const targetField = isEq ? 'equivalentName' : 'haryt';
                onOpenCatalogModal && onOpenCatalogModal(lotId, idx, targetField, initialName || (isEq ? item.equivalentName : (item.haryt || item.requestedName)));
              }}
              placeholder={
                isEq 
                  ? t('selectAnalogFromCatalog', 'Выберите аналог (МНН / препарат) из каталога...') 
                  : t('selectProductFromCatalog', 'Выберите МНН / препарат из каталога...')
              }
              buttonLabel={t('addToCatalog', 'Добавить в справочник')}
              isDarkMode={isDarkMode}
              theme={theme}
              role="SUPPLIER"
              lang="RU"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                required
                disabled={!isAllowed || !isSelected}
                value={isEq ? (item.equivalentName || '') : (item.haryt || item.requestedName || '')}
                onChange={(e) => handleSpecFieldChange(lotId, idx, isEq ? 'equivalentName' : 'haryt', e.target.value)}
                placeholder={
                  lotType === 'WORKS'
                    ? (t('workScopePlaceholder', 'Наименование / состав выполняемых работ...'))
                    : (t('serviceNamePlaceholder', 'Наименование оказываемой услуги...'))
                }
                className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold ${theme?.inputBg || ''} ${
                  !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                }`}
              />
            </div>
          )}
        </td>

        {/* Колонка 3: Количество (СТРОГО ЗАФИКСИРОВАНО ПО ЗАКАЗЧИКУ) */}
        <td className="py-3.5 px-3.5 text-center">
          <div className="flex flex-col items-center">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 shadow-2xs">
              {item.requestedQty}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
              {t('fixedBadge', 'фиксировано')}
            </span>
          </div>
        </td>

        {/* Колонка 4: Ед. изм. */}
        <td className="py-3.5 px-3.5 text-center text-slate-600 dark:text-slate-400 font-bold text-xs">
          {item.requestedUnit || item.unit || '-'}
        </td>

        {/* Колонка 5: Цена за единицу */}
        <td className="py-3.5 px-3.5 text-center">
          <input
            type="number"
            min="0"
            step="any"
            required
            disabled={!isAllowed || !isSelected}
            placeholder="0.00"
            value={item.price === 0 ? '' : item.price}
            onChange={(e) => handleSpecFieldChange(lotId, idx, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
            className={`w-full px-3 py-2 text-right font-black rounded-lg border text-xs transition-all ${
              !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
            } ${
              hasPrice
                ? 'border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/40 focus:ring-2 focus:ring-blue-500'
                : `text-slate-700 dark:text-slate-300 ${theme?.inputBg || ''}`
            }`}
          />
        </td>

        {/* Колонка 6: Итоговая сумма по позиции */}
        <td className="py-3.5 px-3.5 text-right">
          <span className={`font-black text-sm ${hasPrice ? 'text-blue-600 dark:text-blue-300' : 'text-slate-300'}`}>
            {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </td>

        {/* Колонка 7: Обоснование эквивалента или характеристики */}
        <td className="py-3.5 px-3.5">
          {isEq ? (
            <textarea
              rows="2"
              disabled={!isAllowed || !isSelected}
              value={item.equivalentJustification || ''}
              onChange={(e) => handleSpecFieldChange(lotId, idx, 'equivalentJustification', e.target.value)}
              placeholder={t('equivalenceJustificationPlaceholder', 'Обоснование эквивалентности (МНН, форма, дозировка, характеристики)...')}
              className={`w-full px-3 py-1.5 rounded-lg text-xs border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none ${
                !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          ) : (
            <input
              type="text"
              disabled={!isAllowed || !isSelected}
              value={item.desc}
              onChange={(e) => handleSpecFieldChange(lotId, idx, 'desc', e.target.value)}
              placeholder={t('manufacturerNotesPlaceholder', 'Производитель, страна, модель...')}
              className={`w-full px-3 py-2 rounded-lg text-xs border ${theme?.inputBg || ''} ${
                !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
              }`}
            />
          )}
        </td>
      </tr>

      {/* Подсказка об эквиваленте */}
      {isEq && (
        <tr className="bg-blue-50/30 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40">
          <td colSpan="7" className="py-1.5 px-4">
            <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
              <Info size={13} className="shrink-0 text-blue-600" />
              <span>
                {t('analogOfferedNotice', 'Предложен эквивалент / аналог. Заявка будет проверена организатором закупки на соответствие техническим и качественным характеристикам.')}
              </span>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
