import React from 'react';
import { X, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { DEMO_ACCOUNTS } from './authConstants';

export default function AuthDemoModal({
  isOpen,
  onClose,
  onQuickLogin,
  loading,
  t,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={t('closeBtn', 'Закрыть')}
        >
          <X size={20} />
        </button>

        {/* Заголовок модалки */}
        <div className="mb-5 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <UserCheck size={14} />
            <span>{t('demoAccountsModalTag', 'Тестовая среда')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {t('demoAccountsModalTitle', 'Демонстрационные учетные записи')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              'demoAccountsModalSubtitle',
              'Выберите одну из предварительно настроенных ролей для мгновенного входа в систему'
            )}
          </p>
        </div>

        {/* Скроллируемый список аккаунтов */}
        <div className="overflow-y-auto space-y-3 pr-1 -mr-1 flex-1 py-1">
          {DEMO_ACCOUNTS.map((acc) => (
            <div
              key={acc.username}
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${acc.badgeColor}`}
                  >
                    {acc.badge}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{acc.name}</span>
                  <span className="text-slate-400 text-xs font-mono">({acc.username})</span>
                </div>
                <div className="text-xs text-slate-500 leading-normal">
                  <span className="font-semibold text-slate-600">{acc.category}</span> — {acc.desc}
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  onClose();
                  onQuickLogin(acc.username, acc.password);
                }}
                className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group-hover:bg-blue-600 group-hover:text-white"
              >
                <span>{t('loginBtn', 'Войти')}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Подвал */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>Все учетные записи активны и заполнены тестовыми данными</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            {t('closeBtn', 'Закрыть')}
          </button>
        </div>
      </div>
    </div>
  );
}
