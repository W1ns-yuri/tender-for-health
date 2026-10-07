import React from 'react';
import { Download, FileText } from 'lucide-react';
import { safeString } from '../../utils/themeUtils';

export default function TenderDetailsDocuments({
  docsList,
  onDownload,
  formatDate,
  isDarkMode,
  theme,
  t,
}) {
  return (
    <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
      <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <FileText size={17} className={theme.primaryText} />
          <h3 className="font-bold text-base">{t('documents', 'Тендерная документация')}</h3>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {docsList.length} {t('filesCount', 'файлов')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={theme.tableHeaderBg}>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 w-52 text-center">{t('fileName', 'Имя файла')}</th>
              <th className="py-3 px-4 text-center">{t('description', 'Описание')}</th>
              <th className="py-3 px-4 text-center w-24">{t('type', 'Формат')}</th>
              <th className="py-3 px-4 text-center w-24">{t('size', 'Размер')}</th>
              <th className="py-3 px-4 text-center w-32">{t('uploadDate', 'Дата')}</th>
              <th className="py-3 px-4 text-center w-16">{t('action', 'Скачать')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {docsList.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-400">
                  {t('noDocumentsAttached', 'Документы отсутствуют')}
                </td>
              </tr>
            ) : (
              docsList.map((doc, idx) => (
                <tr key={doc.id || idx} className={theme.tableRowHover}>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-100">
                    {safeString(doc?.fileName || doc?.name)}
                  </td>
                  <td className="py-3.5 px-4 text-center w-auto min-w-50 whitespace-normal text-wrap text-slate-500">
                    {safeString(doc?.description)}
                  </td>
                  <td className={`py-3.5 px-4 text-center font-bold ${theme.primaryText}`}>
                    {safeString(doc?.fileType || doc?.type)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    {safeString(doc?.size, '-')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    {formatDate(doc?.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                      title={t('downloadFile', 'Скачать файл')}
                    >
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
