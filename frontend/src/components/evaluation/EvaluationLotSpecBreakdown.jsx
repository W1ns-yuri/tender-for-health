import React from 'react';
import { FileText, CornerDownRight } from 'lucide-react';

/**
 * Раскрывающаяся попозиционная спецификация предложения поставщика в сравнении с ТЗ заказчика.
 */
export default function EvaluationLotSpecBreakdown({
  co,
  lot,
  t = (k, f) => f
}) {
  return (
    <tr>
      <td colSpan="6" className="bg-slate-50/70 dark:bg-slate-800/40 p-5 border-t border-slate-200 dark:border-slate-700/60">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
              {t('itemizedSupplierProposalTitle', 'Попозиционное предложение поставщика:')}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{co.supplierName}</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {co.offerSpecs.length} {t('positionsFilledCount', 'позиций заполнено')}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 font-semibold w-10 text-center">#</th>
                  <th className="p-3 font-semibold">{t('productSubjectColumn', 'Товар / Предмет закупки')}</th>
                  <th className="p-3 font-semibold text-center w-24">{t('qty', 'Кол-во')}</th>
                  <th className="p-3 font-semibold text-center w-24">{t('specUnit', 'Ед. изм.')}</th>
                  <th className="p-3 font-semibold text-right w-36">{t('unitPricePlain', 'Цена за ед.')}</th>
                  <th className="p-3 font-semibold text-right w-40">{t('totalAmount', 'Сумма')}</th>
                  <th className="p-3 font-semibold w-56">{t('specsManufacturerColumn', 'Характеристики / Производитель')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {co.offerSpecs.map((os, idx) => {
                  const originalSpec = (lot.specs || []).find(s => s.id === os.tenderSpecId);
                  const requestedName = originalSpec ? (originalSpec.generalProduct?.name || originalSpec.name) : 'Н/Д';
                  const requestedUnit = originalSpec?.unit?.name || originalSpec?.unit?.shortName || 'шт';
                  const requestedDesc = originalSpec ? originalSpec.description : '';

                  const offeredName = os.generalProduct?.name || os.name || 'Н/Д';
                  const offeredUnit = os.unit?.name || os.unit?.shortName || 'шт';
                  const offeredBrand = os.manufacturer?.name || os.brand || '';
                  const isDifferent = (requestedName !== offeredName) && (offeredName !== 'Н/Д');

                  return (
                    <React.Fragment key={os.id || idx}>
                      {/* Запрос Заказчика */}
                      <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                        <td className="p-3 text-center font-bold text-slate-400" rowSpan="2">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] uppercase font-bold rounded tracking-wider">
                              {t('requestLabel', 'Запрос')}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {requestedName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {os.quantity}
                        </td>
                        <td className="p-3 text-center text-slate-500 font-medium">
                          {requestedUnit}
                        </td>
                        <td className="p-3 text-right text-slate-400">—</td>
                        <td className="p-3 text-right text-slate-400">—</td>
                        <td className="p-3 text-slate-500 italic text-[11px]">
                          {requestedDesc || '—'}
                        </td>
                      </tr>

                      {/* Ответ / Предложение Поставщика */}
                      <tr className={isDifferent ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                        <td className="p-3 pl-0">
                          <div className="flex items-start gap-2">
                            <CornerDownRight size={16} className="text-emerald-500 ml-1.5 mt-0.5 shrink-0" />
                            <div>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] uppercase font-bold rounded-md tracking-wider mb-1 inline-flex items-center gap-1">
                                {co.supplierName ? `${t('supplierProposalPrefix', 'КП:')} ${co.supplierName}` : t('supplierProposalDefault', 'КП поставщика')}
                              </span>
                              <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                {offeredName}
                                {isDifferent && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] rounded uppercase font-bold tracking-wider">
                                    {t('substituteBadge', 'Замена')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          {os.quantity}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-600 dark:text-slate-300">
                          {offeredUnit}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                          {Number(os.unitPrice || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {co.currencyCode}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {((os.quantity || 0) * (os.unitPrice || 0)).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {co.currencyCode}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px]">
                          {offeredBrand && (
                            <div className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                              {offeredBrand}
                            </div>
                          )}
                          {os.description ? <span>{os.description}</span> : <span className="text-slate-400 italic">—</span>}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}
