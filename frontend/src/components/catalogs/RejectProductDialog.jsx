import React, { useState } from 'react';

/** Отклонение товара поставщика: причина обязательна, поставщик увидит её в уведомлении */
export default function RejectProductDialog({ product, onCancel, onConfirm, isDarkMode, t = (k, f) => f }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!product) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await onConfirm(product, note.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <form
        onSubmit={submit}
        className={`w-full max-w-md rounded-2xl border p-5 space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
      >
        <h2 className="text-base font-bold">{t('rejectProductTitle', 'Отклонить товар')} «{product.name}»</h2>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="reject-note">
          {t('rejectReason', 'Причина. Поставщик увидит её в уведомлении.')}
        </label>
        <textarea
          id="reject-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          required
          autoFocus
          placeholder={t('rejectReasonPh', 'Например: такой товар уже есть в справочнике под названием ...')}
          className={`w-full p-2.5 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer">
            {t('cancel', 'Отмена')}
          </button>
          <button type="submit" disabled={busy || !note.trim()} className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer">
            {t('reject', 'Отклонить')}
          </button>
        </div>
      </form>
    </div>
  );
}
