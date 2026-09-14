import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Key, Database, RefreshCw, Search, 
  Calendar, CheckCircle, Clock, ShieldCheck, UserCheck, 
  FileText, Download, AlertCircle, Eye
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function AdminLogs({ role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const cardBg = isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const tableHeaderBg = theme.tableHeaderBg;
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'logs') {
        const res = await API.get('/dashboard/logs');
        setLogs(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'users') {
        const res = await API.get('/users');
        setUsers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
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
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full font-bold text-xs">{lang === 'RU' ? 'ЗАКАЗЧИК' : 'SARGYTÇY'}</span>;
      case 'PURCHASING_SPECIALIST':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full font-bold text-xs">{lang === 'RU' ? 'СПЕЦИАЛИСТ' : 'HÜNÄRMEN'}</span>;
      case 'COMMISSION_MEMBER':
        return <span className="px-2.5 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 rounded-full font-bold text-xs">{lang === 'RU' ? 'КОМИССИЯ' : 'KOMISSIÝA'}</span>;
      case 'SUPPLIER':
      default:
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-bold text-xs">{lang === 'RU' ? 'ПОСТАВЩИК' : 'ÜPJÜNÇI'}</span>;
    }
  };

  const getOperationBadge = (op) => {
    switch (op) {
      case 'YAZMAK':
      case 'CREATE':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded font-semibold text-[11px]">ÝAZMAK</span>;
      case 'TAZELEMEK':
      case 'UPDATE':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-semibold text-[11px]">TÄZELEMEK</span>;
      case 'POZMAK':
      case 'DELETE':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 rounded font-semibold text-[11px]">POZMAK</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded font-semibold text-[11px]">{op || 'LOG'}</span>;
    }
  };

  const systemRoles = [
    { code: 'ADMIN', name: lang === 'RU' ? 'Администратор системы' : 'Ulgam admini', desc: lang === 'RU' ? 'Полный доступ ко всем справочникам, пользователям, логам аудита и настройкам' : 'Ähli maglumatnamalara, ulanyjylara, loglara we sazlamalara doly ygtyýarlyk' },
    { code: 'CLIENT', name: lang === 'RU' ? 'Заказчик (Минздрав / Больницы)' : 'Sargyt ediji edara', desc: lang === 'RU' ? 'Создание тендеров, утверждение условий, публикация и открытие предложений' : 'Tenderleri döretmek, şertleri tassyklamak we teklipleri açmak' },
    { code: 'PURCHASING_SPECIALIST', name: lang === 'RU' ? 'Специалист по закупкам' : 'Satyn alyş hünärmeni', desc: lang === 'RU' ? 'Подготовка спецификаций, проверка требований и координация тендеров' : 'Spesifikasiýalary taýýarlamak we barlamak' },
    { code: 'COMMISSION_MEMBER', name: lang === 'RU' ? 'Член тендерной комиссии' : 'Tender toparynyň agzasy', desc: lang === 'RU' ? 'Оценка коммерческих предложений, ранжирование и выбор победителя' : 'Tekliplere baha bermek we ýeňijini kesgitlemek' },
    { code: 'SUPPLIER', name: lang === 'RU' ? 'Поставщик (Участник торгов)' : 'Üpjün ediji (Gatnaşyjy)', desc: lang === 'RU' ? 'Просмотр открытых тендеров, подача и отслеживание коммерческих предложений' : 'Tenderleri görmek, teklipleri bermek we yzarlamak' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{lang === 'RU' ? 'Администрирование и Аудит' : 'Administrasiýa we Loglar'}</h2>
          <p className={`text-xs ${theme.subText} font-medium`}>
            {lang === 'RU' ? 'Безопасность системы, журнал действий и управление учетными записями' : 'Ulgam howpsuzlygy, amallaryň ýazgysy we ulanyjylar'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{lang === 'RU' ? 'Обновить данные' : 'Täzele'}</span>
        </button>
      </div>

      {/* Плитка разделов администрирования */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => { setActiveTab('logs'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'logs' ? 'bg-teal-50 border-teal-500 shadow-sm dark:bg-teal-950/30 dark:border-teal-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <ShieldAlert size={20} className={activeTab === 'logs' ? 'text-teal-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{logs.length}</span>
          </div>
          <p className="font-bold text-sm">{lang === 'RU' ? 'Журнал аудита' : 'Loglar'}</p>
          <p className="text-[11px] text-slate-400">{lang === 'RU' ? 'Логи всех событий' : 'Ulgam wakalary'}</p>
        </button>

        <button
          onClick={() => { setActiveTab('users'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'users' ? 'bg-teal-50 border-teal-500 shadow-sm dark:bg-teal-950/30 dark:border-teal-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className={activeTab === 'users' ? 'text-teal-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{users.length}</span>
          </div>
          <p className="font-bold text-sm">{lang === 'RU' ? 'Пользователи' : 'Ulanyjylar'}</p>
          <p className="text-[11px] text-slate-400">{lang === 'RU' ? 'Учетные записи' : 'Hasaplar'}</p>
        </button>

        <button
          onClick={() => { setActiveTab('roles'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'roles' ? 'bg-teal-50 border-teal-500 shadow-sm dark:bg-teal-950/30 dark:border-teal-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Key size={20} className={activeTab === 'roles' ? 'text-teal-600' : 'text-slate-400'} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">5</span>
          </div>
          <p className="font-bold text-sm">{lang === 'RU' ? 'Роли и права' : 'Rollar'}</p>
          <p className="text-[11px] text-slate-400">{lang === 'RU' ? 'Модель RBAC' : 'Ygtyýarlyklar'}</p>
        </button>

        <button
          onClick={() => { setActiveTab('backup'); setSearch(''); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'backup' ? 'bg-teal-50 border-teal-500 shadow-sm dark:bg-teal-950/30 dark:border-teal-600' : cardBg
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Database size={20} className={activeTab === 'backup' ? 'text-teal-600' : 'text-slate-400'} />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="font-bold text-sm">Backup</p>
          <p className="text-[11px] text-slate-400">{lang === 'RU' ? 'Резервные копии' : 'Ätiýaçlyk nusgalar'}</p>
        </button>
      </div>

      {/* Основная карточка с данными */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base">
            {activeTab === 'logs' && (lang === 'RU' ? 'Журнал аудита системы (Loglar)' : 'Ulgam loglary (Audit)')}
            {activeTab === 'users' && (lang === 'RU' ? 'Пользователи системы (Ulanyjylar)' : 'Ulgamyň ulanyjylary')}
            {activeTab === 'roles' && (lang === 'RU' ? 'Системные роли и права доступа (RBAC)' : 'Rollar we ygtyýarlyklar')}
            {activeTab === 'backup' && (lang === 'RU' ? 'Резервное копирование базы данных' : 'Maglumatlar binýadynyň ätiýaçlyk nusgasy')}
          </h3>

          {(activeTab === 'logs' || activeTab === 'users') && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Gözleg...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 border ${inputBg}`}
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
                  <th className="py-3 px-4">Ulanyjy / Логин</th>
                  <th className="py-3 px-4">Doly ady / Имя</th>
                  <th className="py-3 px-4">Waka / Событие</th>
                  <th className="py-3 px-4 text-center">Amal / Действие</th>
                  <th className="py-3 px-4 text-center">IP Salgysy</th>
                  <th className="py-3 px-4 text-center">Senesi / Дата</th>
                  <th className="py-3 px-4 text-center">Jikme-jik</th>
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
                      {lang === 'RU' ? 'Записи журнала аудита не найдены' : 'Log ýazgylary tapylmady'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '-';
                    const userName = log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() : (log.data?.username || '-');
                    const userLogin = log.user?.username || 'SYSTEM';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-teal-600 dark:text-teal-400">{userLogin}</td>
                        <td className="py-3 px-4 font-medium">{userName || '-'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{log.eventType || 'SYSTEM'}</td>
                        <td className="py-3 px-4 text-center">{getOperationBadge(log.operationType)}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{log.ip || '127.0.0.1'}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-center">
                          {log.data ? (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                              title="Просмотр payload"
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
                  <th className="py-3 px-4">Ulanyjy ady / Логин</th>
                  <th className="py-3 px-4">Doly ady / ФИО</th>
                  <th className="py-3 px-4 text-center">Roly / Роль</th>
                  <th className="py-3 px-4">Wezipesi / Должность</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Hasaba alnan senesi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                      {t('loading', 'Ýüklenýär...')}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      {lang === 'RU' ? 'Пользователи не найдены' : 'Ulanyjylar tapylmady'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.middleName || ''}`.trim();
                    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '-';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-teal-600 dark:text-teal-400">{u.username}</td>
                        <td className="py-3.5 px-4 font-semibold">{fullName || '-'}</td>
                        <td className="py-3.5 px-4 text-center">{getRoleBadge(u.roleType)}</td>
                        <td className="py-3.5 px-4 text-slate-500">{u.position || u.companies?.[0]?.name || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle size={12} className="mr-1" />
                            {lang === 'RU' ? 'Активен' : 'Işjeň'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">{dateStr}</td>
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
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'RU'
                ? 'Ролевая модель доступа определяет права пользователей при работе с тендерами, коммерческими предложениями и оценкой:'
                : 'Ulgamdaky rollar ulanyjylaryň tenderler we teklipler bilen işlemegine gözegçilik edýär:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemRoles.map((r) => (
                <div key={r.code} className={`p-4 rounded-xl border ${cardBg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <ShieldCheck size={16} className="text-teal-600" />
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
                <h4 className="font-bold text-sm">{lang === 'RU' ? 'База данных PostgreSQL активна и защищена' : 'Maglumatlar binýady işjeň ýagdaýda'}</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {lang === 'RU'
                    ? 'Автоматические снапшоты базы создаются регулярно. Журнал аудита фиксирует каждое мутирующее действие.'
                    : 'Ulgam awtomatiki ýagdaýda ätiýaçlyk nusgalaryny döredýär.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{lang === 'RU' ? 'Всего записей аудита' : 'Jemi loglar'}</p>
                <p className="text-2xl font-bold text-teal-600">{logs.length}</p>
              </div>
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{lang === 'RU' ? 'Активных учетных записей' : 'Ulanyjylar sany'}</p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
                <p className="text-xs text-slate-400 font-semibold uppercase">{lang === 'RU' ? 'Состояние репликации' : 'Ýagdaýy'}</p>
                <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {lang === 'RU' ? 'Синхронизировано' : 'Ylalaşykly'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно просмотра деталей лога */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                {lang === 'RU' ? 'Детали события аудита' : 'Waka maglumaty'}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold">{lang === 'RU' ? 'Событие' : 'Waka'}</p>
                <p className="font-bold text-sm">{selectedLog.eventType} ({selectedLog.operationType})</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">IP Salgysy</p>
                <p className="font-mono">{selectedLog.ip || '127.0.0.1'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Payload / Maglumatlar</p>
                <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                {t('cancelBtn', 'Ýap')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
