import React from 'react';
import { Package } from 'lucide-react';

/**
 * OfferStandaloneTable Component
 * Renders specification table for offers without lot segmentation,
 * or as fallback table for unassigned positions.
 */
export default function OfferStandaloneTable({
  specs = [],
  currencyCode,
  isDarkMode,
  theme,
  t,
  isUnassigned = false
}) {
  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${theme.cardBg}`}>
      {isUnassigned && (
        <div className={`p-3.5 border-b font-bold text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
        }`}>
          {t('additionalPositionsTitle', 'Дополнительные позиции')}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`font-semibold ${theme.tableHeaderBg}`}>
              <th className="py-2.5 px-3 w-12 text-center">{t('itemNumber', '№ п/п')}</th>
              <th className="py-2.5 px-3 min-w-[240px]">{t('offeredProductName', 'Наименование предложенного товара')}</th>
              {!isUnassigned && (
                <th className="py-2.5 px-3 min-w-[160px]">{t('specBrand', 'Производитель / Модель')}</th>
              )}
              <th className="py-2.5 px-3 w-28 text-center">{t('specQty', 'Количество')}</th>
              <th className="py-2.5 px-3 w-24 text-center">{t('specUnit', 'Ед. изм.')}</th>
              <th className="py-2.5 px-3 w-36 text-center">{t('unitPrice', 'Цена за ед.')} ({currencyCode})</th>
              <th className="py-2.5 px-3 w-36 text-right">{t('totalSum', 'Сумма')} ({currencyCode})</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {specs.length === 0 ? (
              <tr>
                <td colSpan={isUnassigned ? 6 : 7} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={24} className="opacity-40" />
                    <span>{t('noItemsInProposal', 'В предложении нет позиций')}</span>
                  </div>
                </td>
              </tr>
            ) : (
              specs.map((spec, index) => {
                const mfr = spec.manufacturer?.name || 
                            spec.tenderSpec?.manufacturer?.name || 
                            (typeof spec.manufacturer === 'string' ? spec.manufacturer : null);
                const unitStr = spec.unit?.shortName || 
                                spec.unit?.name || 
                                spec.tenderSpec?.unit?.shortName || 
                                spec.tenderSpec?.unit?.name || 
                                (typeof spec.unit === 'string' ? spec.unit : 'шт');
                const itemPrice = spec.unitPrice || 0;
                const itemQty = spec.quantity || 0;
                const lineTotal = itemPrice * itemQty;
                const productName = spec.name || 
                                    spec.tenderSpec?.generalProduct?.name || 
                                    spec.tenderSpec?.name || 
                                    t('product', 'Товар');

                return (
                  <tr key={spec.id || index} className={`${theme.tableRowHover} transition-colors`}>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {productName}
                      </div>
                      {spec.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          {spec.description}
                        </div>
                      )}
                    </td>
                    {!isUnassigned && (
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {mfr || '—'}
                      </td>
                    )}
                    <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100">
                      {itemQty}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-bold">
                      {unitStr}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {itemPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-3 text-right font-black text-sm ${theme.primaryText}`}>
                      {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
