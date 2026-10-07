import React from 'react';
import { KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { Button, Badge } from '../ui';
import CustomSelect from '../CustomSelect';

/**
 * Вкладка 3: Безопасность учетной записи, смена пароля и таймаут автоблокировки сессии
 */
export default function SettingsSecurityTab({
  role = 'ADMIN',
  isSupplier = false,
  user = null,
  userInitials = 'U',
  theme,
  isDarkMode = false,
  currentPassword = '',
  setCurrentPassword,
  newPassword = '',
  setNewPassword,
  confirmPassword = '',
  setConfirmPassword,
  showCurrent = false,
  setShowCurrent,
  showNew = false,
  setShowNew,
  showConfirm = false,
  setShowConfirm,
  isChangingPassword = false,
  handleChangePassword,
  sessionTimeout = '30',
  handleSessionTimeoutChange,
  t
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Профиль пользователя */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-xs shrink-0 ${
              isSupplier 
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}>
              {userInitials}
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 dark:text-white">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (t ? t('authenticatedUser', 'Авторизованный пользователь') : 'Авторизованный пользователь')}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                @{user?.username || 'user'} {user?.email ? `• ${user.email}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isSupplier ? 'blue' : 'emerald'} size="sm">
              {user?.roleType || role}
            </Badge>
            <Badge variant="outline" size="sm">
              {t('accountActive', 'Активен')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Форма смены пароля */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <KeyRound size={17} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('changePasswordTitle', 'Смена пароля учетной записи')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('changePasswordDesc', 'Регулярно обновляйте пароль для надежной защиты закупочных данных')}
          </p>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="p-5 space-y-4">
            {/* Текущий пароль */}
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('currentPassword', 'Текущий пароль')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Новый пароль и подтверждение */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('newPassword', 'Новый пароль')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('passwordMinLengthHint', 'Минимум 6 символов')}
                    className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('confirmPassword', 'Подтверждение пароля')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('repeatNewPassword', 'Повторите новый пароль')}
                    className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs outline-none border ${theme?.inputBg || ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {newPassword && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">{t('passwordStrength', 'Сложность пароля')}:</span>
                <span className={`font-bold ${newPassword.length >= 8 ? 'text-emerald-600' : newPassword.length >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {newPassword.length >= 8 ? t('strong', 'Надежный') : newPassword.length >= 6 ? t('medium', 'Средний') : t('weak', 'Слабый')}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              variant={isSupplier ? 'primary' : 'success'}
              size="sm"
              isLoading={isChangingPassword}
            >
              <Lock size={14} className="mr-1.5" />
              <span>{t('updatePasswordBtn', 'Обновить пароль')}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Таймаут неактивности / Автовыход */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-md">
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {t('sessionAutoLockTitle', 'Таймаут неактивности (Автовыход)')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('sessionAutoLockDesc', 'Автоматическое завершение сеанса при отсутствии действий для защиты рабочего места')}
          </div>
        </div>

        <div className="w-full md:w-64 shrink-0">
          <CustomSelect
            role={role}
            size="sm"
            clearable={false}
            value={sessionTimeout}
            onChange={handleSessionTimeoutChange}
            options={[
              { id: '15', name: `15 ${t('minutes', 'минут')}` },
              { id: '30', name: `30 ${t('minutes', 'минут (Рекомендуется)')}` },
              { id: '60', name: `1 ${t('hour', 'час')}` },
              { id: 'never', name: t('neverTimeout', 'Не блокировать сеанс') },
            ]}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
