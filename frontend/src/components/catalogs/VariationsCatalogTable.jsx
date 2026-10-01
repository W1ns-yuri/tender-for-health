import React from 'react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function VariationsCatalogTable({
  variations = [],
  searchQuery = '',
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  tableHeaderClass,
  theme,
  isDarkMode,
  role,
  lang,
  t,
}) {
  const q = searchQuery.toLowerCase().trim();

  const filtered = variations.filter(
    (v) =>
      !q ||
      (v.name || '').toLowerCase().includes(q) ||
      v.values?.some((val) => val.value.toLowerCase().includes(q))
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4 w-56">{t('variationGroupName', 'Название группы')}</th>
            <th className="py-3 px-4">{t('variationValues', 'Доступные значения')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="4" className="py-8 text-center text-slate-400">
                {t('noResults', 'Нет данных')}
              </td>
            </tr>
          ) : (
            paginated.map((v, i) => (
              <tr key={v.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                  {v.name}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    {v.values && v.values.length > 0 ? (
                      v.values.map((val) => (
                        <span
                          key={val.id}
                          className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-xs border border-emerald-200 dark:border-emerald-800"
                        >
                          {val.value}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Значения не заданы</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={v}
                    allowToggle={false}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    t={t}
                  />
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
