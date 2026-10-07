import React from 'react';
import { ShieldAlert, Phone, Mail, Clock, X, Check } from 'lucide-react';

export default function AuthForgotPasswordModal({ isOpen, onClose, t }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={t('closeBtn', 'Закрыть')}
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-5">
          <ShieldAlert size={26} />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-2.5">
          {t('forgotPasswordModalTitle', 'Восстановление доступа')}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {t(
            'forgotPasswordModalDesc',
            'В целях безопасности системы электронных торгов сброс учетных данных осуществляется через прямое обращение в службу технической поддержки или секретариат тендерной комиссии.'
          )}
        </p>

        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs sm:text-sm text-slate-700 mb-6">
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-blue-600 shrink-0" />
            <span className="font-semibold">+993 (12) 40-00-00</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-blue-600 shrink-0" />
            <span className="font-semibold">support@tender.gov.tm</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <Clock size={16} className="text-slate-400 shrink-0" />
            <span>{t('supportWorkingHours', 'Режим работы: Пн – Пт, 09:00 – 18:00')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 transition-all text-sm cursor-pointer"
        >
          {t('closeBtn', 'Понятно')}
        </button>
      </div>
    </div>
  );
}
