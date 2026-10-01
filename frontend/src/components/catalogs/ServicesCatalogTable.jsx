import React from 'react';
import { Activity } from 'lucide-react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function ServicesCatalogTable({
  services = [],
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

  const filtered = services.filter(
    (s) =>
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.category?.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4 min-w-56">
              {t('servicePositionName', 'Наименование услуги / регламента')}
            </th>
            <th className="py-3 px-4 min-w-40">{t('category', 'Категория услуг')}</th>
            <th className="py-3 px-4 text-center w-28">{t('colCode', 'Код услуги')}</th>
            <th className="py-3 px-4 min-w-52">{t('colDesc', 'Регламент / Периодичность / SLA')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-400">
                <Activity size={36} className="mx-auto mb-2 opacity-30 text-sky-500" />
                <p className="text-sm font-semibold">
                  {t('noServicesFound', 'Медицинские услуги пока не добавлены')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t(
                    'clickAddServicePrompt',
                    'Нажмите «+ Добавить», чтобы зарегистрировать новую услугу.'
                  )}
                </p>
              </td>
            </tr>
          ) : (
            paginated.map((s, i) => (
              <tr key={s.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                    {s.name}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {s.category?.name ? (
                    <span className="text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded inline-block font-semibold">
                      {s.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-xs">{s.code || '-'}</td>
                <td
                  className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate"
                  title={s.description || ''}
                >
                  {s.description || '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={s}
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
