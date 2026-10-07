import React from 'react';
import { cleanLotTitle } from '../../utils/pluralize';

/**
 * OfferLotGroupCard Component
 * Displays a single lot within an offer, including its commercial terms,
 * delivery/SLA parameters, and table of offered items with prices and totals.
 */
export default function OfferLotGroupCard({
  group,
  groupIdx,
  offer,
  role,
  currencyCode,
  isDarkMode,
  theme,
  t
}) {
  const isAdmin = role === 'ADMIN';
  const lotTotal = group.specs.reduce(
    (acc, s) => acc + ((s.unitPrice || 0) * (s.quantity || 0)), 
    0
  );

  const lotDeliveryTerm = group.lot?.deliveryTerm?.shortName 
    ? `${group.lot.deliveryTerm.shortName} — ${group.lot.deliveryTerm.name}`
    : (offer?.deliveryTerm ? `${offer.deliveryTerm.shortName} — ${offer.deliveryTerm.name}` : null);

  const isLotServiceOrWork = 
    group.lot?.lotType === 'SERVICES' || 
    group.lot?.lotType === 'WORKS' || 
    (group.lot?.name && (
      group.lot.name.toLowerCase().includes('сервис') || 
      group.lot.name.toLowerCase().includes('ремонт') || 
      group.lot.name.toLowerCase().includes('услуг') ||
      group.lot.name.toLowerCase().includes('hyzmat')
    ));

  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${theme.cardBg}`}>
      {/* Lot Header */}
      <div className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
            isAdmin
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
          }`}>
            #{groupIdx + 1}
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
              {t('lotUpperLabel', 'Лот')} #{groupIdx + 1}: {cleanLotTitle(group.lot.name, groupIdx)}
            </h4>
            {group.lot?.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {group.lot.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4">
          {isLotServiceOrWork ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">{t('workAddressLabel', 'Адрес работ:')}</span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {group.lot?.workAddress || group.lot?.deliveryAddress || t('ashgabatCity', 'г. Ашхабад')}
                </strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">{t('slaReglamentLabel', 'Регламент SLA:')}</span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {group.lot?.slaPeriod || group.lot?.workPeriod || t('standardSla', 'По регламенту SLA')}
                </strong>
              </div>
            </div>
          ) : lotDeliveryTerm && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">{t('deliveryConditionWithColon', 'Условие поставки:')}</span>
              <strong className={`px-2.5 py-0.5 rounded-md font-bold border ${
                isAdmin
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {lotDeliveryTerm}
              </strong>
            </div>
          )}

          <div className="text-left md:text-right pl-0 md:pl-4 md:border-l border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              {t('lotSubtotal', 'Итого по лоту')}
            </span>
            <span className={`text-base sm:text-lg font-black ${theme.primaryText}`}>
              {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </span>
          </div>
        </div>
      </div>

      {/* Lot Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`font-semibold ${theme.tableHeaderBg}`}>
              <th className="py-2.5 px-3 w-12 text-center">{t('itemNumber', '№ п/п')}</th>
              <th className="py-2.5 px-3 min-w-[240px]">{t('offeredProductName', 'Наименование предложенного товара')}</th>
              <th className="py-2.5 px-3 min-w-[160px]">{t('specBrand', 'Производитель / Модель')}</th>
              <th className="py-2.5 px-3 w-28 text-center">{t('specQty', 'Количество')}</th>
              <th className="py-2.5 px-3 w-24 text-center">{t('specUnit', 'Ед. изм.')}</th>
              <th className="py-2.5 px-3 w-36 text-center">{t('unitPrice', 'Цена за ед.')} ({currencyCode})</th>
              <th className="py-2.5 px-3 w-36 text-right">{t('totalSum', 'Сумма')} ({currencyCode})</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {group.specs.map((spec, index) => {
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
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {mfr || '—'}
                  </td>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
