import React from 'react';
import { Ruler } from 'lucide-react';
import { Pagination } from '../ui';
import CatalogActionButtons from './CatalogActionButtons';
import { ATTRIBUTE_TYPES } from './attributeTypes';

/** Справочник характеристик: Диагональ (число, дюйм), Цвет (список) и т.д. */
export default function AttributesCatalogTable({
  attributes = [],
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
  const filtered = attributes.filter(
    (a) => !q || a.name.toLowerCase().includes(q) || (a.options || []).some((o) => o.toLowerCase().includes(q))
  );
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const typeName = (type) => ATTRIBUTE_TYPES.find((x) => x.id === type)?.name || type;

  return (
    <div>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderClass}>
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4 min-w-44">{t('attrName', 'Характеристика')}</th>
            <th className="py-3 px-4 w-36">{t('attrType', 'Тип значения')}</th>
            <th className="py-3 px-4 min-w-56">{t('attrOptionsCol', 'Варианты / единица')}</th>
            <th className="py-3 px-4 text-center w-28">{t('attrCategories', 'Категорий')}</th>
            <th className="py-3 px-4 text-center w-28">{t('attrProducts', 'Товаров')}</th>
            <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-12 text-center text-slate-400">
                <Ruler size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm font-semibold">{t('noAttributes', 'Характеристик пока нет')}</p>
                <p className="text-xs mt-0.5">
                  {t('noAttributesHint', 'Добавьте, например, «Диагональ» (число, дюйм) или «Цвет» (список), затем подключите их к категории.')}
                </p>
              </td>
            </tr>
          ) : (
            paginated.map((a, i) => (
              <tr key={a.id} className={`${theme.tableRowHover} ${a.isActive ? '' : 'opacity-60'}`}>
                <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                <td className="py-3 px-4 font-bold text-sm text-slate-900 dark:text-white">{a.name}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{typeName(a.type)}</td>
                <td className="py-3 px-4 text-slate-500">
                  {a.type === 'LIST' ? a.options.join(', ') : a.unit || '-'}
                </td>
                <td className="py-3 px-4 text-center font-mono">{a._count?.categories ?? 0}</td>
                <td className="py-3 px-4 text-center font-mono">{a._count?.values ?? 0}</td>
                <td className="py-3 px-4 text-center">
                  <CatalogActionButtons item={a} onToggleActive={onToggleActive} onEdit={onEdit} onDelete={onDelete} t={t} />
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
