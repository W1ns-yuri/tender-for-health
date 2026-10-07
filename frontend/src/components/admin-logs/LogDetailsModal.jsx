import React from 'react';
import { FileText, X } from 'lucide-react';

/**
 * LogDetailsModal Component
 * Interactive modal inspecting raw audit event payload and metadata.
 */
export default function LogDetailsModal({
  log,
  onClose,
  cardBg,
  t
}) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <span>{t('auditEventDetailsTitle', 'Детали события аудита')}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="text-slate-400 font-semibold">{t('eventLabel', 'Событие')}</p>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {log.eventType} ({log.operationType})
            </p>
          </div>

          <div>
            <p className="text-slate-400 font-semibold">{t('ipAddressLabel', 'IP-адрес')}</p>
            <p className="font-mono text-slate-700 dark:text-slate-300">{log.ip || '127.0.0.1'}</p>
          </div>

          <div>
            <p className="text-slate-400 font-semibold">{t('payloadLabel', 'Тело запроса (Payload)')}</p>
            <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl font-mono text-[11px] overflow-x-auto max-h-52 border border-slate-200/60 dark:border-slate-800">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {t('closeModalBtn', 'Закрыть')}
          </button>
        </div>
      </div>
    </div>
  );
}
