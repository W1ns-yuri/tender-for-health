import React from 'react';
import { 
  FileText, 
  Download, 
  Paperclip, 
  Plus, 
  AlertCircle, 
  X, 
  UploadCloud, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import API from '../../services/api';

export default function OfferDocumentsCard({
  tender,
  uploadedFiles = [],
  handleRemoveFile,
  fileInputRef,
  handleFileInputChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isDragging,
  fileUploadError,
  setFileUploadError,
  formatFileSize,
  isDarkMode,
  theme,
  t
}) {
  const baseUrl = API.defaults?.baseURL ? API.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Документы тендера (от заказчика) */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme?.cardBg || ''}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileText size={16} className="text-blue-600 dark:text-blue-400" />
            <span>{t('customerDocsTitle', 'Документы от заказчика')}</span>
          </h3>
          <span className="text-xs text-slate-400">{tender?.files?.length || 0} {t('filesSuffix', 'файлов')}</span>
        </div>

        <div className="p-3">
          {tender?.files && tender.files.length > 0 ? (
            <div className="space-y-2">
              {tender.files.map((fileObj, idx) => {
                const doc = fileObj.document;
                if (!doc) return null;
                const actualFileName = doc.filePath ? doc.filePath.split(/[\\/]/).pop() : (doc.fileName || doc.name);
                const fileUrl = `${baseUrl}/uploads/${actualFileName}`;

                return (
                  <div key={doc.id || idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={16} className="text-slate-400 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{doc.fileName || doc.name}</div>
                        <div className="text-[10px] text-slate-400">{doc.fileType || 'DOC'}</div>
                      </div>
                    </div>
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                      title={t('downloadFileTooltip', 'Скачать файл')}
                    >
                      <Download size={15} />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              {t('noDocumentsAttached', 'Заказчик не прикрепил документы')}
            </div>
          )}
        </div>
      </div>

      {/* Документы коммерческого предложения (Поставщика) — Интерактивная Dropzone */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme?.cardBg || ''}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Paperclip size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{t('supplierDocsTitle', 'Ваши сертификаты и документы')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('supplierDocsSubtitle', 'Сертификаты, лицензии, коммерческое предложение (до 25 МБ)')}
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('attachMoreDocsBtn', 'Прикрепить еще документ')}</span>
            </button>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          multiple 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" 
          className="hidden" 
        />

        <div className="p-4 space-y-3">
          {fileUploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{fileUploadError}</span>
              </div>
              <button type="button" onClick={() => setFileUploadError && setFileUploadError('')} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md cursor-pointer">
                <X size={13} />
              </button>
            </div>
          )}

          {uploadedFiles.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/40 dark:bg-slate-900/30 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <UploadCloud size={24} />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {t('dragFilesNotice', 'Перетащите файлы сюда или нажмите для выбора')}
              </div>
              <div className="text-xs text-slate-400">
                {t('supportedFileFormats25MB', 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG до 25 МБ (до 10 файлов)')}
              </div>
            </div>
          ) : (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="space-y-2"
            >
              {uploadedFiles.map((doc, idx) => (
                <div key={doc.id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 transition-all shadow-2xs">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
                      <FileText size={18} />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {doc.fileName || doc.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="uppercase font-semibold">{doc.fileType || 'FILE'}</span>
                        {doc.size && <span>• {formatFileSize ? formatFileSize(doc.size) : `${doc.size} B`}</span>}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> {t('attachedBadge', 'Прикреплен')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveFile && handleRemoveFile(idx)} 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title={t('deleteFileTooltip', 'Удалить файл')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
