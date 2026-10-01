import React from 'react';
import { Package } from 'lucide-react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function ProductsCatalogTable({
  products = [],
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

  const filtered = products.filter(
    (p) =>
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.tradeName || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q)
  );

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4 min-w-56">
              {t('innName', 'Международное непатентованное наименование (МНН)')}
            </th>
            <th className="py-3 px-4 min-w-44">{t('tradeName', 'Торговое название')}</th>
            <th className="py-3 px-4 min-w-40">{t('category', 'Категория')}</th>
            <th className="py-3 px-4 text-center w-28">{t('colCode', 'Код (АТХ)')}</th>
            <th className="py-3 px-4 min-w-44">{t('colDesc', 'Описание / Дозировка')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-12 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm font-semibold">{t('noProductsFound', 'Препараты не найдены')}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('clickAddProductPrompt', 'Нажмите «+ Добавить», чтобы зарегистрировать новый препарат.')}
                </p>
              </td>
            </tr>
          ) : (
            paginated.map((p, i) => (
              <tr key={p.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                    {p.name}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {p.tradeName ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                      {p.tradeName}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {p.category?.name ? (
                    <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">
                      {p.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-xs">{p.code || '-'}</td>
                <td
                  className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate"
                  title={p.description || ''}
                >
                  {p.description || '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons
                    item={p}
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
