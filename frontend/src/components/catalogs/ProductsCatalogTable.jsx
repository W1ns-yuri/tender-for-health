import React from 'react';
import { Package, Check, X, ExternalLink } from 'lucide-react';
import { resolveFileUrl } from '../../utils/themeUtils';
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
  onlyPending = false,
  onOnlyPendingChange,
  onApprove,
  onReject,
}) {
  const q = searchQuery.toLowerCase().trim();
  const pendingCount = products.filter((p) => p.moderationStatus === 'PENDING').length;

  const filtered = products.filter(
    (p) =>
      (!onlyPending || p.moderationStatus === 'PENDING') &&
      (!q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.tradeName || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q) ||
      (p.brand?.name || '').toLowerCase().includes(q))
  );

  const attrSummary = (p) =>
    (p.attributeValues || [])
      .map((av) => {
        const name = av.attribute?.name || av.customName;
        let val = av.value;
        if (av.attribute?.type === 'BOOLEAN') val = val === 'true' ? t('yes', 'да') : t('no', 'нет');
        return `${name}: ${val}${av.attribute?.unit ? ' ' + av.attribute.unit : ''}`;
      })
      .join(' · ');

  const chip = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
      active
        ? 'bg-emerald-600 text-white border-emerald-600'
        : isDarkMode
        ? 'border-slate-700 text-slate-300 hover:border-emerald-500'
        : 'border-slate-200 text-slate-600 hover:border-emerald-400'
    }`;

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {onOnlyPendingChange && (
        <div className={`flex flex-wrap items-center gap-2 px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <button type="button" className={chip(!onlyPending)} onClick={() => onOnlyPendingChange(false)}>
            {t('allProducts', 'Все')} ({products.length})
          </button>
          <button type="button" className={chip(onlyPending)} onClick={() => onOnlyPendingChange(true)}>
            {t('pendingProducts', 'Ждут проверки')} ({pendingCount})
          </button>
          {pendingCount > 0 && !onlyPending && (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              {t('pendingHint', 'Поставщики добавили товары. Пока вы их не одобрите, другие их не видят.')}
            </span>
          )}
        </div>
      )}
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
                  <div className="flex gap-3 items-start">
                    {p.imageFileName && (
                      <img
                        src={resolveFileUrl(p.imageFileName)}
                        alt=""
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-10 h-10 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                        {p.name}
                        {p.brand?.name && <span className="font-semibold text-slate-500"> · {p.brand.name}</span>}
                      </span>
                      {attrSummary(p) && <span className="text-xs text-slate-500 block mt-0.5">{attrSummary(p)}</span>}
                      {p.officialUrl && (
                        <a href={p.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1 mt-0.5">
                          <ExternalLink size={12} /> {t('officialSite', 'сайт производителя')}
                        </a>
                      )}
                      {p.moderationStatus === 'PENDING' && (
                        <span className="mt-1 block text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {t('statusPending', 'Ждёт проверки')}
                          {p.createdBy && ` · ${t('addedBy', 'добавил')} ${[p.createdBy.firstName, p.createdBy.lastName].filter(Boolean).join(' ')}`}
                        </span>
                      )}
                      {p.moderationStatus === 'REJECTED' && (
                        <span className="mt-1 block text-xs font-semibold text-rose-600" title={p.moderationNote || ''}>
                          {t('statusRejected', 'Отклонён')}{p.moderationNote ? `: ${p.moderationNote}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
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
                  {p.moderationStatus === 'PENDING' && onApprove && (
                    <div className="flex justify-center gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => onApprove(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check size={13} /> {t('approve', 'Одобрить')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <X size={13} /> {t('reject', 'Отклонить')}
                      </button>
                    </div>
                  )}
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
