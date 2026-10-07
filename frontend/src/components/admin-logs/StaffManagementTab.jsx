import React from 'react';
import { CheckCircle, Edit2, Lock, UserX, UserCheck, UserPlus } from 'lucide-react';
import { TableSkeletonRows } from '../ui';

/**
 * StaffManagementTab Component
 * Multi-user administration panel for procurement officers, committee members,
 * clients and suppliers with real role updates, blocking, and password resets.
 */
export default function StaffManagementTab({
  users,
  loading,
  onEditUser,
  onResetPassword,
  onToggleBlock,
  onCreateUser,
  isDarkMode,
  tableHeaderBg,
  t
}) {
  const getRoleBadge = (roleType) => {
    switch (roleType) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full font-bold text-xs">
            ADMIN
          </span>
        );
      case 'PURCHASING_SPECIALIST':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full font-bold text-xs">
            {t('purchasingSpecialistBadge', 'СПЕЦИАЛИСТ')}
          </span>
        );
      case 'COMMISSION_MEMBER':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full font-bold text-xs">
            {t('commissionMemberBadge', 'КОМИССИЯ')}
          </span>
        );
      case 'CLIENT':
        return (
          <span className="px-2.5 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 rounded-full font-bold text-xs">
            {t('clientBadge', 'ЗАКАЗЧИК')}
          </span>
        );
      case 'SUPPLIER':
      default:
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-bold text-xs">
            {t('supplierStr', 'ПОСТАВЩИК')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar: Add Employee */}
      <div className="flex justify-end px-4 pt-3">
        <button
          type="button"
          onClick={onCreateUser}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus size={15} />
          <span>{t('addStaffBtn', 'Добавить сотрудника')}</span>
        </button>
      </div>

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
              <TableSkeletonRows rows={8} cols={7} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  {t('noUsersFound', 'Пользователи не найдены')}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.middleName || ''}`.trim();
                const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '-';
                const isBlocked = u.isActive === false;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {u.username}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {fullName || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getRoleBadge(u.roleType)}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.position || u.companies?.[0]?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isBlocked ? (
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
                          onClick={() => onEditUser(u)}
                          title={t('editRoleAction', 'Редактировать роль')}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(u)}
                          title={t('resetPasswordAction', 'Сбросить пароль')}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Lock size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBlock(u)}
                          title={isBlocked ? t('activateUserAction', 'Активировать') : t('blockUserAction', 'Заблокировать')}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            isBlocked
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/60'
                          }`}
                        >
                          {isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
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
    </div>
  );
}
