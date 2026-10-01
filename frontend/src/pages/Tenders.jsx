import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Eye, Edit2, Trash2, Lock } from 'lucide-react';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import CustomDatePicker from '../components/CustomDatePicker';
import { TableFilters, Tabs, Pagination, TableSkeletonRows } from '../components/ui';

export default function Tenders({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const [tenders, setTenders] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [announcementDateFilter, setAnnouncementDateFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Пагинация (по умолчанию 10 строк на страницу, как в UI Kit)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();

  // Дебаунс поискового запроса: обновляет debouncedSearch через 300мс после окончания ввода
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Загрузка данных с флагом отмены (предотвращает двойной рендер скелетона и дергание в React StrictMode)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    API.get('/tenders', {
      params: { 
        type: typeFilter || undefined,
        search: debouncedSearch.trim() || undefined 
      }
    })
      .then(res => {
        if (!isCancelled && res.data && Array.isArray(res.data)) {
          setTenders(res.data);
        }
      })
      .catch(e => {
        if (!isCancelled) console.log('Error fetching tenders', e);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [typeFilter, debouncedSearch]);

  const fetchTenders = async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await API.get('/tenders', {
        params: { 
          type: typeFilter || undefined,
          search: debouncedSearch.trim() || undefined 
        }
      });
      if (res.data && Array.isArray(res.data)) {
        setTenders(res.data);
      }
    } catch (e) {
      console.log('Error fetching tenders', e);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: t('deleteTenderTitle', 'Удаление тендера'),
      message: t('deleteTenderConfirm', 'Вы уверены, что хотите безвозвратно удалить этот тендер?'),
      type: 'danger',
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancelEditBtn', 'Отмена'),
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      await API.delete(`/tenders/${id}`);
      setTenders(prev => prev.filter(t => t.id !== id));
      fetchTenders(false);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('tenderDeletedSuccess', 'Тендер успешно удален'),
        type: 'success'
      });
    } catch (error) {
      console.error(error);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: t('deleteError', 'Ошибка при удалении'),
        type: 'error'
      });
    }
  };

  // Сброс страницы на 1 при изменении фильтров поиска и дат
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, announcementDateFilter, deadlineFilter]);

  // 1. Подсчет количества тендеров по статусам для бейджей на вкладках
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: tenders.length,
      ACYK: 0,
      BAHALANDYRYLDY: 0,
      FINISHED: 0,
      TASLAMA: 0
    };
    tenders.forEach(item => {
      if (item.status === 'ACYK') counts.ACYK++;
      else if (item.status === 'BAHALANDYRYLDY') counts.BAHALANDYRYLDY++;
      else if (item.status === 'YENIJI_YGLAN_EDILDI' || item.status === 'YAPYK') counts.FINISHED++;
      else if (item.status === 'TASLAMA') counts.TASLAMA++;
    });
    return counts;
  }, [tenders]);

  // 2. Вкладки статусов: открытые, на оценке, завершенные, черновики (для админа)
  const statusTabs = [
    { id: 'ALL', label: t('allTendersTab', 'Все закупки'), count: statusCounts.ALL },
    { id: 'ACYK', label: t('openTendersTab', 'Открытые (Прием заявок)'), count: statusCounts.ACYK },
    { id: 'BAHALANDYRYLDY', label: t('underEvaluationTab', 'На рассмотрении'), count: statusCounts.BAHALANDYRYLDY },
    { id: 'FINISHED', label: t('statusFinished', 'Завершенные'), count: statusCounts.FINISHED },
    ...(role === 'ADMIN' || role === 'PURCHASING_SPECIALIST' ? [{
      id: 'TASLAMA',
      label: t('draftTendersTab', 'Черновики / Проекты'),
      count: statusCounts.TASLAMA
    }] : [])
  ];

  const handleTabChange = (tabId) => {
    setActiveStatusTab(tabId);
    setCurrentPage(1);
  };

  // 3. Фильтрация данных по статусной вкладке и выбранным датам
  const filteredList = useMemo(() => {
    return tenders.filter(item => {
      if (activeStatusTab === 'ACYK' && item.status !== 'ACYK') return false;
      if (activeStatusTab === 'BAHALANDYRYLDY' && item.status !== 'BAHALANDYRYLDY') return false;
      if (activeStatusTab === 'FINISHED' && item.status !== 'YENIJI_YGLAN_EDILDI' && item.status !== 'YAPYK') return false;
      if (activeStatusTab === 'TASLAMA' && item.status !== 'TASLAMA') return false;

      if (visibilityFilter && item.visibility !== visibilityFilter) return false;

      if (announcementDateFilter) {
        const itemDate = item.announcementDate ? item.announcementDate.slice(0, 10) : '';
        if (itemDate !== announcementDateFilter) return false;
      }
      if (deadlineFilter) {
        const itemDeadline = item.deadline ? item.deadline.slice(0, 10) : '';
        if (itemDeadline !== deadlineFilter) return false;
      }
      return true;
    });
  }, [tenders, activeStatusTab, announcementDateFilter, deadlineFilter]);

  // 4. Пагинация: расчет страниц и среза отображаемых записей
  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, safeCurrentPage, pageSize]);

  const renderTechSpecs = (item) => {
    if (typeof item.technicalSpecs === 'string') return item.technicalSpecs;
    if (typeof item.specs === 'string') return item.specs;
    if (Array.isArray(item.specs)) {
      return item.specs.map(s => s.description || s.generalProduct?.name || s.name).filter(Boolean).join(', ') || (t('accordingToStandards', 'Согласно стандартам'));
    }
    return t('accordingToStandards', 'Согласно стандартам');
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '30.01.2026';
    if (typeof dateVal === 'string' && /^\d{2}\.\d{2}\.\d{4}/.test(dateVal)) return dateVal;
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return '30.01.2026';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Заголовок страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('tendersListTitle', 'Tenderler')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('allAvailableTenders', 'Полный список доступных тендеров')}
          </p>
        </div>
      </div>

      {/* 2. Статусные вкладки со счетчиками (Pills Tabs) */}
      <Tabs
        variant="pills"
        role={role}
        activeTab={activeStatusTab}
        onChange={handleTabChange}
        tabs={statusTabs}
      />

      {/* 3. Панель расширенных фильтров */}
      <TableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('searchPlaceholder', 'Gözleg...')}
        filters={[
          {
            id: 'type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { id: '', name: t('allTypes', 'Все типы') },
              { id: 'YERLI', name: t('typeLocal', 'Местный') },
              { id: 'HALKARA', name: t('typeGlobal', 'Международный') }
            ],
            width: 'min-w-[140px]'
          },
          {
            id: 'visibility',
            value: visibilityFilter,
            onChange: setVisibilityFilter,
            options: [
              { id: '', name: t('allAccess', 'Все доступы') },
              { id: 'ACYK', name: t('openTendersOnly', 'Открытые (Açyk)') },
              { id: 'YAPYK', name: t('closedTendersOnly', 'Закрытые (Ýapyk)') }
            ],
            width: 'min-w-[155px]'
          }
        ]}
        customControls={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <CustomDatePicker
                size="sm"
                value={announcementDateFilter}
                onChange={setAnnouncementDateFilter}
                isDarkMode={isDarkMode}
                lang={lang}
                theme={theme}
                placeholder={t('announcementDateShort', 'Дата публ.')}
              />
            </div>
            <div className="w-36">
              <CustomDatePicker
                size="sm"
                value={deadlineFilter}
                onChange={setDeadlineFilter}
                isDarkMode={isDarkMode}
                lang={lang}
                theme={theme}
                placeholder={t('deadlineShort', 'Дедлайн')}
              />
            </div>
          </div>
        }
        hasActiveFilters={Boolean(search || typeFilter || activeStatusTab !== 'ALL' || announcementDateFilter || deadlineFilter)}
        onReset={() => {
          setSearch('');
          setTypeFilter('');
          setActiveStatusTab('ALL');
          setAnnouncementDateFilter('');
          setDeadlineFilter('');
          setCurrentPage(1);
        }}
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 4. Таблица реестра тендеров с пагинацией */}
      <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={theme.tableHeaderBg}>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 w-28 text-center">{t('lotNo', 'Lot №')}</th>
                <th className="py-3.5 px-4 w-48 text-center">{t('title', 'Ady')}</th>
                <th className="py-3.5 px-4 text-center">{t('description', 'Mazmuny')}</th>
                <th className="py-3.5 px-4 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-3.5 px-4 text-center">{t('status', 'Status')}</th>
                <th className="py-3.5 px-4 text-center">{t('announcementDate', 'Yglan edilen senesi')}</th>
                <th className="py-3.5 px-4 text-center">{t('deadline', 'Soňky möhleti')}</th>
                <th className="py-3.5 px-4 text-center">{t('technicalSpecs', 'Tehniki şartler')}</th>
                <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <TableSkeletonRows rows={pageSize || 5} cols={9} />
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                      <div className="flex flex-col items-center gap-1">
                        <span>{safeString(item.tenderNumber)}</span>
                        {item.visibility === 'YAPYK' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                            <Lock size={10} />
                            <span>{t('closedBadge', 'Закрытый')}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">{safeString(item.title)}</td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-55 whitespace-normal text-wrap ${theme.subText}`}>{safeString(item.description)}</td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(item.type, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                    <td className={`py-3.5 px-4 text-center tabular-nums ${theme.subText}`}>{formatDate(item.announcementDate || item.date)}</td>
                    <td className={`py-3.5 px-4 text-center tabular-nums ${theme.subText}`}>{formatDate(item.deadline)}</td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-45 whitespace-normal text-wrap ${theme.subText}`}>{renderTechSpecs(item)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onNavigate('tender-details', item.id)}
                          className={theme.actionBtn}
                          title={t('viewDetails', 'Детальнее')}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {(role === 'ADMIN' || role === 'PURCHASING_SPECIALIST') && (
                          <>
                            <button
                              onClick={() => onNavigate('edit-tender', item.id)}
                              className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 transition-all active:scale-95 cursor-pointer"
                              title={t('edit', 'Изменить')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                              title={t('delete', 'Удалить')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
          role={role}
          lang={lang}
          isDarkMode={isDarkMode}
          theme={theme}
        />
      </div>
    </div>
  );
}
