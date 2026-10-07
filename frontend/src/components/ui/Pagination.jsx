import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  role = 'ADMIN',
  variant,
  lang = 'RU',
  showingText,
  ofText,
  itemsText,
  perPageText,
  className = '',
  isDarkMode = false,
  theme,
}) {
  if (totalItems === 0) return null;

  const isSupplier = variant === 'blue' || (!variant && role === 'SUPPLIER');

  // Multi-language defaults
  const l10n = {
    RU: { showing: 'Показано', of: 'из', items: 'записей', perPage: 'на стр.', first: 'Первая страница', prev: 'Назад', next: 'Вперед', last: 'Последняя страница' },
    TM: { showing: 'Görkezilýär', of: 'jemi', items: 'ýazgy', perPage: 'sahypada', first: 'Birinji sahypa', prev: 'Öňki', next: 'Indiki', last: 'Soňky sahypa' },
    EN: { showing: 'Showing', of: 'of', items: 'records', perPage: 'per page', first: 'First page', prev: 'Previous', next: 'Next', last: 'Last page' }
  };

  const currentL10n = l10n[lang] || l10n.RU;
  const finalShowingText = showingText || currentL10n.showing;
  const finalOfText = ofText || currentL10n.of;
  const finalItemsText = itemsText || currentL10n.items;
  const finalPerPageText = perPageText || currentL10n.perPage;

  // Безопасные значения для защиты от деления на 0 и Infinity
  const safePageSize = (typeof pageSize === 'number' && pageSize > 0) ? pageSize : 10;
  const safeTotalPages = (typeof totalPages === 'number' && Number.isFinite(totalPages) && totalPages > 0)
    ? Math.max(1, totalPages)
    : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const endItem = Math.min(safeCurrentPage * safePageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;

    for (let i = 1; i <= safeTotalPages; i++) {
      if (
        i === 1 ||
        i === safeTotalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 ${className}`}>
      {/* 1. Item summary counter */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {finalShowingText} <span className="font-bold text-slate-900 dark:text-white tabular-nums">{startItem}-{endItem}</span> {finalOfText} <span className="font-bold text-slate-900 dark:text-white tabular-nums">{totalItems}</span> {finalItemsText}
      </div>

      {/* 2. Controls: Page size selector + Page navigation buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-[110px]">
            <CustomSelect
              role={isSupplier ? 'SUPPLIER' : 'ADMIN'}
              size="xs"
              value={safePageSize}
              onChange={(val) => {
                const num = Number(val);
                if (num > 0) {
                  onPageSizeChange(num);
                }
              }}
              options={pageSizeOptions.map((opt) => ({
                id: opt,
                name: `${opt} ${finalPerPageText}`
              }))}
              isDarkMode={isDarkMode}
              theme={theme}
              searchable={false}
              clearable={false}
              className="w-auto"
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(1)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title={currentL10n.first}
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Prev page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title={currentL10n.prev}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange?.(page)}
                className={`
                  w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? isSupplier
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25 border border-blue-600'
                        : 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/25 border border-emerald-600'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs'
                  }
                `}
              >
                {page}
              </button>
            );
          })}

          {/* Next page */}
          <button
            type="button"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() => onPageChange?.(safeCurrentPage + 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title={currentL10n.next}
          >
            <ChevronRight size={15} />
          </button>

          {/* Last page */}
          <button
            type="button"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() => onPageChange?.(safeTotalPages)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title={currentL10n.last}
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
