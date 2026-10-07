import React from 'react';
import { 
  ShieldAlert, 
  Users, 
  Key, 
  Database, 
  RefreshCw, 
  Search 
} from 'lucide-react';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import {
  useAdminLogsState,
  SystemLogsTab,
  StaffManagementTab,
  RbacRolesTab,
  DatabaseBackupsTab,
  LogDetailsModal,
  UserEditModal
} from '../components/admin-logs';

/**
 * AdminLogs Page
 * Central administrative hub for audit logging, staff management (RBAC),
 * security roles matrix, and PostgreSQL database maintenance.
 */
export default function AdminLogs({ role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const { showAlert, showConfirm } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const cardBg = isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const tableHeaderBg = theme.tableHeaderBg;
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  const {
    activeTab,
    setActiveTab,
    logs,
    users,
    loading,
    search,
    setSearch,
    selectedLog,
    setSelectedLog,
    editingUser,
    setEditingUser,
    isDumping,
    backupHistory,
    filteredLogs,
    filteredUsers,
    fetchAllData,
    handleCreateDump,
    handleDownloadDump,
    handleRestoreDump,
    handleToggleUserBlock,
    handleResetUserPassword,
    handleSaveUser
  } = useAdminLogsState({ t, showAlert, showConfirm });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('adminAndAuditTitle', 'Администрирование и Аудит')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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

      {/* 4 Navigation Section Cards */}
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

      {/* Main Content Card */}
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

        {/* 1. Audit Logs Tab */}
        {activeTab === 'logs' && (
          <SystemLogsTab
            logs={filteredLogs}
            loading={loading}
            onSelectLog={(log) => setSelectedLog(log)}
            isDarkMode={isDarkMode}
            tableHeaderBg={tableHeaderBg}
            t={t}
          />
        )}

        {/* 2. Staff Management Tab */}
        {activeTab === 'users' && (
          <StaffManagementTab
            users={filteredUsers}
            loading={loading}
            onEditUser={(u) => setEditingUser(u)}
            onResetPassword={handleResetUserPassword}
            onToggleBlock={handleToggleUserBlock}
            onCreateUser={() => setEditingUser({})}
            isDarkMode={isDarkMode}
            tableHeaderBg={tableHeaderBg}
            t={t}
          />
        )}

        {/* 3. Roles (RBAC) Tab */}
        {activeTab === 'roles' && (
          <RbacRolesTab cardBg={cardBg} t={t} />
        )}

        {/* 4. Backup & Recovery Tab */}
        {activeTab === 'backup' && (
          <DatabaseBackupsTab
            logsCount={logs.length}
            usersCount={users.length}
            backupHistory={backupHistory}
            isDumping={isDumping}
            onCreateDump={handleCreateDump}
            onDownloadDump={handleDownloadDump}
            onRestoreDump={handleRestoreDump}
            cardBg={cardBg}
            tableHeaderBg={tableHeaderBg}
            theme={theme}
            isDarkMode={isDarkMode}
            t={t}
          />
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          cardBg={cardBg}
          t={t}
        />
      )}

      {/* User Edit / Create Modal */}
      {editingUser !== null && (
        <UserEditModal
          user={editingUser}
          isOpen={editingUser !== null}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
          cardBg={cardBg}
          theme={theme}
          t={t}
        />
      )}
    </div>
  );
}
