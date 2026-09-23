import React from 'react';
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
  Button,
  SearchInput,
  CustomSelect,
} from '../ui';
import { safeString } from '../../utils/themeUtils';
import { getTranslation } from '../../utils/translations';

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

  const categoryOptions = [
    { id: 'ALL', name: `🏢 ${t('allCategories', 'Все направления деятельности')}` },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="space-y-3">
      {/* 1. Панель фильтров и поиска */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="col-span-1 md:col-span-2">
          <SearchInput
            placeholder={t('searchPlaceholder', 'Gözleg...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <CustomSelect
            role={role}
            isDarkMode={isDarkMode}
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            options={categoryOptions}
            size="md"
          />
        </div>
      </div>

      {/* 2. Таблица со списком поставщиков */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('supplierName', 'Kompaniýanyň ady')}</TableHeaderCell>
              <TableHeaderCell>{t('activityDirections', 'Направления')}</TableHeaderCell>
              <TableHeaderCell>{t('country', 'Ýurt')}</TableHeaderCell>
              <TableHeaderCell>{t('regNo', 'Ýazgy belgisi')}</TableHeaderCell>
              <TableHeaderCell>{t('taxId', 'ИНН (STŞK)')}</TableHeaderCell>
              <TableHeaderCell>{t('license', 'Ygtyýarnama')}</TableHeaderCell>
              <TableHeaderCell align="center">{t('status', 'Ýagdaýy')}</TableHeaderCell>
              <TableHeaderCell align="right">{t('action', 'Amal')}</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>{t('loading', 'Ýüklenýär...')}</span>
                  </div>
                </td>
              </tr>
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
              suppliers.map((s, idx) => (
                <TableRow key={s.id || idx}>
                  {/* Название */}
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    {safeString(s.name)}
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
                    {safeString(s.country?.name || s.countryName)}
                  </TableCell>

                  {/* Регистрационный номер */}
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {safeString(s.regNumber)}
                  </TableCell>

                  {/* ИНН (STSK) */}
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {safeString(s.taxId)}
                  </TableCell>

                  {/* Номер лицензии */}
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {safeString(s.licenseNumber)}
                  </TableCell>

                  {/* Статус */}
                  <TableCell align="center">
                    <Badge variant={s.isActive ? 'emerald' : 'rose'} size="sm">
                      {s.isActive ? t('statusActive', 'Işjeň') : t('statusInactive', 'Işjeň däl')}
                    </Badge>
                  </TableCell>

                  {/* Действия */}
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onView(s)}
                        title={t('viewProfileTooltip', 'Посмотреть профиль')}
                      >
                        <Eye size={15} />
                      </Button>

                      {onEdit && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onEdit(s)}
                          title={t('edit', 'Düzetmek')}
                          className="hover:text-emerald-600"
                        >
                          <Edit2 size={15} />
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onDelete(s.id)}
                          title={t('delete', 'Pozmak')}
                          className="hover:text-rose-600 text-slate-400"
                        >
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
