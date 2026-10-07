import React from 'react';
import { User, Lock, Eye, EyeOff, Building2, Users } from 'lucide-react';

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onQuickLogin,
  onOpenForgotModal,
  onOpenDemoModal,
  onSwitchToRegister,
  t,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-in fade-in duration-300">
      <div className="space-y-4">
        {/* Логин или Email */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
            {t('loginOrEmailPlaceholder', 'Логин или Email')}
          </label>
          <div className="relative flex items-center">
            <User size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('emailPlaceholderDemo', 'corp@company.ru')}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Пароль */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="block text-[13px] font-bold text-slate-700">
              {t('password', 'Пароль')}
            </label>
            <button
              type="button"
              onClick={onOpenForgotModal}
              className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              {t('forgotPassword', 'Забыли пароль?')}
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center h-full cursor-pointer"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Кнопка входа */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-70 mt-6 text-[15px] cursor-pointer"
      >
        <span>{loading ? t('loggingIn', 'Вход...') : t('loginBtn', 'Войти в систему')}</span>
      </button>

      {/* Демо-доступ */}
      <div className="pt-4 mt-6">
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-bold text-slate-400">
            {t('demoAccessTitle', 'Демо-доступ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => onQuickLogin('admin', 'password123')}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95 shadow-2xs cursor-pointer"
          >
            <User size={16} className="text-slate-400" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickLogin('supplier@1.com', 'password123')}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95 shadow-2xs cursor-pointer"
          >
            <Building2 size={16} className="text-slate-400" />
            <span>Supplier</span>
          </button>
        </div>

        {/* Дополнительная кнопка всех демо-аккаунтов */}
        <button
          type="button"
          onClick={onOpenDemoModal}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 text-slate-600 hover:text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Users size={15} className="text-blue-500" />
          <span>{t('demoAccountsAllBtn', 'Все 7 демонстрационных аккаунтов')}</span>
        </button>
      </div>

      {/* Переход к регистрации */}
      <div className="text-center mt-6 text-sm font-medium text-slate-500">
        {t('dontHaveAccountPrompt', 'Нет аккаунта?')}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:text-blue-800 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-400 ml-1.5 cursor-pointer"
        >
          {t('signUpLink', 'Зарегистрируйтесь')}
        </button>
      </div>
    </form>
  );
}
