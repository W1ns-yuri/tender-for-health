import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, FileText, Paperclip, UploadCloud, Info, 
  FileCheck2, ScrollText, CheckCircle2, ShieldCheck, Download,
  ExternalLink, Check, X, ShieldAlert, FileCheck
} from 'lucide-react';
import { resolveFileUrl } from '../../utils/themeUtils';
import CustomSelect from '../CustomSelect';

/**
 * Вкладка 3: Общие документы тендера.
 * Предоставляет нормативно-правовую основу закупки:
 * - Проект типового контракта / договора
 * - Шаблоны и формы заявок для заполнения участниками
 * - Положение о тендере и регламент подачи предложений
 * - Квалификационные требования к поставщикам
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
  const fileInputRef = useRef(null);

  if (!tenderId) return null;

  const docTypeOptions = [
    { id: 'CONTRACT', name: t('docTypeContract', 'Проект договора / контракта') },
    { id: 'TEMPLATE', name: t('docTypeTemplate', 'Форма для заполнения') },
    { id: 'REGULATION', name: t('docTypeRegulation', 'Тендерный регламент / Положение') },
    { id: 'QUALIFICATION', name: t('docTypeQual', 'Квалификационные требования') },
    { id: 'ANNEX', name: t('docTypeAnnex', 'Общее техническое приложение') },
  ];

  const parseDocMeta = (doc) => {
    if (!doc) return { docType: 'CONTRACT', isRequired: false };
    if (doc.description) {
      try {
        const parsed = JSON.parse(doc.description);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            docType: parsed.docType || 'CONTRACT',
            isRequired: Boolean(parsed.isRequired)
          };
        }
      } catch {
        // Fallback for plain text
      }
    }
    return { docType: 'CONTRACT', isRequired: false };
  };

  const triggerUpload = (filesOrEvent) => {
    handleTenderFileUpload(filesOrEvent, {
      docType: 'CONTRACT',
      isRequired: false
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

      {/* ЕСЛИ ФАЙЛОВ НЕТ: большая удобная зона Drag & Drop (тип и обязательность указываются после добавления) */}
      {!hasFiles ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-10 rounded-2xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center gap-3 cursor-pointer text-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.005]'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900/60 hover:bg-emerald-50/20'
          }`}
        >
          <div className={`p-3.5 rounded-full transition-transform ${isDragging ? 'scale-110 bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <UploadCloud size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isDragging
                ? t('dropGeneralDocNow', 'Отпустите файлы для прикрепления к общим документам тендера')
                : t('dragDropGeneralPrompt', 'Перетащите общие документы сюда (Drag & Drop) или нажмите для выбора')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('supportedDocFormats', 'PDF, Word, Excel, JPG, PNG, ZIP архивы (до 50 МБ)')}
            </p>
          </div>
          <button
            type="button"
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs pointer-events-none"
          >
            <Plus size={14} />
            <span>{t('selectFilesBtn', 'Выбрать файлы на компьютере')}</span>
          </button>
        </div>
      ) : (
        /* ЕСЛИ ЕСТЬ ФАЙЛЫ: аккуратная таблица документов + компактный Drag & Drop снизу */
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-2 w-9 text-center font-bold">#</th>
                  <th className="py-3 px-3 min-w-55 font-bold">
                    {t('documentName', 'Название документа')}
                  </th>
                  <th className="py-3 px-3 w-64 font-bold">
                    {t('documentCategory', 'Категория / Тип')}
                  </th>
                  <th className="py-3 px-2 w-20 text-center font-bold">
                    {t('fileSize', 'Размер')}
                  </th>
                  <th className="py-3 px-2 w-32 text-center font-bold">
                    {t('status', 'Статус')}
                  </th>
                  <th className="py-3 px-3 w-20 text-right font-bold">
                    {t('actions', 'Действия')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tenderFiles.map((fileObj, fIdx) => {
                  const doc = fileObj.document || fileObj;
                  const meta = parseDocMeta(doc);
                  const fileUrl = doc.filePath ? resolveFileUrl(doc.filePath) : '';

                  return (
                    <tr key={doc.id || fIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-400">
                        {fIdx + 1}
                      </td>

                      <td className="py-3 px-3">
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
                      </td>

                      <td className="py-3 px-3">
                        <div className="w-60">
                          <CustomSelect
                            role="ADMIN"
                            size="xs"
                            clearable={false}
                            searchable={false}
                            value={meta.docType}
                            onChange={(newType) => {
                              if (handleTenderFileUpdate) {
                                handleTenderFileUpdate(doc.id, { ...meta, docType: newType });
                              }
                            }}
                            options={docTypeOptions}
                            theme={theme}
                            t={t}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '—'}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(meta.isRequired)}
                            onChange={(e) => {
                              if (handleTenderFileUpdate) {
                                handleTenderFileUpdate(doc.id, { ...meta, isRequired: e.target.checked });
                              }
                            }}
                            className="w-3.5 h-3.5 rounded accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
                          />
                          <span className={`text-[11px] font-bold ${meta.isRequired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {meta.isRequired ? t('mandatoryDocFlag', 'Обязательный') : t('optionalBadge', 'Опциональный')}
                          </span>
                        </label>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={t('viewDownload', 'Просмотр / Скачать')}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTenderFileDelete(doc.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={t('delete', 'Удалить')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Компактный Drag & Drop внизу для добавления еще общих документов */}
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
      )}
    </div>
  );
}
