import React from 'react';
import { Pill, Plus } from 'lucide-react';
import { Pagination } from '../ui';

export default function MnnArchiveCatalogTable({
  mnnList = [],
  searchQuery = '',
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onAddNewDrug,
  tableHeaderClass,
  theme,
  isDarkMode,
  role,
  lang,
  t,
}) {
  const q = searchQuery.toLowerCase().trim();

  const filtered = mnnList.filter(
    (item) =>
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.tradeNames?.some((tn) => tn.toLowerCase().includes(q))
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4 min-w-64">
              {t('mnnSubstance', 'Международное непатентованное наименование (МНН)')}
            </th>
            <th className="py-3 px-4 text-center w-36">
              {t('registeredDrugsCount', 'Препаратов в базе')}
            </th>
            <th className="py-3 px-4">
              {t('registeredTradeNames', 'Зарегистрированные торговые наименования')}
            </th>
            <th className="py-3 px-4 text-center w-36">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-12 text-center text-slate-400">
                <Pill size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm font-semibold">
                  {t('noMnnRecords', 'В архиве МНН пока нет записей')}
                </p>
              </td>
            </tr>
          ) : (
            paginated.map((item, i) => (
              <tr key={i} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                    {item.name}
                  </span>
                  {item.categories && item.categories.length > 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {item.categories.map((c) => c.name).join(', ')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 font-bold font-mono rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                    {item.count}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {item.tradeNames && item.tradeNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tradeNames.map((tn, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700"
                        >
                          {tn}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Торговые названия не указаны</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onAddNewDrug && onAddNewDrug(item)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold text-xs flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                    title="Добавить новый препарат с этим МНН"
                  >
                    <Plus size={13} />
                    <span>{t('addDrug', 'Препарат')}</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / pageSize) || 1}
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          role={role}
          lang={lang}
        />
      </div>
    </div>
  );
}
