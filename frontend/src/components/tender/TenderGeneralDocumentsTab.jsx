import React from 'react';
import { Plus, Trash2, FileText, Paperclip } from 'lucide-react';

export default function TenderGeneralDocumentsTab({
  tenderId,
  tenderFiles = [],
  handleTenderFileUpload,
  handleTenderFileDelete,
  theme,
  t
}) {
  if (!tenderId) return null;

  return (
    <div className={`p-6 rounded-2xl border shadow-xs space-y-6 animate-in fade-in duration-200 ${theme.cardBg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className={`text-base font-black ${theme.primaryText}`}>
            {t('tabGeneralDocs', 'Общие документы тендера')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('generalDocsHint', 'Проект договора, общие регламенты, квалификационные требования и инструкции к закупке')}
          </p>
        </div>

        <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors self-start md:self-auto">
          <Plus size={15} />
          <span>{t('uploadGeneralDocBtn', 'Прикрепить общий документ')}</span>
          <input
            type="file"
            className="hidden"
            onChange={handleTenderFileUpload}
          />
        </label>
      </div>

      {tenderFiles && tenderFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tenderFiles.map((fileObj, fIdx) => {
            const doc = fileObj.document || fileObj;
            return (
              <div 
                key={doc.id || fIdx} 
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <a 
                    href={doc.filePath ? `http://localhost:5000/${doc.filePath}` : '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 truncate"
                    title={doc.fileName || doc.name}
                  >
                    {doc.fileName || doc.name}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleTenderFileDelete(doc.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                  title={t('delete', 'Удалить')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Paperclip size={32} className="mx-auto opacity-30" />
          <p className="text-xs">
            {t('noGeneralDocsYet', 'Общих документов к тендеру пока не прикреплено')}
          </p>
        </div>
      )}
    </div>
  );
}
