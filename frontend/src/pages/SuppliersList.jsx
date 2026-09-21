import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Archive, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  UserCheck
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import AddSupplierModal from '../components/AddSupplierModal';
import EditSupplierModal from '../components/EditSupplierModal';
import RejectSupplierModal from '../components/RejectSupplierModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export default function SuppliersList({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, showConfirm } = useAlert();

  const [suppliers, setSuppliers] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [supplierToReject, setSupplierToReject] = useState(null);
  const [search, setSearch] = useState('');

  // Вкладки: 'all', 'pending', 'archive'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'all');

  // Архив модерации
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [archiveStats, setArchiveStats] = useState({
    totalDecisions: 0,
    totalApproved: 0,
    totalRejected: 0,
    pendingCount: 0
  });
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('ALL');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchSuppliers();
    fetchPendingSuppliers();
    if (role === 'ADMIN') {
      fetchModerationArchive();
    }
    API.get('/catalogs/countries').then(r => setCountries(r.data.filter(c => c.isActive))).catch(() => {});
  }, [role]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/suppliers');
      if (res.data && Array.isArray(res.data)) {
        setSuppliers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSuppliers = async () => {
    if (role !== 'ADMIN') return;
    try {
      const res = await API.get('/suppliers/pending');
      if (res.data && Array.isArray(res.data)) {
        setPendingSuppliers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending suppliers', err);
    }
  };

  const fetchModerationArchive = async () => {
    if (role !== 'ADMIN') return;
    try {
      setArchiveLoading(true);
      const res = await API.get('/suppliers/moderation/archive');
      if (res.data) {
        setArchiveLogs(res.data.logs || []);
        setArchiveStats(res.data.stats || {
          totalDecisions: 0,
          totalApproved: 0,
          totalRejected: 0,
          pendingCount: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch moderation archive', err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: t('deleteSupplierTitle', 'Удаление поставщика'),
      message: t('deleteConfirm', 'Вы действительно хотите удалить этого поставщика?'),
      type: 'danger',
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancel', 'Отмена'),
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      await API.delete(`/suppliers/${id}`);
      fetchSuppliers();
      showAlert({
        title: t('success', 'Успешно'),
        message: t('supplierDeleted', 'Поставщик успешно удален'),
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to delete supplier', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: t('errorCreateSupplier', 'Ошибка при удалении'),
        type: 'error'
      });
    }
  };

  const handleApprove = async (supplier) => {
    const confirmText = t('approveConfirmText', 'Вы уверены, что хотите одобрить верификацию компании «{name}»?')
      .replace('{name}', supplier.name || '');
    const isConfirmed = await showConfirm({
      title: t('approveVerificationTitle', 'Одобрение верификации'),
      message: confirmText,
      type: 'success',
      confirmText: t('approve', 'Одобрить'),
      cancelText: t('cancel', 'Отмена'),
    });
    if (!isConfirmed) return;

    try {
      await API.post(`/suppliers/${supplier.id}/approve`);
      fetchPendingSuppliers();
      fetchSuppliers();
      fetchModerationArchive();
      showAlert({
        title: t('success', 'Успешно'),
        message: t('approvedSuccess', 'Верификация компании успешно одобрена'),
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || 'Ошибка при одобрении',
        type: 'error'
      });
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!supplierToReject) return;
    await API.post(`/suppliers/${supplierToReject.id}/reject`, { rejectionReason: reason });
    fetchPendingSuppliers();
    fetchSuppliers();
    fetchModerationArchive();
    setSupplierToReject(null);
  };

  // Фильтрация поставщиков
  const filteredSuppliers = suppliers.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.taxId || '').toLowerCase().includes(q) ||
      (s.regNo || '').toLowerCase().includes(q) ||
      (s.country?.name || '').toLowerCase().includes(q)
    );
  });

  // Фильтрация записей архива
  const filteredArchiveLogs = archiveLogs.filter(log => {
    const matchesSearch = !archiveSearch.trim() || 
      (log.supplier?.name || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (log.supplier?.taxId || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (log.admin ? `${log.admin.firstName} ${log.admin.lastName} ${log.admin.username}` : '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(archiveSearch.toLowerCase());

    const matchesAction = archiveFilter === 'ALL' || log.action === archiveFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* 1. Заголовок страницы и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {t('suppliersListTitle', 'Üpjün edijiler')}
          </h2>
          <p className={`text-xs ${theme.subText} mt-0.5`}>
            {t('suppliersListDesc', 'Ulgamda hasaba alnan üpjün edijiler')}
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all flex items-center space-x-2 ${theme.primaryBtn}`}
        >
          <Plus size={16} />
          <span>{t('addSupplier', 'Üpjün ediji goşmak')}</span>
        </button>
      </div>

      {/* 2. Навигационные вкладки для администратора в едином фирменном стиле */}
      {role === 'ADMIN' && (
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t('allSuppliers', 'Все поставщики')}
          </button>
          
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t('underModerationTab', 'На модерации')}</span>
            {pendingSuppliers.length > 0 && (
              <span className={`py-0.5 px-2 rounded-full text-[10px] font-bold ${
                activeTab === 'pending'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {pendingSuppliers.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={14} />
            <span>{t('moderationArchiveTab', 'Архив модерации')}</span>
            {archiveStats.totalDecisions > 0 && (
              <span className={`py-0.5 px-2 rounded-full text-[10px] font-bold ${
                activeTab === 'archive'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {archiveStats.totalDecisions}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Содержимое вкладок */}
      {activeTab === 'all' ? (
        /* Вкладка 1: Все поставщики */
        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
          <div className={`p-3.5 border-b grid grid-cols-1 md:grid-cols-4 gap-3 ${theme.cardHeaderBg}`}>
            <div className="col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder', 'Gözleg...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border focus:outline-hidden ${theme.inputBg}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={theme.tableHeaderBg}>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 text-center">{t('supplierName', 'Kompaniýanyň ady')}</th>
                  <th className="py-3.5 px-4 text-center">{t('country', 'Ýurt')}</th>
                  <th className="py-3.5 px-4 text-center">{t('regNo', 'Ýazgy belgisi')}</th>
                  <th className="py-3.5 px-4 text-center">{t('taxId', 'ИНН (STŞK)')}</th>
                  <th className="py-3.5 px-4 text-center">{t('license', 'Ygtyýarnama')}</th>
                  <th className="py-3.5 px-4 text-center">{t('status', 'Ýagdaýy')}</th>
                  <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      {t('loading', 'Ýüklenýär...')}
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <Search size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        {t('suppliersNotFoundNotice', 'Поставщики не найдены')}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search.trim()
                          ? (t('adjustSearchFilterPrompt', 'Попробуйте изменить поисковый запрос или сбросить фильтр.'))
                          : (t('noRegisteredSuppliersYet', 'В системе пока нет зарегистрированных поставщиков.'))}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s, idx) => (
                    <tr key={s.id || idx} className={theme.tableRowHover}>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {safeString(s.name)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {safeString(s.country?.name || s.countryName)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {safeString(s.regNumber)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {safeString(s.taxId)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {safeString(s.licenseNumber)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          s.isActive 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40'
                        }`}>
                          {s.isActive ? t('statusActive', 'Işjeň') : t('statusInactive', 'Işjeň däl')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center space-x-1">
                        <button 
                          onClick={() => navigate(`/suppliers/${s.id}`)} 
                          title={t('viewProfileTooltip', 'Посмотреть профиль')} 
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => setSupplierToEdit(s)} 
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        /* Вкладка 2: На модерации */
        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={theme.tableHeaderBg}>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 text-center">{t('companyColumnTitle', 'Компания')}</th>
                  <th className="py-3.5 px-4 text-center">{t('typeTaxIdColumn', 'Тип / ИНН')}</th>
                  <th className="py-3.5 px-4 text-center">{t('contacts', 'Контакты')}</th>
                  <th className="py-3.5 px-4 text-center">{t('bankColumnTitle', 'Банк')}</th>
                  <th className="py-3.5 px-4 text-center">{t('status', 'Статус')}</th>
                  <th className="py-3.5 px-4 text-center">{t('action', 'Действие')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {pendingSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      <Shield size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        {t('noModerationApplications', 'Нет заявок на модерацию')}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('allCompaniesReviewedNotice', 'Все компании проверены и имеют актуальный статус.')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingSuppliers.map((s, idx) => (
                    <tr key={s.id || idx} className={theme.tableRowHover}>
                      <td className="py-3.5 px-4 text-center">
                        <p className="font-bold text-slate-800 dark:text-white">{safeString(s.name)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">{s.type}</span>
                        <p className="font-mono mt-1 text-slate-500">{safeString(s.taxId)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <p className="font-medium">{safeString(s.phone || s.user?.phone || '-')}</p>
                        <p className="font-medium text-emerald-600">{safeString(s.email || '-')}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <p className="font-semibold">{safeString(s.bankName || '-')}</p>
                        <p className="font-mono text-[11px] text-slate-400">{safeString(s.bankAccount || '-')}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 rounded-full font-bold text-[11px]">
                          <Shield size={12} className="text-amber-500" />
                          <span>{s.verificationStatus === 'PENDING_REVIEW' ? t('statusInReviewBadge', 'На проверке') : t('statusPendingBadge', 'Требует проверки')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center space-x-1">
                        {/* 1. Посмотреть профиль */}
                        <button 
                          onClick={() => navigate(`/suppliers/${s.id}`)} 
                          title={t('viewProfileTooltip', 'Посмотреть профиль')}
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        {/* 2. Одобрить */}
                        <button 
                          onClick={() => handleApprove(s)} 
                          title={t('approveTooltip', 'Одобрить верификацию')}
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                        >
                          <CheckCircle size={16} />
                        </button>
                        {/* 3. Отклонить */}
                        <button 
                          onClick={() => setSupplierToReject(s)} 
                          title={t('rejectTooltip', 'Отклонить заявку')}
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                        >
                          <XCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Вкладка 3: Архив и история решений модератора */
        <div className="space-y-6">
          {/* Сводные KPI карточки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Всего решений */}
            <div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center gap-3.5 shadow-xs`}>
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Archive size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('totalDecisionsKpi', 'Всего решений')}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {archiveStats.totalDecisions}
                </p>
              </div>
            </div>

            {/* 2. Одобрено */}
            <div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center gap-3.5 shadow-xs`}>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('approvedKpi', 'Одобрено')}
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">
                  {archiveStats.totalApproved}
                </p>
              </div>
            </div>

            {/* 3. Отклонено */}
            <div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center gap-3.5 shadow-xs`}>
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('rejectedKpi', 'Отклонено')}
                </p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">
                  {archiveStats.totalRejected}
                </p>
              </div>
            </div>

            {/* 4. В очереди */}
            <div className={`p-4 rounded-2xl border ${theme.cardBg} flex items-center gap-3.5 shadow-xs`}>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('pendingQueueKpi', 'В очереди на проверку')}
                </p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">
                  {archiveStats.pendingCount}
                </p>
              </div>
            </div>
          </div>

          {/* Фильтры и таблица архива */}
          <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${theme.cardHeaderBg}`}>
              <div className="relative w-full sm:max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  placeholder={t('searchArchivePlaceholder', 'Поиск по компании, STŞK или модератору...')}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-hidden ${theme.inputBg}`}
                />
              </div>

              {/* Фильтр по типу решения */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {[
                  { id: 'ALL', label: t('allBtn', 'Все') },
                  { id: 'APPROVED', label: t('approvedKpi', 'Одобрено') },
                  { id: 'REJECTED', label: t('rejectedKpi', 'Отклонено') },
                  { id: 'RESUBMITTED', label: t('statusResubmittedBadge', 'Повторные') },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setArchiveFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                      archiveFilter === f.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={theme.tableHeaderBg}>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 text-center">{t('dateDecisionLabel', 'Дата и время')}</th>
                    <th className="py-3.5 px-4 text-center">{t('supplierName', 'Компания')}</th>
                    <th className="py-3.5 px-4 text-center">{t('decisionLabel', 'Решение')}</th>
                    <th className="py-3.5 px-4 text-center">{t('moderatorLabel', 'Модератор')}</th>
                    <th className="py-3.5 px-4 text-left">{t('remarksLabel', 'Замечания / Причина')}</th>
                    <th className="py-3.5 px-4 text-center">{t('action', 'Действие')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {archiveLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        {t('loading', 'Ýüklenýär...')}
                      </td>
                    </tr>
                  ) : filteredArchiveLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        <Archive size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          {t('emptyArchive', 'Архив решений пуст')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {t('moderationHistoryEmptyNotice', 'История проверок и принятых решений будет накапливаться здесь.')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredArchiveLogs.map((log) => (
                      <tr key={log.id} className={theme.tableRowHover}>
                        {/* Дата и время */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString(t('localeCode', 'ru-RU'), {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Компания и STSK */}
                        <td className="py-3.5 px-4 text-center">
                          <p className="font-bold text-slate-800 dark:text-white">
                            {safeString(log.supplier?.name || '-')}
                          </p>
                          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>{log.supplier?.type || ''}</span>
                            {log.supplier?.taxId && <span>• STŞK: {log.supplier.taxId}</span>}
                          </div>
                        </td>

                        {/* Решение / Статус */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {log.action === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-full font-bold text-[11px]">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>{t('statusApprovedBadge', 'Одобрено')}</span>
                            </span>
                          ) : log.action === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-full font-bold text-[11px]">
                              <XCircle size={12} className="text-rose-600" />
                              <span>{t('statusRejectedBadge', 'Отклонено')}</span>
                            </span>
                          ) : log.action === 'RESUBMITTED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-full font-bold text-[11px]">
                              <RefreshCw size={12} className="text-blue-600" />
                              <span>{t('statusResubmittedBadge', 'Повторная подача')}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-full font-bold text-[11px]">
                              <Clock size={12} className="text-amber-600" />
                              <span>{t('statusSubmittedBadge', 'Первичная подача')}</span>
                            </span>
                          )}
                        </td>

                        {/* Модератор */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {log.admin ? (
                            <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <UserCheck size={13} className="text-blue-500" />
                              <span>{log.admin.firstName} {log.admin.lastName || log.admin.username}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {log.action === 'SUBMITTED' || log.action === 'RESUBMITTED' 
                                ? (t('supplierStr', 'Поставщик')) 
                                : (t('adminStr', 'Администратор'))}
                            </span>
                          )}
                        </td>

                        {/* Замечания / Комментарий */}
                        <td className="py-3.5 px-4 text-left max-w-xs">
                          {log.reason ? (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug break-words">
                              {log.reason}
                            </p>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Действие: переход в профиль */}
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={() => navigate(`/suppliers/${log.supplierId}`)} 
                            title={t('viewProfileTooltip', 'Посмотреть профиль')}
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модальные окна */}
      {showAddModal && (
        <AddSupplierModal 
          countries={countries} 
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchSuppliers();
            setShowAddModal(false);
          }}
        />
      )}

      {supplierToEdit && (
        <EditSupplierModal 
          countries={countries} 
          supplier={supplierToEdit}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setSupplierToEdit(null)}
          onSuccess={() => {
            fetchSuppliers();
            setSupplierToEdit(null);
          }}
        />
      )}

      {supplierToReject && (
        <RejectSupplierModal
          isOpen={Boolean(supplierToReject)}
          supplierName={supplierToReject?.name}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setSupplierToReject(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
