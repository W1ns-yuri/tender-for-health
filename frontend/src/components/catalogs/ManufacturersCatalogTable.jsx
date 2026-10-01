import React from 'react';
import { Globe } from 'lucide-react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function ManufacturersCatalogTable({
  manufacturers = [],
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

  const filtered = manufacturers.filter(
    (m) =>
      !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.code || '').toLowerCase().includes(q) ||
      (m.country?.name || '').toLowerCase().includes(q)
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4">
              {t('colName', 'Название предприятия / фармзавода')}
            </th>
            <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
            <th className="py-3 px-4 w-44">{t('colCountry', 'Страна происхождения')}</th>
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
            paginated.map((m, i) => (
              <tr key={m.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                  {m.name}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold">{m.code || '-'}</td>
                <td className="py-3 px-4">
                  {m.country?.name ? (
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe size={13} className="text-emerald-500" />
                      <span>{m.country.name}</span>
                      {m.country.alpha2 && (
                        <span className="font-mono text-[10px] text-slate-400">
                          ({m.country.alpha2})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={m}
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
