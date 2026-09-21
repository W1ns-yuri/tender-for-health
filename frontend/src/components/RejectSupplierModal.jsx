import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function RejectSupplierModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  supplierName = '', 
  lang = 'RU', 
  isDarkMode = false 
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const quickReasons = [
    t('quickReasonDocs', 'Отсутствуют обязательные сканы документов'),
    t('quickReasonStsk', 'Некорректный STŞK / ИНН'),
    t('quickReasonName', 'Несоответствие наименования и свидетельства'),
    t('quickReasonBank', 'Неверные банковские реквизиты'),
    t('quickReasonPassport', 'Недействительные паспортные данные'),
  ];

  const handleQuickReasonClick = (qr) => {
    setError('');
    if (!reason.trim()) {
      setReason(qr);
    } else if (!reason.includes(qr)) {
      setReason(prev => `${prev.trim()}; ${qr}`);
    }
  };

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t('rejectReasonRequired', 'Пожалуйста, укажите причину отклонения'));
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Ошибка отклонения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClass = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const chipBg = isDarkMode 
    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className={`rounded-2xl shadow-2xl border w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-200 ${bgClass}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Шапка модального окна */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {t('rejectModalTitle', 'Отклонение верификации поставщика')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {supplierName ? `«${supplierName}»` : t('rejectModalSubtitle', 'Укажите причину отклонения заявки компании')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Быстрые шаблоны причин */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            {t('quickRejectReasons', 'Быстрый выбор типовой причины:')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickReasons.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickReasonClick(qr)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 text-left cursor-pointer ${chipBg}`}
              >
                + {qr}
              </button>
            ))}
          </div>
        </div>

        {/* Поле ввода причины */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('rejectReasonLabel', 'Причина отклонения')} <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('rejectReasonPlaceholder', 'Опишите замечания к реквизитам или документам...')}
            className={`w-full p-3 text-xs font-medium rounded-xl border transition-colors outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 ${inputBg}`}
          />
          {error && (
            <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            {t('supplierRejectNotice', 'Поставщик увидит это сообщение в личном кабинете и сможет исправить указанные замечания.')}
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {t('cancelEditBtn', 'Отмена')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !reason.trim()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('rejectingAction', 'Отклонение...')}</span>
              </>
            ) : (
              <span>{t('rejectSupplier', 'Отклонить заявку')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
