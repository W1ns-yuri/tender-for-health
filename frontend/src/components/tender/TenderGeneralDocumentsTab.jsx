import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, FileText, Paperclip, UploadCloud, Info, 
  FileCheck2, ScrollText, CheckCircle2, ShieldCheck, Download,
  ExternalLink, Edit2, Check, X, ShieldAlert, FileCheck
} from 'lucide-react';
import { resolveFileUrl } from '../../utils/themeUtils';

/**
 * Вкладка 3: Общие документы тендера.
 * Предоставляет нормативно-правовую основу закупки:
 * - Проект типового контракта / договора
 * - Шаблоны и формы заявок для заполнения участниками
 * - Положение о тендере и регламент подачи предложений
 * - Квалификационные требования к поставщикам
 * 
 * Включает: Drag & Drop загрузку, табличный вид при наличии файлов,
 * компактную зону догрузки и возможность редактирования типа и обязательности.
 */
export default function TenderGeneralDocumentsTab({
  tenderId,
  tenderFiles = [],
  handleTenderFileUpload,
  handleTenderFileUpdate,
  handleTenderFileDelete,
  theme,
  t = (k, f) => f
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('CONTRACT');
  const [isDocRequired, setIsDocRequired] = useState(true);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', docType: 'CONTRACT', isRequired: true });
  const fileInputRef = useRef(null);

  if (!tenderId) return null;

  const docTypeOptions = [
    { id: 'CONTRACT', label: t('docTypeContract', 'Проект договора / контракта'), icon: <ScrollText size={13} />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' },
    { id: 'TEMPLATE', label: t('docTypeTemplate', 'Форма для заполнения'), icon: <FileCheck2 size={13} />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
    { id: 'REGULATION', label: t('docTypeRegulation', 'Тендерный регламент / Положение'), icon: <ShieldCheck size={13} />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700' },
    { id: 'QUALIFICATION', label: t('docTypeQual', 'Квалификационные требования'), icon: <CheckCircle2 size={13} />, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
    { id: 'ANNEX', label: t('docTypeAnnex', 'Общее техническое приложение'), icon: <Paperclip size={13} />, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
  ];

  const parseDocMeta = (doc) => {
    if (!doc) return { docType: 'ANNEX', isRequired: false };
    if (doc.description) {
      try {
        const parsed = JSON.parse(doc.description);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            docType: parsed.docType || 'ANNEX',
            isRequired: Boolean(parsed.isRequired)
          };
        }
      } catch {
        // Fallback for plain text
      }
    }
    return { docType: 'ANNEX', isRequired: false };
  };

  const getDocTypeBadge = (docType) => {
    const found = docTypeOptions.find(o => o.id === docType);
    return found || docTypeOptions[4];
  };

  const triggerUpload = (filesOrEvent) => {
    handleTenderFileUpload(filesOrEvent, {
      docType: selectedDocType,
      isRequired: isDocRequired
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      triggerUpload(e);
    }
  };

  const startEdit = (doc) => {
    const meta = parseDocMeta(doc);
    setEditingDocId(doc.id);
    setEditForm({
      name: doc.name || doc.fileName || '',
      docType: meta.docType,
      isRequired: meta.isRequired
    });
  };

  const saveEdit = (docId) => {
    if (handleTenderFileUpdate) {
      handleTenderFileUpdate(docId, editForm);
    }
    setEditingDocId(null);
  };

  const hasFiles = tenderFiles && tenderFiles.length > 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Шапка таба */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className={`text-base font-black ${theme?.primaryText || ''}`}>
            {t('tabGeneralDocs', 'Общие документы тендера')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('generalDocsHint', 'Обязательный комплект: проект договора, формы заявок, регламент и квалификационные требования')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">
            {t('totalDocsCount', 'Прикреплено документов')}:{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black">
              {tenderFiles.length}
            </span>
          </span>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Plus size={13} />
            <span>{t('attachDocBtn', 'Добавить документ')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={triggerUpload}
          />
        </div>
      </div>

      {/* Информационный баннер: зачем нужны общие документы */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex items-start gap-3 text-xs">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-900 dark:text-blue-200">
            {t('whyGeneralDocsTitle', 'Юридическая основа закупки')}
          </p>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-[11px]">
            {t('whyGeneralDocsBody', 'Общие документы распространяются на весь тендер и видны всем участникам. Без проекта контракта или утвержденного регламента тендер не может быть опубликован, так как поставщикам необходимо знать юридические условия заключения контракта.')}
          </p>
        </div>
      </div>

      {/* ЕСЛИ ФАЙЛОВ НЕТ: большая удобная форма настройки типа + Drag & Drop */}
      {!hasFiles ? (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('docTypeLabel', 'Тип прикрепляемого документа')}:
              </span>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {docTypeOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isDocRequired}
                onChange={(e) => setIsDocRequired(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
              />
              <span>{t('mandatoryDocFlag', 'Обязательный документ (Required)')}</span>
            </label>
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.005]'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900/60 hover:bg-emerald-50/20'
            }`}
          >
            <div className={`p-3 rounded-full transition-transform ${isDragging ? 'scale-110 bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <UploadCloud size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isDragging
                  ? t('dropGeneralDocNow', 'Отпустите файлы для прикрепления к общим документам тендера')
                  : t('dragDropGeneralPrompt', 'Перетащите общие документы сюда (Drag & Drop) или нажмите для выбора')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('supportedDocFormats', 'PDF, Word, Excel, JPG, PNG, ZIP архивы (до 50 МБ)')}
              </p>
            </div>
            <button
              type="button"
              className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs pointer-events-none"
            >
              <Plus size={14} />
              <span>{t('selectFilesBtn', 'Выбрать файлы на компьютере')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ЕСЛИ ЕСТЬ ФАЙЛЫ: аккуратная таблица документов + компактный Drag & Drop снизу */
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-2 w-9 text-center font-bold">#</th>
                  <th className="py-3 px-3 min-w-55 font-bold">
                    {t('documentName', 'Название документа')}
                  </th>
                  <th className="py-3 px-3 w-56 font-bold">
                    {t('documentCategory', 'Категория / Тип')}
                  </th>
                  <th className="py-3 px-2 w-20 text-center font-bold">
                    {t('fileSize', 'Размер')}
                  </th>
                  <th className="py-3 px-2 w-32 text-center font-bold">
                    {t('status', 'Статус')}
                  </th>
                  <th className="py-3 px-3 w-28 text-right font-bold">
                    {t('actions', 'Действия')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tenderFiles.map((fileObj, fIdx) => {
                  const doc = fileObj.document || fileObj;
                  const meta = parseDocMeta(doc);
                  const badge = getDocTypeBadge(meta.docType);
                  const isEditing = editingDocId === doc.id;
                  const fileUrl = doc.filePath ? resolveFileUrl(doc.filePath) : '';

                  return (
                    <tr key={doc.id || fIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-400">
                        {fIdx + 1}
                      </td>

                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md text-xs border border-emerald-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                            placeholder="Название файла"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
                            <FileText size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <a
                              href={fileUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate hover:underline"
                              title={doc.name || doc.fileName}
                            >
                              {doc.name || doc.fileName}
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isEditing ? (
                          <select
                            value={editForm.docType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, docType: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                          >
                            {docTypeOptions.map(o => (
                              <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${badge.color}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '—'}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
                            <input
                              type="checkbox"
                              checked={editForm.isRequired}
                              onChange={(e) => setEditForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                              className="w-3.5 h-3.5 rounded accent-emerald-600 cursor-pointer"
                            />
                            <span>{t('mandatory', 'Обязательный')}</span>
                          </label>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            meta.isRequired
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {meta.isRequired ? (
                              <>
                                <ShieldAlert size={10} />
                                <span>{t('requiredBadge', 'Обязательный')}</span>
                              </>
                            ) : (
                              <>
                                <FileCheck size={10} />
                                <span>{t('optionalBadge', 'Опциональный')}</span>
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(doc.id)}
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 transition-colors"
                                title={t('save', 'Сохранить')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDocId(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title={t('cancel', 'Отмена')}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={t('viewDownload', 'Просмотр / Скачать')}
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => startEdit(doc)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title={t('editDocMeta', 'Редактировать тип и статус')}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTenderFileDelete(doc.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title={t('delete', 'Удалить')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Компактный Drag & Drop внизу для добавления еще общих документов */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t('addNextDocType', 'Тип следующего документа')}:
                </span>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {docTypeOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isDocRequired}
                  onChange={(e) => setIsDocRequired(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
                />
                <span>{t('mandatoryDocFlag', 'Обязательный')}</span>
              </label>
            </div>

            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`py-3 px-4 rounded-xl border border-dashed transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/70 dark:bg-slate-900/60 hover:bg-emerald-50/20'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <UploadCloud size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('dragDropMoreGeneralPrompt', 'Перетащите дополнительные файлы сюда (Drag & Drop) или')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                  {t('browseFiles', 'выберите на компьютере')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {t('upTo50MB', 'до 50 МБ (PDF, DOC, XLS, ZIP)')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
