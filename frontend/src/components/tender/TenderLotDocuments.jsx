import React from 'react';
import { Paperclip, Plus, FileText, Trash2 } from 'lucide-react';

export default function TenderLotDocuments({
  activeLot,
  handleLotFileUpload,
  handleLotFileDelete,
  t = (k, f) => f
}) {
  if (!activeLot) return null;

  return (
    <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-emerald-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('lotDocuments', 'Документация лота')}
          </span>
          <span className="text-[11px] text-slate-400">
            ({t('lotDocsIsolatedHint', 'Файлы, прикрепленные именно к этому лоту')})
          </span>
        </div>

        <label className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
          <Plus size={13} />
          <span>{t('uploadLotDocBtn', 'Прикрепить документ')}</span>
          <input
            type="file"
            className="hidden"
            onChange={handleLotFileUpload}
          />
        </label>
      </div>

      {activeLot.files && activeLot.files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {activeLot.files.map((fileObj, fIdx) => {
            const doc = fileObj.document || fileObj;
            return (
              <div 
                key={doc.id || fIdx} 
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className="text-emerald-600 shrink-0" />
                  <a 
                    href={doc.filePath ? `http://localhost:5000/${doc.filePath}` : '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline truncate"
                    title={doc.fileName || doc.name}
                  >
                    {doc.fileName || doc.name}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleLotFileDelete(doc.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  title={t('delete', 'Удалить')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">
          {t('noLotDocumentsYet', 'Для этого лота пока не загружено документов.')}
        </p>
      )}
    </div>
  );
}
