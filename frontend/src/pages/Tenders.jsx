import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Trash2 } from 'lucide-react';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Tenders({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const [tenders, setTenders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [loading, setLoading] = useState(false);


  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(lang === 'RU' ? 'Вы уверены, что хотите безвозвратно удалить этот тендер?' : 'Siz bu tenderi pozjakdygyňyza ynamyňyz barmy?');
    if (!isConfirmed) return;

    try {
      await API.delete(`/tenders/${id}`);
      fetchTenders();
    } catch (error) {
      console.error(error);
      alert(lang === 'RU' ? 'Ошибка при удалении' : 'Pozmakda säwlik ýüze çykdy');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTenders();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, typeFilter, search]);

  const list = tenders; // Серверный поиск, данные уже отфильтрованы

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
      return item.specs.map(s => s.description || s.generalProduct?.name || s.name).filter(Boolean).join(', ') || (lang === 'RU' ? 'Согласно стандартам' : 'TDS standartly');
    }
    return lang === 'RU' ? 'Согласно стандартам' : 'TDS standartly';
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('tendersListTitle', 'Tenderler')}</h2>
        <span className={`text-xs font-medium ${theme.subText}`}>{lang === 'RU' ? 'Полный список доступных тендеров' : 'Ähli tenderlerin тизмеси'}</span>
      </div>

      {/* Панель фильтров */}
      <div className={`p-4 rounded-xl border shadow-xs space-y-3 ${theme.cardBg}`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>{t('type', 'Görnüşi')}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="">{lang === 'RU' ? 'Все' : 'Ählisi'}</option>
              <option value="YERLI">{lang === 'RU' ? 'Местный' : 'Ýerli'}</option>
              <option value="HALKARA">{lang === 'RU' ? 'Международный' : 'Halkara'}</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>{t('status', 'Status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="">{lang === 'RU' ? 'Все' : 'Ählisi'}</option>
              <option value="ACYK">{lang === 'RU' ? 'Открыт' : 'Açyk'}</option>
              <option value="YAPYK">{lang === 'RU' ? 'Закрыт' : 'Ýapyk'}</option>
              <option value="BAHALANDYRYLDY">{lang === 'RU' ? 'Оценен' : 'Bahalandyryldy'}</option>
              <option value="YENIJI_YGLAN_EDILDI">{lang === 'RU' ? 'Победитель' : 'Ýeňiji yglan edildi'}</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>{t('announcementDate', 'Yglan edilen senesi')}</label>
            <input type="text" placeholder="../../...." className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg}`} />
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>{t('deadline', 'Soňky möhleti')}</label>
            <input type="text" placeholder="../../...." className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg}`} />
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${theme.subText}`}>{t('visibility', 'Açyklygy')}</label>
            <select className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg}`}>
              <option value="">{lang === 'RU' ? 'Все' : 'Ählisi'}</option>
              <option value="ACYK">{lang === 'RU' ? 'Открытый' : 'Açyk'}</option>
              <option value="YAPYK">{lang === 'RU' ? 'Закрытый' : 'Ýapyk'}</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="relative w-full">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Gözleg...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs ${theme.inputBg}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3.5 px-4 w-24 text-center">{t('lotNo', 'Lot №')}</th>
                <th className="py-3.5 px-4 w-48 text-center">{t('title', 'Ady')}</th>
                <th className="py-3.5 px-4 text-center">{t('description', 'Mazmuny')}</th>
                <th className="py-3.5 px-4 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-3.5 px-4 text-center">{t('status', 'Status')}</th>
                <th className="py-3.5 px-4 text-center">{t('announcementDate', 'Yglan edilen senesi')}</th>
                <th className="py-3.5 px-4 text-center">{t('deadline', 'Soňky möhleti')}</th>
                <th className="py-3.5 px-4 text-center">{t('visibility', 'Açyklygy')}</th>
                <th className="py-3.5 px-4 text-center">{t('technicalSpecs', 'Tehniki şartler')}</th>
                <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold">{safeString(item.tenderNumber)}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{safeString(item.title)}</td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-[220px] whitespace-normal break-words ${theme.subText}`}>{safeString(item.description)}</td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(item.type, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                    <td className={`py-3.5 px-4 text-center ${theme.subText}`}>{formatDate(item.announcementDate || item.date)}</td>
                    <td className={`py-3.5 px-4 text-center ${theme.subText}`}>{formatDate(item.deadline)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'} font-semibold text-xs`}>
                        {item.visibility === 'YAPYK' ? (lang === 'RU' ? 'Закрытый' : 'Ýapyk') : (lang === 'RU' ? 'Открытый' : 'Açyk')}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-[180px] whitespace-normal break-words ${theme.subText}`}>{renderTechSpecs(item)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onNavigate('tender-details', item.id)}
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                          title={t('viewDetails', 'Детальнее')}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {(role === 'ADMIN' || role === 'PURCHASING_SPECIALIST') && (
                          <>
                            <button
                              onClick={() => alert(lang === 'RU' ? 'Редактирование пока недоступно' : 'Üýtgetmek häzirlikçe elýeterli däl')}
                              className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                              title={t('edit', 'Изменить')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
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
