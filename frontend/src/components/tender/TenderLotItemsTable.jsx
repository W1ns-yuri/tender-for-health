import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ProductSearchableSelect from './ProductSearchableSelect';
import CustomSelect from '../CustomSelect';

export default function TenderLotItemsTable({
  activeLot,
  products = [],
  units = [],
  manufacturers = [],
  handleAddSpecRow,
  handleSpecChange,
  handleRemoveSpec,
  handleOpenProductModal,
  isDarkMode,
  theme,
  lang,
  t,
  role
}) {
  if (!activeLot) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          {t('specificationsList', 'Спецификация позиций')} ({activeLot.specs?.length || 0})
        </h3>
        {/* Заметная акцентная кнопка добавления позиции */}
        <button
          type="button"
          onClick={handleAddSpecRow}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-700 shadow-2xs"
        >
          <Plus size={14} />
          <span>{t('addPosition', 'Добавить позицию')}</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <th className="py-2.5 px-3 w-12 text-center font-bold">#</th>
              <th className="py-2.5 px-3 min-w-56 font-bold">
                {activeLot.lotType === 'WORKS' 
                  ? t('workStages', 'Этап / вид работ')
                  : activeLot.lotType === 'SERVICES'
                  ? t('serviceName', 'Наименование услуги')
                  : t('product', 'Товар / МНН')} *
              </th>
              <th className="py-2.5 px-3 w-28 text-center font-bold">{t('unit', 'Ед. изм.')}</th>
              {activeLot.lotType === 'GOODS' && (
                <th className="py-2.5 px-3 w-36 text-center font-bold">{t('manufacturer', 'Производитель')}</th>
              )}
              <th className="py-2.5 px-3 w-24 text-center font-bold">
                {activeLot.lotType === 'SERVICES' ? t('volumePeriod', 'Объем') : t('quantity', 'Кол-во')} *
              </th>
              <th className="py-2.5 px-3 min-w-44 font-bold">{t('description', 'Описание / Требования')}</th>
              <th className="py-2.5 px-3 w-12 text-center font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(!activeLot.specs || activeLot.specs.length === 0) ? (
              <tr>
                <td colSpan={activeLot.lotType === 'GOODS' ? 7 : 6} className="py-8 text-center text-slate-400">
                  {t('noSpecsInLot', 'В этом лоте пока нет позиций. Нажмите «+ Добавить позицию».')}
                </td>
              </tr>
            ) : (
              activeLot.specs.map((spec, sIdx) => (
                <tr key={spec.id || sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                    {sIdx + 1}
                  </td>

                  <td className="py-2.5 px-3">
                    <ProductSearchableSelect
                      products={products}
                      value={spec.haryt || spec.name}
                      generalProductId={spec.generalProductId}
                      onChange={(val, genId) => handleSpecChange(sIdx, 'productSelect', val, genId)}
                      onOpenCreateModal={(initialName) => handleOpenProductModal(initialName, sIdx)}
                      placeholder={t('selectProduct', 'Выберите или введите...')}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      lang={lang}
                    />
                  </td>

                  <td className="py-2.5 px-3">
                    <CustomSelect
                      role={role}
                      size="sm"
                      value={spec.unit || ''}
                      onChange={(val) => handleSpecChange(sIdx, 'unit', val)}
                      options={units.map(u => ({ id: u.id, name: u.shortName || u.name }))}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      t={t}
                    />
                  </td>

                  {activeLot.lotType === 'GOODS' && (
                    <td className="py-2.5 px-3">
                      <CustomSelect
                        role={role}
                        size="sm"
                        value={spec.brand || ''}
                        onChange={(val) => handleSpecChange(sIdx, 'brand', val)}
                        options={manufacturers.map(m => ({ id: m.id, name: m.name }))}
                        placeholder={t('selectBrand', 'Бренд...')}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        t={t}
                      />
                    </td>
                  )}

                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={spec.mukdar || 1}
                      onChange={(e) => handleSpecChange(sIdx, 'mukdar', e.target.value)}
                      className={`w-full px-2 py-1 rounded-md text-xs text-center font-mono font-bold outline-none border ${theme.inputBg}`}
                    />
                  </td>

                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={spec.desc || ''}
                      onChange={(e) => handleSpecChange(sIdx, 'desc', e.target.value)}
                      className={`w-full px-2.5 py-1 rounded-md text-xs outline-none border ${theme.inputBg}`}
                      placeholder={t('specDescPlaceholder', 'Доп. требования...')}
                    />
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(sIdx)}
                      className="w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title={t('delete', 'Удалить позицию')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
