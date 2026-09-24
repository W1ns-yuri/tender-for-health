import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, AlertCircle } from 'lucide-react';

export default function TenderHeader({
  tenderId,
  formData,
  canPublish,
  publishing,
  publishDisabledReason,
  onPublishTender,
  errorMsg,
  theme,
  t = (k, f) => f
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 🟢 ВЕРХНЯЯ ШАПКА: Статус, Название, Номер и Кнопки действий */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 ${theme?.cardBg || ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base shadow-xs">
            {tenderId ? '📋' : '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black tracking-wide border border-emerald-500/20">
                {formData.tenderNumber || 'TNDR-NEW'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                formData.status === 'TASLAMA' 
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}>
                {formData.status === 'TASLAMA' ? t('draftStatusBadge', 'Черновик (Taslama)') : t('statusAcyk', 'Открыт (Açyk)')}
              </span>
            </div>
            <h1 className={`text-lg font-black tracking-tight mt-1 ${theme?.primaryText || ''}`}>
              {formData.title || t('newTenderTitle', 'Новый тендер')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {tenderId && (
            <button
              type="button"
              onClick={() => navigate(`/tenders/${tenderId}`)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Eye size={15} />
              <span>{t('previewTenderBtn', 'Просмотр тендера')}</span>
            </button>
          )}

          {tenderId && formData.status === 'TASLAMA' && (
            <div className="relative group flex items-center">
              <button
                type="button"
                onClick={onPublishTender}
                disabled={!canPublish || publishing}
                className={`px-5 py-2.5 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm ${
                  canPublish 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95 cursor-pointer' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                }`}
              >
                <Check size={16} />
                <span>{publishing ? t('publishing', 'Публикация...') : t('publishTenderBtn', 'Опубликовать тендер')}</span>
              </button>
              {!canPublish && publishDisabledReason && (
                <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-xl z-50 whitespace-nowrap animate-in fade-in">
                  <AlertCircle size={13} className="text-amber-400 shrink-0" />
                  <span>{publishDisabledReason}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
