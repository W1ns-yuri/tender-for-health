import React from 'react';
import { FileText, Download } from 'lucide-react';
import { safeString } from '../../utils/themeUtils';

/**
 * OfferDetailsDocuments Component
 * Displays attached commercial proposal files, licenses, technical sheets,
 * and certificates with direct download functionality.
 */
export default function OfferDetailsDocuments({
  files = [],
  handleDownload,
  isDarkMode,
  theme,
  t
}) {
  return (
    <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${theme.cardBg}`}>
      <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <FileText size={18} className={theme.primaryText} />
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
            {t('attachedDocuments', 'Прикрепленные документы')}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {files.length} {t('filesSuffix', 'файлов')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`font-semibold ${theme.tableHeaderBg}`}>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 min-w-[200px]">{t('fileName', 'Имя файла')}</th>
              <th className="py-2.5 px-3 text-center w-28">{t('type', 'Тип')}</th>
              <th className="py-2.5 px-3 text-center w-36">{t('date', 'Дата загрузки')}</th>
              <th className="py-2.5 px-3 text-center w-20">{t('action', 'Действие')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {files.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText size={24} className="opacity-40" />
                    <span>{t('noDocsAttachedToProposal', 'Документы не прикреплены к заявке')}</span>
                  </div>
                </td>
              </tr>
            ) : (
              files.map((fileObj, index) => {
                const doc = fileObj.document;
                if (!doc) return null;
                const dateStr = doc.createdAt 
                  ? new Date(doc.createdAt).toLocaleDateString('ru-RU') 
                  : '-';
                const fileDisplayName = safeString(doc.fileName || doc.name);
                const fileType = safeString(doc.fileType || 'DOC');

                return (
                  <tr key={doc.id || index} className={`${theme.tableRowHover} transition-colors`}>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {fileDisplayName}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        theme.primaryBadge || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {fileType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">{dateStr}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDownload(doc)}
                        className={`p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors ${theme.primaryText}`}
                        title={t('downloadDocument', 'Скачать документ')}
                        aria-label={t('downloadDocument', 'Скачать документ')}
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
