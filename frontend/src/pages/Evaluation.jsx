import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, FileText, Search, X, Clock, Building2, Layers, AlertCircle, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { getStatusBadge } from '../utils/statusUtils';
import CustomSelect from '../components/CustomSelect';

export default function Evaluation({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEADLINE_ASC'); // 'DEADLINE_ASC' | 'DEADLINE_DESC' | 'NEWEST' | 'OFFERS_DESC'

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

  // Unique clients for filter
  const uniqueClients = Array.from(
    new Set(
      tenders
        .map(c => c.client?.name)
        .filter(Boolean)
    )
  ).sort();

  // Filter & sort tenders
  const filteredTenders = tenders
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

  // Summary statistics
  const totalTendersCount = tenders.length;
  const inProgressCount = tenders.filter(item => item.status !== 'YENIJI_YGLAN_EDILDI').length;
  const completedCount = tenders.filter(item => item.status === 'YENIJI_YGLAN_EDILDI').length;
  const totalOffersCount = tenders.reduce((sum, item) => sum + (item._count?.offers || 0), 0);

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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* 1. Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Trophy size={26} className="text-emerald-600 dark:text-emerald-400" />
            {t('evaluationHeaderSubtitle', 'Оценка заявок и определение победителей')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('fullscreenRegistrySubtitle', 'Полноэкранный реестр закупочных процедур. Выберите тендер для перехода в специализированный рабочий стол сравнения лотов.')}
          </p>
        </div>
      </div>

      {/* 2. Top Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('totalTendersMetric', 'Всего тендеров')}
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalTendersCount}</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('statusBahalandyryldy', 'На рассмотрении')}
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('submittedOffers', 'Подано предложений')}
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalOffersCount}</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${theme.cardBg} flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('resultsAnnouncedStatus', 'Итоги оглашены')}
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <div className={`p-4 rounded-xl border shadow-xs ${theme.cardBg} flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchTenderFullPlaceholder', 'Поиск по номеру, названию, заказчику...')}
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-lg ${theme.inputBg}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Client filter */}
          <div className="min-w-[170px]">
            <CustomSelect
              role="ADMIN"
              value={selectedClient}
              onChange={(val) => setSelectedClient(val)}
              options={[
                { id: 'ALL', name: t('allCustomersFilter', 'Все заказчики') },
                ...uniqueClients.map(c => ({ id: c, name: c }))
              ]}
              searchable={uniqueClients.length > 5}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />
          </div>

          {/* Status filter */}
          <div className="min-w-[160px]">
            <CustomSelect
              role="ADMIN"
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={[
                { id: 'ALL', name: t('allStatusesFilter', 'Все статусы') },
                { id: 'IN_PROGRESS', name: t('statusBahalandyryldy', 'На рассмотрении') },
                { id: 'COMPLETED', name: t('finalizedStatus', 'Итоги подведены') }
              ]}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />
          </div>

          {/* Sort */}
          <div className="min-w-[180px]">
            <CustomSelect
              role="ADMIN"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { id: 'DEADLINE_ASC', name: t('sortDeadlineAsc', 'Срок: сначала срочные') },
                { id: 'DEADLINE_DESC', name: t('sortDeadlineDesc', 'Срок: по убыванию') },
                { id: 'OFFERS_DESC', name: t('sortOffersDesc', 'Заявки: больше предложений') },
                { id: 'NEWEST', name: t('sortDateDesc', 'Дата: сначала новые') }
              ]}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* 4. Full-Width 100% Registry Table */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
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
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={theme.tableHeaderBg}>
                  <th className="py-3 px-4 font-semibold w-40">{t('tenderNumberTitle', 'Номер тендера')}</th>
                  <th className="py-3 px-4 font-semibold">{t('procurementTitleColumn', 'Наименование закупки')}</th>
                  <th className="py-3 px-4 font-semibold w-52">{t('client', 'Заказчик')}</th>
                  <th className="py-3 px-4 font-semibold text-center w-28">{t('lotsColumn', 'Лоты')}</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">{t('submittedOffers', 'Подано заявок')}</th>
                  <th className="py-3 px-4 font-semibold w-40">{t('deadline', 'Крайний срок')}</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">{t('status', 'Статус')}</th>
                  <th className="py-3 px-4 font-semibold text-right w-44">{t('action', 'Действие')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTenders.map(tender => {
                  const offersCount = tender._count?.offers || 0;
                  const lotsCount = tender._count?.lots || 0;
                  const isExpired = new Date(tender.deadline) < new Date();
                  const isCompleted = tender.status === 'YENIJI_YGLAN_EDILDI';
                  const isFailed = offersCount === 0 && (isExpired || tender.status === 'YAPYK');

                  return (
                    <tr key={tender.id} className={`${theme.tableRowHover} transition-colors group`}>
                      {/* Номер тендера */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        <Link
                          to={offersCount === 0 ? `/tenders/${tender.id}` : `/evaluation/${tender.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {tender.tenderNumber}
                        </Link>
                      </td>

                      {/* Наименование закупки */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {tender.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {tender.category?.name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              {tender.category.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {tender.type === 'YERLI' ? (t('typeLocal', 'Местный')) : (t('typeGlobal', 'Международный'))}
                          </span>
                        </div>
                      </td>

                      {/* Заказчик */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{tender.client?.name || '—'}</span>
                        </div>
                      </td>

                      {/* Количество лотов */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                          {lotsCount > 0 ? `${lotsCount} ${t('lotsAbbr', 'лот.')}` : `1 ${t('lotUpperLabel', 'лот')}`}
                        </span>
                      </td>

                      {/* Подано предложений */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            offersCount > 0
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <FileText size={12} />
                          {offersCount} {t('offersSuffix', 'заявок')}
                        </span>
                      </td>

                      {/* Крайний срок */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(tender.deadline).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="mt-0.5">{getDeadlineBadge(tender.deadline)}</div>
                      </td>

                      {/* Статус */}
                      <td className="py-3 px-4 text-center">
                        {isFailed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {t('tenderFailedStatus', 'Не состоялся')}
                          </span>
                        ) : (
                          getStatusBadge(tender.status, lang, isDarkMode)
                        )}
                      </td>

                      {/* Действие */}
                      <td className="py-3 px-4 text-right">
                        {isCompleted ? (
                          <Link
                            to={`/evaluation/${tender.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <FileText size={13} className="text-slate-400" />
                            <span>{t('resultsProtocolBtn', 'Итоги / Протокол')}</span>
                          </Link>
                        ) : isFailed ? (
                          <Link
                            to={`/tenders/${tender.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Eye size={13} />
                            <span>{t('viewDetails', 'Подробнее')}</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/evaluation/${tender.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <span>{t('evaluateBidsBtn', 'Оценить заявки')}</span>
                            <ArrowRight size={13} />
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

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            {t('displayedTendersCount', 'Отображено тендеров')}: <strong className="text-slate-700 dark:text-slate-200">{filteredTenders.length}</strong> {t('fromWord', 'из')} {totalTendersCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {t('openEvaluationPrompt', 'Нажмите на кнопку «Оценить заявки» для перехода на полноэкранный рабочий стол')}
          </div>
        </div>
      </div>
    </div>
  );
}
