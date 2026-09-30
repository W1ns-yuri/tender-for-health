import React, { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import CustomDatePicker from '../components/CustomDatePicker';
import { TableFilters } from '../components/ui';

export default function Tenders({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const [tenders, setTenders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [announcementDateFilter, setAnnouncementDateFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');

  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();

  const [loading, setLoading] = useState(false);


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
      fetchTenders();
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTenders();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, typeFilter, search]);

  const list = tenders.filter(item => {
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

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tenders', {
        params: { 
          status: statusFilter || undefined, 
          type: typeFilter || undefined,
          search: search.trim() || undefined 
        }
      });
      if (res.data && Array.isArray(res.data)) setTenders(res.data);
    } catch (e) {
      console.log('Error fetching tenders', e);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Панель фильтров */}
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
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { id: '', name: t('allStatuses', 'Все статусы') },
              { id: 'ACYK', name: t('statusAcyk', 'Открыт') },
              { id: 'YAPYK', name: t('statusYapyk', 'Закрыт') },
              { id: 'BAHALANDYRYLDY', name: t('statusBahalandyryldy', 'На рассмотрении') },
              { id: 'YENIJI_YGLAN_EDILDI', name: t('winnerBadge', 'Победитель') },
              { id: 'TASLAMA', name: t('statusDraft', 'Черновик') }
            ],
            width: 'min-w-[160px]'
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
        hasActiveFilters={Boolean(search || typeFilter || statusFilter || announcementDateFilter || deadlineFilter)}
        onReset={() => {
          setSearch('');
          setTypeFilter('');
          setStatusFilter('');
          setAnnouncementDateFilter('');
          setDeadlineFilter('');
        }}
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

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
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">{safeString(item.tenderNumber)}</td>
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
      </div>
    </div>
  );
}
