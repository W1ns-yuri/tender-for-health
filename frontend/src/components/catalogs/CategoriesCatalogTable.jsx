import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';

export default function CategoriesCatalogTable({
  categories = [],
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
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('ALL');
  const q = searchQuery.toLowerCase().trim();

  const filtered = categories.filter((c) => {
    const matchesQuery =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q);
    const matchesType =
      categoryTypeFilter === 'ALL' || (c.type || 'GOODS') === categoryTypeFilter;
    return matchesQuery && matchesType;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* Фильтр по типам категорий: Все / Товары / Работы / Услуги */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter size={13} />
          {t('filterByType', 'Тип:')}
        </span>
        {[
          { id: 'ALL', label: t('all', 'Все') },
          { id: 'GOODS', label: t('typeGoodsShort', 'Товары') },
          { id: 'WORKS', label: t('typeWorksShort', 'Работы') },
          { id: 'SERVICES', label: t('typeServicesShort', 'Услуги') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCategoryTypeFilter(tab.id);
              onPageChange(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              categoryTypeFilter === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-14 text-center">#</th>
            <th className="py-3 px-4">{t('colName', 'Название категории')}</th>
            <th className="py-3 px-4 text-center w-36">{t('colType', 'Тип')}</th>
            <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
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
            paginated.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">
                  {(currentPage - 1) * pageSize + i + 1}
                </td>
                <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                  {c.name}
                </td>
                <td className="py-3 px-4 text-center">
                  {c.type === 'WORKS' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {t('typeWorksShort', 'Работы')}
                    </span>
                  ) : c.type === 'SERVICES' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {t('typeServicesShort', 'Услуги')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {t('typeGoodsShort', 'Товары')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {c.code || '-'}
                </td>
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
