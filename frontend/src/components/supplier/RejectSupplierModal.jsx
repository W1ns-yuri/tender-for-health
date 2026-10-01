import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t('rejectReasonRequired', 'Укажите причину отклонения / блокировки заявки'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('errorOccurred', 'Произошла ошибка'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all transform animate-in zoom-in-95 duration-200 ${
          isDarkMode 
            ? 'bg-[#111827] border-rose-900/40 text-slate-100 shadow-rose-950/20' 
            : 'bg-white border-rose-200 text-slate-800 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-rose-900/30 bg-rose-950/20' : 'border-rose-100 bg-rose-50/50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('rejectSupplierTitle', 'Отклонение заявки поставщика')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-64">
                {supplierName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
            isDarkMode 
              ? 'bg-rose-950/30 border-rose-900/50 text-rose-300' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="leading-relaxed">
              {t(
                'rejectSupplierWarning', 
                'Поставщик получит официальное системное уведомление с указанной причиной отклонения и сможет исправить данные.'
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('rejectionReasonLabel', 'Официальная причина отклонения / замечания')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={t('rejectReasonPlaceholder', 'Например: Истек срок действия лицензии на медицинскую деятельность или не прикреплен скан устава...')}
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden transition-all resize-none ${
                isDarkMode 
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-rose-500 placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-rose-500 placeholder-slate-400'
              }`}
            />
            {error && (
              <p className="mt-1 text-xs text-rose-500 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">
              {t('quickTemplates', 'Быстрые шаблоны:')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Недействительная лицензия',
                'Неполный пакет документов',
                'Ошибки в реквизитах компании',
                'Несоответствие профиля деятельности'
              ].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setReason(tpl)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t('cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              <span>{isSubmitting ? t('processing', 'Отклонение...') : t('confirmReject', 'Отклонить заявку')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
