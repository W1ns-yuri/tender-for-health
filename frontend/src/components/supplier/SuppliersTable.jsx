import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Edit2, Trash2, Building } from 'lucide-react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableEmptyState,
  Badge,
  TableFilters,
  Pagination,
  TableSkeletonRows,
} from '../ui';
import { safeString, getRoleTheme } from '../../utils/themeUtils';
import { getTranslation } from '../../utils/translations';
import { parseCompanyName } from '../../utils/pluralize';

export default function SuppliersTable({
  suppliers = [],
  loading = false,
  search = '',
  onSearchChange,
  categories = [],
  categoryFilter = 'ALL',
  onCategoryFilterChange,
  onView,
  onEdit,
  onDelete,
  role = 'ADMIN',
  isDarkMode = false,
  lang = 'RU',
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  // Пагинация (по 10 строк на страницу, как в UI Kit)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const totalItems = suppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return suppliers.slice(startIndex, startIndex + pageSize);
  }, [suppliers, safeCurrentPage, pageSize]);

  const categoryOptions = [
    { id: 'ALL', name: `🏢 ${t('allCategories', 'Все направления деятельности')}` },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="space-y-3">
      {/* 1. Панель фильтров и поиска */}
      <TableFilters
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('searchPlaceholder', 'Gözleg...')}
        filters={[
          {
            id: 'category',
            value: categoryFilter,
            onChange: onCategoryFilterChange,
            options: categoryOptions,
            searchable: categoryOptions.length > 5,
            width: 'min-w-[240px]'
          }
        ]}
        hasActiveFilters={Boolean(search || categoryFilter !== 'ALL')}
        onReset={() => {
          onSearchChange?.('');
          onCategoryFilterChange?.('ALL');
        }}
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 2. Таблица со списком поставщиков */}
      <TableContainer>
        <Table className="min-w-[1000px] table-fixed">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-56">{t('supplierName', 'Kompaniýanyň ady')}</TableHeaderCell>
              <TableHeaderCell className="w-48">{t('activityDirections', 'Направления')}</TableHeaderCell>
              <TableHeaderCell className="w-32">{t('country', 'Ýurt')}</TableHeaderCell>
              <TableHeaderCell className="w-32">{t('regNo', 'Ýazgy belgisi')}</TableHeaderCell>
              <TableHeaderCell className="w-32">{t('taxId', 'ИНН (STŞK)')}</TableHeaderCell>
              <TableHeaderCell className="w-36">{t('license', 'Ygtyýarnama')}</TableHeaderCell>
              <TableHeaderCell className="w-32" align="center">{t('status', 'Ýagdaýy')}</TableHeaderCell>
              <TableHeaderCell className="w-24" align="right">{t('action', 'Amal')}</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableSkeletonRows rows={pageSize || 5} cols={8} />
            ) : suppliers.length === 0 ? (
              <TableEmptyState
                colSpan={8}
                icon={<Building size={28} />}
                title={t('suppliersNotFoundNotice', 'Поставщики не найдены')}
                description={
                  search.trim() || categoryFilter !== 'ALL'
                    ? t('adjustSearchFilterPrompt', 'Попробуйте изменить поисковый запрос или сбросить фильтр.')
                    : t('noRegisteredSuppliersYet', 'В системе пока нет зарегистрированных поставщиков.')
                }
              />
            ) : (
              paginatedSuppliers.map((s, idx) => {
                const parsed = parseCompanyName(s.name);
                return (
                  <TableRow key={s.id || idx}>
                    {/* Название */}
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {parsed.opf && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            {parsed.opf}
                          </span>
                        )}
                        <span className="truncate">{parsed.cleanName}</span>
                      </div>
                    </TableCell>

                  {/* Направления деятельности */}
                  <TableCell>
                    {s.categories && s.categories.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1 max-w-xs">
                        {s.categories.map((sc, scIdx) => (
                          <span
                            key={sc.categoryId || scIdx}
                            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40"
                          >
                            {sc.category?.name || 'Категория'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {t('noCategoriesAssigned', 'Не указаны')}
                      </span>
                    )}
                  </TableCell>

                  {/* Страна */}
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {(s.country?.name || s.countryName) ? (
                      safeString(s.country?.name || s.countryName)
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 font-normal select-none">—</span>
                    )}
                  </TableCell>

                  {/* Регистрационный номер */}
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {s.regNumber ? (
                      safeString(s.regNumber)
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 font-normal select-none">—</span>
                    )}
                  </TableCell>

                  {/* ИНН (STSK) */}
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {s.taxId ? (
                      safeString(s.taxId)
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 font-normal select-none">—</span>
                    )}
                  </TableCell>

                  {/* Номер лицензии */}
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {s.licenseNumber ? (
                      safeString(s.licenseNumber)
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 font-normal select-none">—</span>
                    )}
                  </TableCell>

                  {/* Статус */}
                  <TableCell align="center">
                    <Badge variant={s.isActive ? 'emerald' : 'rose'} size="sm">
                      {s.isActive ? t('statusActive', 'Işjeň') : t('statusInactive', 'Işjeň däl')}
                    </Badge>
                  </TableCell>

                  {/* Действия */}
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className={theme.actionBtn}
                        title={t('viewProfileTooltip', 'Посмотреть профиль')}
                      >
                        <Eye size={15} />
                      </button>

                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(s)}
                          className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 dark:hover:border-amber-700 transition-all active:scale-95 cursor-pointer"
                          title={t('edit', 'Düzetmek')}
                        >
                          <Edit2 size={15} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(s.id)}
                          className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 dark:hover:border-rose-700 transition-all active:scale-95 cursor-pointer"
                          title={t('delete', 'Pozmak')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3. Панель пагинации из UI Kit */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        lang={lang}
      />
    </div>
  );
}
