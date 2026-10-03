import React, { useState, useRef } from 'react';
import { 
  Paperclip, Plus, FileText, Trash2, UploadCloud, Download, 
  ExternalLink, Edit2, Check, X, ShieldAlert, FileCheck
} from 'lucide-react';
import { resolveFileUrl } from '../../utils/themeUtils';

export default function TenderLotDocuments({
  activeLot,
  handleLotFileUpload,
  handleLotFileUpdate,
  handleLotFileDelete,
  t = (k, f) => f
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', docType: 'TECH_SPEC', isRequired: true });
  const fileInputRef = useRef(null);

  if (!activeLot) return null;

  const lotDocTypes = [
    { id: 'TECH_SPEC', name: t('docTypeTechSpec', 'Техническое задание / Спецификация') },
    { id: 'DRAWING', name: t('docTypeDrawing', 'Чертеж / Схема / План') },
    { id: 'PASSPORT', name: t('docTypePassport', 'Паспорт изделия / Инструкция') },
    { id: 'CERTIFICATE', name: t('docTypeCert', 'Сертификат качества / Рег. удостоверение') },
    { id: 'OTHER', name: t('docTypeOther', 'Дополнительный документ') },
  ];

  const parseMeta = (doc) => {
    if (!doc) return { docType: 'TECH_SPEC', isRequired: true };
    if (doc.description) {
      try {
        const parsed = JSON.parse(doc.description);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            docType: parsed.docType || 'TECH_SPEC',
            isRequired: parsed.isRequired !== undefined ? Boolean(parsed.isRequired) : true
          };
        }
      } catch {
        // Plain string fallback
      }
    }
    return { docType: 'TECH_SPEC', isRequired: true };
  };

  const getDocTypeLabel = (docTypeId) => {
    const found = lotDocTypes.find(d => d.id === docTypeId);
    return found ? found.name : t('docTypeTechSpec', 'Техническая спецификация');
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
      handleLotFileUpload(e, { docType: 'TECH_SPEC', isRequired: true });
    }
  };

  const handleFileInputChange = (e) => {
    handleLotFileUpload(e, { docType: 'TECH_SPEC', isRequired: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (doc) => {
    const meta = parseMeta(doc);
    setEditingDocId(doc.id);
    setEditForm({
      name: doc.name || doc.fileName || '',
      docType: meta.docType,
      isRequired: meta.isRequired
    });
  };

  const saveEdit = (docId) => {
    if (handleLotFileUpdate) {
      handleLotFileUpdate(docId, editForm);
    }
    setEditingDocId(null);
  };

  const files = activeLot.files || [];
  const hasFiles = files.length > 0;

  return (
    <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/20 space-y-4">
      {/* Шапка секции документов лота */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('lotDocuments', 'Документация лота')}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ({t('lotDocsIsolatedHint', 'Документы и спецификации прикрепляются индивидуально к этому лоту')})
          </span>
          {hasFiles && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {files.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-600 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
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

      {/* ЕСЛИ ФАЙЛОВ НЕТ: большая дружелюбная область Drag & Drop */}
      {!hasFiles ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer text-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.005]'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/70 dark:bg-slate-900/40 hover:bg-emerald-50/30'
          }`}
        >
          <div className={`p-2.5 rounded-full transition-transform ${isDragging ? 'scale-110 bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <UploadCloud size={24} />
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
      ) : (
        /* ЕСЛИ ЕСТЬ ФАЙЛЫ: структурированная таблица + компактный Drag & Drop снизу */
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <th className="py-2.5 px-2 w-9 text-center font-bold">#</th>
                  <th className="py-2.5 px-3 min-w-[200px] font-bold">
                    {t('documentName', 'Название документа')}
                  </th>
                  <th className="py-2.5 px-3 w-48 font-bold">
                    {t('documentCategory', 'Категория / Тип')}
                  </th>
                  <th className="py-2.5 px-2 w-20 text-center font-bold">
                    {t('fileSize', 'Размер')}
                  </th>
                  <th className="py-2.5 px-2 w-32 text-center font-bold">
                    {t('status', 'Статус')}
                  </th>
                  <th className="py-2.5 px-3 w-28 text-right font-bold">
                    {t('actions', 'Действия')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.map((fileObj, fIdx) => {
                  const doc = fileObj.document || fileObj;
                  const meta = parseMeta(doc);
                  const isEditing = editingDocId === doc.id;
                  const fileUrl = doc.filePath ? resolveFileUrl(doc.filePath) : '';

                  return (
                    <tr key={doc.id || fIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">
                        {fIdx + 1}
                      </td>

                      <td className="py-2.5 px-3">
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
                            <FileText size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
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

                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            value={editForm.docType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, docType: e.target.value }))}
                            className="w-full px-2 py-1 rounded-md text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                          >
                            {lotDocTypes.map(dt => (
                              <option key={dt.id} value={dt.id}>{dt.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {getDocTypeLabel(meta.docType)}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '—'}
                      </td>

                      <td className="py-2.5 px-2 text-center">
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

                      <td className="py-2.5 px-3 text-right">
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
                                onClick={() => handleLotFileDelete(doc.id)}
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

          {/* Компактный Drag & Drop внизу для добавления еще файлов */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`py-2.5 px-4 rounded-xl border border-dashed transition-all flex items-center justify-between gap-3 cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/60 dark:bg-slate-900/40 hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <UploadCloud size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('dragDropMorePrompt', 'Перетащите дополнительные файлы сюда (Drag & Drop) или')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                {t('browseFiles', 'выберите на компьютере')}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {t('upTo50MB', 'до 50 МБ (PDF, DOC, XLS, ZIP)')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
