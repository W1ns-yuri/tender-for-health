import React from 'react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function CurrenciesCatalogTable({
  currencies = [],
  searchQuery = '',
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onToggleActive,
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

  const filtered = currencies.filter(
    (c) =>
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4">{t('colName', 'Название')}</th>
            <th className="py-3 px-4 text-center w-28">{t('colCode', 'Код')}</th>
            <th className="py-3 px-4 text-center w-24">{t('colSymbol', 'Символ')}</th>
            <th className="py-3 px-4 text-center w-20">{t('colFlag', 'Флаг')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-8 text-center text-slate-400">
                {t('noResults', 'Нет данных')}
              </td>
            </tr>
          ) : (
            paginated.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                  {c.name}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold">{c.code}</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 text-sm">
                  {c.symbol}
                </td>
                <td className="py-3 px-4 text-center text-base">{c.flag || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={c}
                    onToggleActive={onToggleActive}
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
