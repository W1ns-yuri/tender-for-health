import React from 'react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function BrandsCatalogTable({
  brands = [],
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

  const filtered = brands.filter(
    (b) =>
      !q ||
      (b.name || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q)
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4">{t('colName', 'Название бренда / торговой марки')}</th>
            <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
            <th className="py-3 px-4 text-center w-40">{t('producersLinked', 'Производителей')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-8 text-center text-slate-400">
                {t('noResults', 'Нет данных')}
              </td>
            </tr>
          ) : (
            paginated.map((b, i) => (
              <tr key={b.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                  {b.name}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {b.code || '-'}
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-500">
                  {b.manufacturers?.length || 0}
                </td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={b}
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
