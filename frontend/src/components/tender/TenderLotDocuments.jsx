import React, { useState, useRef } from 'react';
import { Paperclip, Plus, FileText, Trash2, UploadCloud } from 'lucide-react';

export default function TenderLotDocuments({
  activeLot,
  handleLotFileUpload,
  handleLotFileDelete,
  t = (k, f) => f
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!activeLot) return null;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    handleLotFileUpload(e);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleLotFileUpload(e);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/20 space-y-3.5">
      {/* Шапка секции */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('lotDocuments', 'Документация лота')}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ({t('lotDocsIsolatedHint', 'Документы и спецификации прикрепляются индивидуально к этому лоту')})
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
        >
          <Plus size={13} />
          <span>{t('uploadLotDocBtn', 'Прикрепить документ к лоту')}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Зона Drag & Drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.005]'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white/60 dark:bg-slate-900/40 hover:bg-emerald-50/30'
        }`}
      >
        <div className={`p-2 rounded-full transition-transform ${isDragging ? 'scale-110 bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
          <UploadCloud size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isDragging
              ? t('dropFilesHereNow', 'Отпустите файлы для загрузки в лот')
              : t('dragDropPrompt', 'Перетащите файлы сюда (Drag & Drop) или нажмите для выбора')}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t('supportedDocFormats', 'PDF, Word, Excel, JPG, PNG, ZIP архивы (до 50 МБ)')}
          </p>
        </div>
      </div>

      {/* Список уже прикрепленных файлов к лоту */}
      {activeLot.files && activeLot.files.length > 0 && (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLotFileDelete(doc.id);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  title={t('delete', 'Удалить')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
