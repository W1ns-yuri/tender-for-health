import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, FileText, Clock, Building2, Layers, AlertCircle, ArrowRight, Eye, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { getStatusBadge } from '../utils/statusUtils';
import { TableFilters, Pagination } from '../components/ui';
import { pluralize } from '../utils/pluralize';

export default function Evaluation({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback, params) => getTranslation(lang, key, fallback, params);

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEADLINE_ASC'); // 'DEADLINE_ASC' | 'DEADLINE_DESC' | 'NEWEST' | 'OFFERS_DESC'

  // Пагинация (по умолчанию 10 строк на страницу, как в UI Kit)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Сброс страницы при смене любых фильтров или поиска
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClient, selectedStatus, sortBy]);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/evaluation/tenders');
      setTenders(res.data || []);
    } catch (e) {
      console.error('Failed to fetch evaluation tenders', e);
    } finally {
      setLoading(false);
    }
  };

  // Исключаем черновики (TASLAMA) - они не опубликованы и не подлежат оценке
  const publishedTenders = tenders.filter(t => t.status !== 'TASLAMA');

  // Unique clients for filter
  const uniqueClients = Array.from(
    new Set(
      publishedTenders
        .map(c => c.client?.name)
        .filter(Boolean)
    )
  ).sort();

  // Filter & sort tenders
  const filteredTenders = publishedTenders
    .filter(tender => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (tender.tenderNumber || '').toLowerCase();
        const title = (tender.title || '').toLowerCase();
        const client = (tender.client?.name || '').toLowerCase();
        const cat = (tender.category?.name || '').toLowerCase();
        if (!num.includes(q) && !title.includes(q) && !client.includes(q) && !cat.includes(q)) {
          return false;
        }
      }

      // Client filter
      if (selectedClient !== 'ALL' && tender.client?.name !== selectedClient) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'IN_PROGRESS' && tender.status === 'YENIJI_YGLAN_EDILDI') return false;
        if (selectedStatus === 'COMPLETED' && tender.status !== 'YENIJI_YGLAN_EDILDI') return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'DEADLINE_ASC') {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === 'DEADLINE_DESC') {
        return new Date(b.deadline) - new Date(a.deadline);
      }
      if (sortBy === 'OFFERS_DESC') {
        return (b._count?.offers || 0) - (a._count?.offers || 0);
      }
      // NEWEST
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  // Пагинация: расчет страниц и среза отображаемых записей
  const totalItems = filteredTenders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTenders = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredTenders.slice(startIndex, startIndex + pageSize);
  }, [filteredTenders, safeCurrentPage, pageSize]);

  // Summary statistics
  const totalTendersCount = publishedTenders.length;
  const inProgressCount = publishedTenders.filter(item => item.status !== 'YENIJI_YGLAN_EDILDI').length;
  const completedCount = publishedTenders.filter(item => item.status === 'YENIJI_YGLAN_EDILDI').length;
  const totalOffersCount = publishedTenders.reduce((sum, item) => sum + (item._count?.offers || 0), 0);

  const getDeadlineBadge = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
          {t('deadlineExpiredBadge', 'Срок истёк')}
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 animate-pulse">
          {t('todayBtn', 'Сегодня')}
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
          {t('daysRemainingCount', `Осталось ${diffDays} дн.`, { diffDays })}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-slate-400">
        {t('daysCountShort', `${diffDays} дн.`, { diffDays })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('evaluationHeaderSubtitle', 'Оценка заявок и определение победителей')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('fullscreenRegistrySubtitle', 'Полноэкранный реестр закупочных процедур. Выберите тендер для перехода в специализированный рабочий стол сравнения лотов.')}
          </p>
        </div>
      </div>

      {/* 2. Top Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={t('totalTendersMetric', 'Всего тендеров')}>
              {t('totalTendersMetric', 'Всего тендеров')}
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalTendersCount}</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={t('statusBahalandyryldy', 'На рассмотрении')}>
              {t('statusBahalandyryldy', 'На рассмотрении')}
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={t('submittedOffers', 'Подано предложений')}>
              {t('submittedOffers', 'Подано предложений')}
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalOffersCount}</div>
          </div>
        </div>

        <div className={`p-3 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={t('resultsAnnouncedStatus', 'Итоги оглашены')}>
              {t('resultsAnnouncedStatus', 'Итоги оглашены')}
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <TableFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchTenderFullPlaceholder', 'Поиск по номеру, названию, заказчику...')}
        filters={[
          {
            id: 'client',
            value: selectedClient,
            onChange: setSelectedClient,
            options: [
              { id: 'ALL', name: t('allCustomersFilter', 'Все заказчики') },
              ...uniqueClients.map(c => ({ id: c, name: c }))
            ],
            searchable: uniqueClients.length > 5,
            width: 'min-w-[170px]'
          },
          {
            id: 'status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { id: 'ALL', name: t('allStatusesFilter', 'Все статусы') },
              { id: 'IN_PROGRESS', name: t('statusBahalandyryldy', 'На рассмотрении') },
              { id: 'COMPLETED', name: t('finalizedStatus', 'Итоги подведены') }
            ],
            width: 'min-w-[160px]'
          },
          {
            id: 'sort',
            value: sortBy,
            onChange: setSortBy,
            options: [
              { id: 'DEADLINE_ASC', name: t('sortDeadlineAsc', 'Срок: сначала срочные') },
              { id: 'DEADLINE_DESC', name: t('sortDeadlineDesc', 'Срок: по убыванию') },
              { id: 'OFFERS_DESC', name: t('sortOffersDesc', 'Заявки: больше предложений') },
              { id: 'NEWEST', name: t('sortDateDesc', 'Дата: сначала новые') }
            ],
            width: 'min-w-[180px]'
          }
        ]}
        hasActiveFilters={Boolean(searchQuery || selectedClient !== 'ALL' || selectedStatus !== 'ALL' || sortBy !== 'DEADLINE_ASC')}
        onReset={() => {
          setSearchQuery('');
          setSelectedClient('ALL');
          setSelectedStatus('ALL');
          setSortBy('DEADLINE_ASC');
        }}
        role="ADMIN"
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 4. Full-Width 100% Registry Table */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg} ${theme.tableCardBorderTop}`}>
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-sm font-medium">{t('loadingTendersRegistry', 'Загрузка реестра тендеров...')}</p>
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <AlertCircle size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {searchQuery || selectedClient !== 'ALL' || selectedStatus !== 'ALL'
                ? (t('noTendersFoundFilters', 'Ничего не найдено по заданным фильтрам'))
                : (t('noTendersAwaitingEval', 'Нет тендеров, ожидающих оценки заявок'))}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('tryResettingSearch', 'Попробуйте сбросить параметры поиска')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <colgroup>
                <col className="w-[115px]" />
                <col />
                <col className="w-[85px]" />
                <col className="w-[85px]" />
                <col className="w-[130px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr className={theme.tableHeaderBg}>
                  <th className="py-2.5 px-2.5 font-semibold whitespace-nowrap">{t('tenderNumberTitle', 'Номер')}</th>
                  <th className="py-2.5 px-2.5 font-semibold">{t('procurementTitleColumn', 'Наименование закупки / Заказчик')}</th>
                  <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">{t('offersColumnShort', 'Заявки')}</th>
                  <th className="py-2.5 px-2 font-semibold whitespace-nowrap">{t('deadlineShort', 'Срок')}</th>
                  <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">{t('status', 'Статус')}</th>
                  <th className="py-2.5 px-2.5 font-semibold text-right pr-3 whitespace-nowrap">{t('action', 'Действие')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTenders.map(tender => {
                  const offersCount = tender._count?.offers || 0;
                  const lotsCount = tender._count?.lots || 0;
                  const isExpired = new Date(tender.deadline) < new Date();
                  const isCompleted = tender.status === 'YENIJI_YGLAN_EDILDI';
                  const isFailed = offersCount === 0 && (isExpired || tender.status === 'YAPYK');

                  return (
                    <tr key={tender.id} className={`${theme.tableRowHover} transition-colors group`}>
                      {/* Номер тендера */}
                      <td className="py-2 px-2.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        <Link
                          to={offersCount === 0 ? `/tenders/${tender.id}` : `/evaluation/${tender.id}`}
                          className="hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>{tender.tenderNumber}</span>
                          {tender.visibility === 'YAPYK' && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                              <Lock size={9} />
                              <span>ÝAPYK</span>
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* Наименование закупки + Заказчик */}
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={tender.title}>
                          {tender.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <div className="flex items-center gap-1 min-w-0 max-w-[200px]" title={tender.client?.name || ''}>
                            <Building2 size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{tender.client?.name || '—'}</span>
                          </div>
                          {tender.category?.name && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium truncate max-w-[130px]">
                              {tender.category.name}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 whitespace-nowrap">
                            {tender.type === 'YERLI' ? (t('typeLocal', 'Местный')) : (t('typeGlobal', 'Международный'))}
                          </span>
                        </div>
                      </td>

                      {/* Заявки и Лоты */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              offersCount > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60'
                            }`}
                          >
                            <FileText size={10} />
                            <span>{pluralize(offersCount, ['заявка', 'заявки', 'заявок'])}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {lotsCount > 0 ? pluralize(lotsCount, ['лот', 'лота', 'лотов']) : `1 ${t('lotUpperLabel', 'лот')}`}
                          </span>
                        </div>
                      </td>

                      {/* Крайний срок */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                          {new Date(tender.deadline).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="mt-0.5">{getDeadlineBadge(tender.deadline)}</div>
                      </td>

                      {/* Статус */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {isFailed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {t('tenderFailedStatus', 'Не состоялся')}
                          </span>
                        ) : (
                          getStatusBadge(tender.status, lang, isDarkMode, 'px-2 py-0.5 text-[10px] rounded-md whitespace-nowrap inline-flex items-center justify-center border font-semibold')
                        )}
                      </td>

                      {/* Действие */}
                      <td className="py-2 px-2.5 pr-3 text-right whitespace-nowrap">
                        {isCompleted ? (
                          <Link
                            to={`/evaluation/${tender.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap"
                          >
                            <FileText size={11} className="text-slate-400" />
                            <span>{t('protocolShortBtn', 'Протокол')}</span>
                          </Link>
                        ) : isFailed ? (
                          <Link
                            to={`/tenders/${tender.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap"
                          >
                            <Eye size={11} />
                            <span>{t('detailsShortBtn', 'Детали')}</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/evaluation/${tender.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                          >
                            <span>{t('evaluateShortBtn', 'Оценить')}</span>
                            <ArrowRight size={11} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Панель пагинации из UI Kit */}
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
          role={role || 'ADMIN'}
          lang={lang}
        />
      </div>
    </div>
  );
}
