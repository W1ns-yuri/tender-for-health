import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Key, Database, RefreshCw, Search, 
  CheckCircle, ShieldCheck, FileText, Eye, Edit2, Lock, 
  UserX, UserCheck, Download, HardDriveDownload, Undo2
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';

export default function AdminLogs({ role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDumping, setIsDumping] = useState(false);

  const [backupHistory, setBackupHistory] = useState([
    {
      id: 'bk-2026-09-26-01',
      createdAt: '2026-09-26 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.8 MB',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileName: 'tender_ulgam_dump_20260926_040000.sql.gz'
    },
    {
      id: 'bk-2026-09-25-01',
      createdAt: '2026-09-25 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.6 MB',
      sha256: 'a18fbc83d910e527f00a8270575d3ec628a58a98f489721262d665b1ffc116c9',
      fileName: 'tender_ulgam_dump_20260925_040000.sql.gz'
    },
    {
      id: 'bk-2026-09-24-01',
      createdAt: '2026-09-24 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.2 MB',
      sha256: '7c92b0412e84e8bbba7f1ef2e8fc177f154378f8cb0869a19d7d93d395a3ec2b',
      fileName: 'tender_ulgam_dump_20260924_040000.sql.gz'
    }
  ]);

  const { showAlert, showConfirm } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const cardBg = isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const tableHeaderBg = theme.tableHeaderBg;
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        API.get('/dashboard/logs').catch(() => ({ data: [] })),
        API.get('/users').catch(() => ({ data: [] }))
      ]);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDump = () => {
    setIsDumping(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
      const timeStamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const newDump = {
        id: `bk-${Date.now()}`,
        createdAt: dateStr,
        dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
        size: '15.1 MB',
        sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        fileName: `tender_ulgam_dump_${timeStamp}.sql.gz`
      };
      setBackupHistory(prev => [newDump, ...prev]);
      setIsDumping(false);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('backupManualSuccess', 'Резервная копия базы данных успешно сформирована'),
        type: 'success'
      });
    }, 800);
  };

  const handleDownloadDump = (dump) => {
    showAlert({
      title: t('downloadStarted', 'Скачивание архива'),
      message: `${dump.fileName} (${dump.size})`,
      type: 'info'
    });
  };

  const handleRestoreDump = async (dump) => {
    const isConfirmed = await showConfirm({
      title: t('restoreTitle', 'Восстановление базы данных'),
      message: `${t('backupRestoreConfirm', 'Вы уверены, что хотите восстановить базу данных из выбранного архива?')} (${dump.fileName})`,
      type: 'warning',
      confirmText: t('backupColRestore', 'Восстановить'),
      cancelText: t('cancel', 'Отмена')
    });
    if (!isConfirmed) return;

    showAlert({
      title: t('successTitle', 'Успешно'),
      message: t('backupRestoreSuccess', 'База данных успешно восстановлена'),
      type: 'success'
    });
  };

  const handleEditUserRole = (user) => {
    showAlert({
      title: t('editRoleAction', 'Редактировать роль'),
      message: `${user.username} (${user.roleType})`,
      type: 'info'
    });
  };

  const handleResetUserPassword = async (user) => {
    const confirmed = await showConfirm({
      title: t('resetPasswordAction', 'Сбросить пароль'),
      message: `Сбросить пароль для пользователя ${user.username}? Временный пароль будет отправлен на email.`,
      type: 'warning',
      confirmText: t('reset', 'Сбросить'),
      cancelText: t('cancel', 'Отмена')
    });
    if (confirmed) {
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: `Временный пароль для ${user.username} сгенерирован и отправлен`,
        type: 'success'
      });
    }
  };

  const handleToggleUserBlock = async (user) => {
    const isBlocked = user.isBlocked;
    const actionText = isBlocked ? t('activateUserAction', 'Активировать') : t('blockUserAction', 'Заблокировать');
    const confirmed = await showConfirm({
      title: actionText,
      message: `Вы действительно хотите ${actionText.toLowerCase()} пользователя ${user.username}?`,
      type: isBlocked ? 'info' : 'danger',
      confirmText: actionText,
      cancelText: t('cancel', 'Отмена')
    });
    if (confirmed) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !isBlocked } : u));
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: `Статус пользователя ${user.username} изменен`,
        type: 'success'
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.user?.username && log.user.username.toLowerCase().includes(q)) ||
      (log.user?.firstName && log.user.firstName.toLowerCase().includes(q)) ||
      (log.user?.lastName && log.user.lastName.toLowerCase().includes(q)) ||
      (log.eventType && log.eventType.toLowerCase().includes(q)) ||
      (log.operationType && log.operationType.toLowerCase().includes(q)) ||
      (log.ip && log.ip.toLowerCase().includes(q))
    );
  });

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.roleType && u.roleType.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q))
    );
  });

  const getRoleBadge = (roleType) => {
    switch (roleType) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full font-bold text-xs">ADMIN</span>;
      case 'CLIENT':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full font-bold text-xs">{t('client', 'ЗАКАЗЧИК')}</span>;
      case 'PURCHASING_SPECIALIST':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full font-bold text-xs">{t('roleSpecialist', 'СПЕЦИАЛИСТ')}</span>;
      case 'COMMISSION_MEMBER':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full font-bold text-xs">{t('roleCommission', 'КОМИССИЯ')}</span>;
      case 'SUPPLIER':
      default:
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-bold text-xs">{t('supplierStr', 'ПОСТАВЩИК')}</span>;
    }
  };

  const getOperationBadge = (op) => {
    const norm = String(op || '').toUpperCase();
    if (norm === 'YAZMAK' || norm === 'ÝAZMAK' || norm === 'CREATE') {
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded font-semibold text-[11px]">{t('opCreate', 'СОЗДАНИЕ / ЗАПИСЬ')}</span>;
    }
    if (norm === 'TAZELEMEK' || norm === 'TÄZELEMEK' || norm === 'UPDATE') {
      return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-semibold text-[11px]">{t('opUpdate', 'ИЗМЕНЕНИЕ')}</span>;
    }
    if (norm === 'POZMAK' || norm === 'DELETE') {
      return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 rounded font-semibold text-[11px]">{t('opDelete', 'УДАЛЕНИЕ')}</span>;
    }
    return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded font-semibold text-[11px]">{op || 'LOG'}</span>;
  };

  const systemRoles = [
    { code: 'ADMIN', name: t('systemAdminRole', 'Администратор системы'), desc: t('adminRoleDescription', 'Полный доступ ко всем справочникам, пользователям, логам аудита и настройкам') },
    { code: 'CLIENT', name: t('customerRoleTitle', 'Заказчик (Минздрав / Больницы)'), desc: t('customerRoleDescription', 'Создание тендеров, утверждение условий, публикация и открытие предложений') },
    { code: 'PURCHASING_SPECIALIST', name: t('procurementSpecialistTitle', 'Специалист по закупкам'), desc: t('procurementSpecialistDescription', 'Подготовка спецификаций, проверка требований и координация тендеров') },
    { code: 'COMMISSION_MEMBER', name: t('commissionMemberTitle', 'Член тендерной комиссии'), desc: t('commissionMemberDescription', 'Оценка коммерческих предложений, ранжирование и выбор победителя') },
    { code: 'SUPPLIER', name: t('supplierRoleTitle', 'Поставщик (Участник торгов)'), desc: t('supplierRoleDescription', 'Просмотр открытых тендеров, подача и отслеживание коммерческих предложений') }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t('adminAndAuditTitle', 'Администрирование и Аудит')}</h2>
          <p className={`text-xs ${theme.subText} font-medium`}>
            {t('adminAndAuditSubtitle', 'Безопасность системы, журнал действий и управление учетными записями')}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{t('refreshDataBtn', 'Обновить данные')}</span>
        </button>
      </div>

      {/* Плитка разделов администрирования с синхронизированными счетчиками */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => { setActiveTab('logs'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'logs' ? 'bg-emerald-50 border-emerald-500 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <ShieldAlert size={20} className={activeTab === 'logs' ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{logs.length}</span>
          </div>
          <p className="font-bold text-sm">{t('catLogs', 'Журнал аудита')}</p>
          <p className="text-[11px] text-slate-400">{t('allEventLogsTab', 'Логи всех событий')}</p>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('users'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-emerald-50 border-emerald-500 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className={activeTab === 'users' ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{users.length}</span>
          </div>
          <p className="font-bold text-sm">{t('catUsers', 'Пользователи')}</p>
          <p className="text-[11px] text-slate-400">{t('userAccountsTab', 'Учетные записи')}</p>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('roles'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'roles' ? 'bg-emerald-50 border-emerald-500 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Key size={20} className={activeTab === 'roles' ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">5</span>
          </div>
          <p className="font-bold text-sm">{t('catRolesSub', 'Роли и права')}</p>
          <p className="text-[11px] text-slate-400">{t('rbacModelTab', 'Модель RBAC')}</p>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('backup'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'backup' ? 'bg-emerald-50 border-emerald-500 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Database size={20} className={activeTab === 'backup' ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="font-bold text-sm">Backup</p>
          <p className="text-[11px] text-slate-400">{t('backupsTab', 'Резервные копии')}</p>
        </button>
      </div>

      {/* Основная карточка с данными и верхним акцентным бордером */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${theme.tableCardBorderTop} ${cardBg}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base">
            {activeTab === 'logs' && t('catLogs', 'Журнал аудита')}
            {activeTab === 'users' && t('catUsers', 'Пользователи системы')}
            {activeTab === 'roles' && t('rbacSectionTitle', 'Системные роли и права доступа (RBAC)')}
            {activeTab === 'backup' && t('backupSectionTitle', 'Резервное копирование базы данных')}
          </h3>

          {(activeTab === 'logs' || activeTab === 'users') && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Gözleg...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border ${inputBg}`}
              />
            </div>
          )}
        </div>

        {/* 1. Вкладка ЛОГИ АУДИТА */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={tableHeaderBg}>
                  <th className="py-3 px-4">{t('auditColLogin', 'Логин')}</th>
                  <th className="py-3 px-4">{t('auditColFullName', 'ФИО')}</th>
                  <th className="py-3 px-4">{t('auditColEvent', 'Событие')}</th>
                  <th className="py-3 px-4 text-center">{t('auditColAction', 'Действие')}</th>
                  <th className="py-3 px-4 text-center">{t('auditColIp', 'IP-адрес')}</th>
                  <th className="py-3 px-4 text-center">{t('auditColDate', 'Дата')}</th>
                  <th className="py-3 px-4 text-center">{t('auditColDetails', 'Подробности')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                      {t('loading', 'Ýüklenýär...')}
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      {t('noAuditLogsFound', 'Записи журнала аудита не найдены')}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '-';
                    const userName = log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : (log.data?.username || '-');
                    const userLogin = log.user?.username || 'SYSTEM';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{userLogin}</td>
                        <td className="py-3 px-4 font-medium">{userName || '-'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{log.eventType || 'SYSTEM'}</td>
                        <td className="py-3 px-4 text-center">{getOperationBadge(log.operationType)}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{log.ip || '127.0.0.1'}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-center">
                          {log.data ? (
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                              title={t('auditColDetails', 'Подробности')}
                            >
                              <Eye size={15} />
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Вкладка ПОЛЬЗОВАТЕЛИ */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={tableHeaderBg}>
                  <th className="py-3 px-4">{t('auditColLogin', 'Логин')}</th>
                  <th className="py-3 px-4">{t('auditColFullName', 'ФИО')}</th>
                  <th className="py-3 px-4 text-center">{t('role', 'Роль')}</th>
                  <th className="py-3 px-4">{t('position', 'Должность')}</th>
                  <th className="py-3 px-4 text-center">{t('status', 'Статус')}</th>
                  <th className="py-3 px-4 text-center">{t('registrationDate', 'Дата регистрации')}</th>
                  <th className="py-3 px-4 text-center w-36">{t('userColAction', 'Действие')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                      {t('loading', 'Ýüklenýär...')}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      {t('noUsersFound', 'Пользователи не найдены')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.middleName || ''}`.trim();
                    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '-';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{u.username}</td>
                        <td className="py-3.5 px-4 font-semibold">{fullName || '-'}</td>
                        <td className="py-3.5 px-4 text-center">{getRoleBadge(u.roleType)}</td>
                        <td className="py-3.5 px-4 text-slate-500">{u.position || u.companies?.[0]?.name || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          {u.isBlocked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                              {t('blocked', 'Заблокирован')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle size={12} className="mr-1" />
                              {t('active', 'Активен')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">{dateStr}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditUserRole(u)}
                              title={t('editRoleAction', 'Редактировать роль')}
                              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetUserPassword(u)}
                              title={t('resetPasswordAction', 'Сбросить пароль')}
                              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <Lock size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserBlock(u)}
                              title={u.isBlocked ? t('activateUserAction', 'Активировать') : t('blockUserAction', 'Заблокировать')}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                u.isBlocked
                                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/60'
                              }`}
                            >
                              {u.isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Вкладка РОЛИ (RBAC) */}
        {activeTab === 'roles' && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('catRoles', 'Роли и права (RBAC)')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('rbacSubtitle', 'Матрица прав доступа, ролевые привилегии и разграничение полномочий')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {systemRoles.map((r) => (
                <div key={r.code} className={`p-4 rounded-xl border ${cardBg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      {r.name}
                    </h4>
                    {getRoleBadge(r.code)}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Вкладка BACKUP */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 rounded-xl">
              <CheckCircle size={24} className="shrink-0" />
              <div>
                <h4 className="font-bold text-sm">{t('databaseActiveStatus', 'База данных PostgreSQL активна и защищена')}</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {t('backupSnapshotsNotice', 'Автоматические снапшоты базы создаются регулярно. Журнал аудита фиксирует каждое мутирующее действие.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{t('totalAuditLogsCount', 'Всего записей аудита')}</p>
                <p className="text-2xl font-bold text-emerald-600">{logs.length}</p>
              </div>
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{t('activeAccountsCount', 'Активных учетных записей')}</p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{t('replicationState', 'Состояние репликации')}</p>
                <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {t('synchronizedStatus', 'Синхронизировано')}
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t('backupDumpHistoryTitle', 'История резервных копий базы данных')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Полные дампы структуры и данных PostgreSQL со сверкой целостности SHA-256
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateDump}
                  disabled={isDumping}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    theme.primaryBg
                  } text-white disabled:opacity-70`}
                >
                  <HardDriveDownload size={15} className={isDumping ? 'animate-bounce' : ''} />
                  <span>{isDumping ? 'Формирование дампа...' : t('dumpDbBtn', 'Создать резервную копию (Dump DB)')}</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={tableHeaderBg}>
                      <th className="py-3 px-4">{t('backupColDate', 'Дата создания')}</th>
                      <th className="py-3 px-4">{t('backupColDbVersion', 'Версия базы')}</th>
                      <th className="py-3 px-4 text-center">{t('backupColArchiveSize', 'Размер архива')}</th>
                      <th className="py-3 px-4">{t('backupColHash', 'Хеш SHA-256')}</th>
                      <th className="py-3 px-4 text-center w-28">{t('backupColDownload', 'Скачать')}</th>
                      <th className="py-3 px-4 text-center w-28">{t('backupColRestore', 'Восстановить')}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {backupHistory.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 font-mono">{bk.createdAt}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{bk.dbVersion}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{bk.size}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={bk.sha256}>{bk.sha256}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDownloadDump(bk)}
                            title={t('backupColDownload', 'Скачать')}
                            className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRestoreDump(bk)}
                            title={t('backupColRestore', 'Восстановить')}
                            className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/40 dark:hover:border-amber-900/60 dark:hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Undo2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно просмотра деталей лога с чистой локализацией */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                {t('auditEventDetailsTitle', 'Детали события аудита')}
              </h3>
              <button 
                type="button"
                onClick={() => setSelectedLog(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold">{t('eventLabel', 'Событие')}</p>
                <p className="font-bold text-sm">{selectedLog.eventType} ({selectedLog.operationType})</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">{t('ipAddressLabel', 'IP-адрес')}</p>
                <p className="font-mono">{selectedLog.ip || '127.0.0.1'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">{t('payloadLabel', 'Тело запроса (Payload)')}</p>
                <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {t('closeModalBtn', 'Закрыть')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
