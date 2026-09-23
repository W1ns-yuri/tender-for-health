import React, { useState, useRef } from 'react';
import { FileCheck, AlertCircle, UploadCloud, ExternalLink, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { DOCUMENT_SLOTS, ALLOWED_DOCUMENT_EXTS, MAX_DOCUMENT_FILE_SIZE } from './supplierConstants';
import API from '../../services/api';

export default function SupplierDocumentsCard({
  supplier,
  documents = [],
  setDocuments,
  isEditable,
  onDeleteDocument,
  t = (k, f) => f
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeUploadSlot, setActiveUploadSlot] = useState(null);
  const slotFileInputRefs = useRef({});

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'PDF / Скан';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Иконка формата файла
  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="text-rose-500" size={18} />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <ImageIcon className="text-blue-500" size={18} />;
    return <FileText className="text-indigo-500" size={18} />;
  };

  // Загрузка документа в целевой слот
  const handleSlotFileUpload = async (files, slotKey) => {
    if (!files || !files.length || !supplier?.id) return;
    setUploading(true);
    setUploadError('');
    setActiveUploadSlot(slotKey);

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (!ALLOWED_DOCUMENT_EXTS.includes(ext)) {
          setUploadError(t('unsupportedFileFormat', 'Поддерживаются форматы: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG'));
          setUploading(false);
          setActiveUploadSlot(null);
          return;
        }

        if (file.size > MAX_DOCUMENT_FILE_SIZE) {
          setUploadError(t('fileSizeExceeds10MB', 'Размер каждого файла не должен превышать 15 МБ'));
          setUploading(false);
          setActiveUploadSlot(null);
          return;
        }

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('supplierId', supplier.id);
        uploadData.append('name', file.name);
        uploadData.append('description', slotKey);

        const res = await API.post('/documents/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data) {
          setDocuments(prev => [res.data, ...prev]);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке документа:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setUploadError(serverMsg || t('uploadError', 'Ошибка при загрузке файла'));
    } finally {
      setUploading(false);
      setActiveUploadSlot(null);
      if (slotFileInputRefs.current[slotKey]) {
        slotFileInputRefs.current[slotKey].value = '';
      }
    }
  };

  // Получение документов, привязанных к конкретному слоту
  const getDocsForSlot = (slotKey) => {
    if (slotKey === 'OTHER') {
      const standardKeys = ['REG_CERTIFICATE', 'CHARTER', 'MINHEALTH_LICENSE', 'DIRECTOR_APPOINTMENT'];
      return documents.filter(d => d.description === 'OTHER' || !d.description || !standardKeys.includes(d.description));
    }
    return documents.filter(d => d.description === slotKey);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          <FileCheck size={18} className="text-blue-600" />
          {t('companyDocumentsTitle', 'Документы компании')}
        </h3>
        <p className="text-xs text-slate-400">
          {t('documentFormatsHelp', 'Поддерживаются форматы: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (до 15 МБ)')}
        </p>
      </div>

      {uploadError && (
        <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Сетка целевых слотов документов */}
      <div className="space-y-3.5">
        {DOCUMENT_SLOTS.map(slot => {
          const slotDocs = getDocsForSlot(slot.key);
          const hasDoc = slotDocs.length > 0;
          const SlotIcon = slot.icon;
          const isTargetUploading = uploading && activeUploadSlot === slot.key;

          return (
            <div 
              key={slot.key}
              className={`p-4 rounded-2xl border transition-all ${
                hasDoc 
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' 
                  : (slot.required 
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40' 
                      : 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800')
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    hasDoc ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    <SlotIcon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {t(slot.titleKey, slot.defaultTitle)}
                      </h4>
                      {slot.required && (
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
                          *{t('docSlotRequired', 'Обязательно')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t(slot.descKey, slot.defaultDesc)}
                    </p>
                  </div>
                </div>

                {/* Скрытый input для этого слота */}
                {isEditable && (
                  <>
                    <input
                      ref={el => slotFileInputRefs.current[slot.key] = el}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      disabled={!isEditable || uploading}
                      onChange={e => handleSlotFileUpload(e.target.files, slot.key)}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => slotFileInputRefs.current[slot.key]?.click()}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                        hasDoc 
                          ? 'bg-slate-200/70 hover:bg-slate-300/70 text-slate-700 dark:bg-slate-700 dark:text-slate-200' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20'
                      }`}
                    >
                      {isTargetUploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <UploadCloud size={14} />
                      )}
                      <span>{hasDoc ? t('replaceSlotFileBtn', '+ Добавить / Заменить') : t('uploadToSlotBtn', 'Загрузить скан')}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Список прикрепленных к данному слоту файлов */}
              {slotDocs.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {slotDocs.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getFileIcon(doc.fileName || doc.name)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {doc.name || doc.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(doc.fileSize)} {doc.createdAt ? `• ${new Date(doc.createdAt).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`http://localhost:5000/${(doc.filePath || `uploads/${doc.fileName || doc.name}`).replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 px-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                        >
                          <ExternalLink size={12} />
                          <span>{t('openActionBtn', 'Открыть')}</span>
                        </a>
                        {isEditable && (
                          <button
                            type="button"
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t('deleteDocumentTooltip', 'Удалить')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-[11px] text-slate-400 italic">
                  {t('noDocInSlot', 'Документ в данный раздел еще не загружен')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
