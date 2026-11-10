import React from 'react';
import { ShieldAlert, Phone, Mail, Clock, X } from 'lucide-react';

// Контакты поддержки задаются при деплое (frontend/.env). Раньше тут были выдуманные
// телефон и адрес на домене gov.tm — пользователь звонил бы в никуда.
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || '';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

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
          {SUPPORT_PHONE && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-emerald-600 shrink-0" />
              <a href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, '')}`} className="font-semibold">{SUPPORT_PHONE}</a>
            </div>
          )}
          {SUPPORT_EMAIL && (
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-emerald-600 shrink-0" />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold">{SUPPORT_EMAIL}</a>
            </div>
          )}
          {!SUPPORT_PHONE && !SUPPORT_EMAIL && (
            <div className="text-slate-600">{t('contactAdminHint', 'Обратитесь к администратору платформы.')}</div>
          )}
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <Clock size={16} className="text-slate-400 shrink-0" />
            <span>{t('supportWorkingHours', 'Режим работы: Пн – Пт, 09:00 – 18:00')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm cursor-pointer"
        >
          {t('closeBtn', 'Понятно')}
        </button>
      </div>
    </div>
  );
}
