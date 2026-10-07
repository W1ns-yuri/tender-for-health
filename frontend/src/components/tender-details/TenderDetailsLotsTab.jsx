import React from 'react';
import { Bookmark, Trophy, Paperclip, FileText } from 'lucide-react';
import { cleanLotTitle } from '../../utils/pluralize';
import { safeString } from '../../utils/themeUtils';
import { getFileDownloadUrl } from './useTenderDetailsState';

export default function TenderDetailsLotsTab({
  lots,
  activeLotTab,
  setActiveLotTab,
  winningOffer,
  role,
  isDarkMode,
  theme,
  t,
}) {
  if (!lots || lots.length === 0) {
    return (
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg} p-6 text-center text-slate-400`}>
        {t('noLotsOrSpecs', 'Нет лотов и спецификаций')}
      </div>
    );
  }

  const lot = lots[activeLotTab] || lots[0];
  const lotIdx = activeLotTab < lots.length ? activeLotTab : 0;

  const isWorks = lot.lotType === 'WORKS';
  const isServices = lot.lotType === 'SERVICES';
  const isGoods = !isWorks && !isServices;

  return (
    <div className="relative">
      {/* Линейка браузерных закладок лотов */}
      <div className="flex items-end gap-1.5 -mb-[1px] relative z-10 overflow-x-auto scrollbar-thin">
        {lots.map((lItem, lIdx) => {
          const isActive = activeLotTab === lIdx || (!lots[activeLotTab] && lIdx === 0);
          return (
            <button
              key={lItem.id || lIdx}
              type="button"
              onClick={() => setActiveLotTab(lIdx)}
              className={`px-4 py-2.5 rounded-t-2xl font-black text-xs flex items-center gap-2 border-t-2 border-x transition-all cursor-pointer shrink-0 select-none ${
                isActive
                  ? role === 'SUPPLIER'
                    ? 'bg-white dark:bg-[#111827] border-t-blue-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
              }`}
            >
              <Bookmark
                size={14}
                className={
                  isActive
                    ? role === 'SUPPLIER'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }
              />
              <span className="truncate max-w-44">
                {cleanLotTitle(lItem.name || `Лот №${lItem.lotNumber || lIdx + 1}`, lItem.lotNumber || lIdx + 1)}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  isActive
                    ? role === 'SUPPLIER'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lItem.specs?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Карточка активного лота: единое целое со вкладками */}
      <div
        className={`rounded-2xl ${
          activeLotTab === 0 || !lots[activeLotTab] ? 'rounded-tl-none' : ''
        } border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs overflow-hidden`}
      >
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">
                {t('lotUpperLabel', 'Лот')} #{lot.lotNumber || lotIdx + 1}:{' '}
                {cleanLotTitle(lot.name, lot.lotNumber || lotIdx + 1)}
              </h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isWorks
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : isServices
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : role === 'SUPPLIER'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}
              >
                {isWorks
                  ? t('worksType', 'Работы')
                  : isServices
                  ? t('servicesType', 'Услуги')
                  : t('catProducts', 'Товары')}
              </span>
            </div>

            {/* Категория и Конечный получатель */}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {lot.category?.name && (
                <span>
                  📁 {t('lotCategory', 'Категория')}:{' '}
                  <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                    {lot.category.name}
                  </strong>
                </span>
              )}
              {lot.endUser && (
                <span>
                  🏢 {t('endUser', 'Конечный получатель')}:{' '}
                  <strong
                    className={`font-semibold ${
                      role === 'SUPPLIER'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {lot.endUser}
                  </strong>
                </span>
              )}
            </div>

            {/* Условия поставки / выполнения */}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {isGoods && lot.deliveryTerm && (
                <span>
                  📦 {t('deliveryTerm', 'Условие поставки')}:{' '}
                  <strong>{lot.deliveryTerm.shortName}</strong>
                </span>
              )}
              {isGoods && lot.deliveryAddress && (
                <span>
                  📍 {t('deliveryAddressLabel', 'Пункт назначения')}: {lot.deliveryAddress}
                </span>
              )}
              {isWorks && (
                <>
                  {lot.workAddress && (
                    <span>📍 {t('siteLabel', 'Объект')}: {lot.workAddress}</span>
                  )}
                  {lot.workPeriod && (
                    <span>⏱️ {t('termLabel', 'Срок')}: {lot.workPeriod}</span>
                  )}
                  {lot.licenseRequired && (
                    <span className="text-amber-600 font-semibold">
                      📜 {t('licenseRequired', 'Требуется лицензия')}
                    </span>
                  )}
                </>
              )}
              {isServices && (
                <>
                  {lot.serviceFormat && (
                    <span>🏢 {t('serviceFormat', 'Формат')}: {lot.serviceFormat}</span>
                  )}
                  {lot.slaPeriod && <span>⏱️ SLA: {lot.slaPeriod}</span>}
                </>
              )}
            </div>
          </div>

          {/* Победитель лота */}
          {winningOffer && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <Trophy size={16} className="text-emerald-500" />
              <div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  {t('winnerBadge', 'Победитель')}
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {winningOffer.supplier?.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Документация конкретного лота */}
        {lot.files && lot.files.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mr-2">
              <Paperclip
                size={13}
                className={role === 'SUPPLIER' ? 'text-blue-600' : 'text-emerald-600'}
              />
              <span>{t('lotDocuments', 'Документация лота')}:</span>
            </div>
            {lot.files.map((fileObj, fIdx) => {
              const doc = fileObj.document || fileObj;
              const fileUrl = getFileDownloadUrl(doc);
              return (
                <a
                  key={doc.id || fIdx}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs transition-colors ${
                    role === 'SUPPLIER'
                      ? 'text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <FileText
                    size={12}
                    className={role === 'SUPPLIER' ? 'text-blue-600' : 'text-emerald-600'}
                  />
                  <span className="truncate max-w-40">{doc.fileName || doc.name}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Таблица спецификаций активного лота */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3 px-4 w-16 text-center">{t('itemNumber', '№ п/п')}</th>
                <th className="py-3 px-4 text-center min-w-48">
                  {isWorks
                    ? t('workStages', 'Этап / вид работ')
                    : isServices
                    ? t('serviceName', 'Наименование услуги')
                    : t('product', 'Товар')}
                </th>
                <th className="py-3 px-4 text-center w-28">
                  {isServices ? t('volumePeriod', 'Объем / Период') : t('quantity', 'Количество')}
                </th>
                <th className="py-3 px-4 text-center w-28">{t('unit', 'Ед. измерения')}</th>
                {isGoods && (
                  <th className="py-3 px-4 text-center w-36">{t('manufacturer', 'Производитель')}</th>
                )}
                <th className="py-3 px-4 text-center">
                  {isWorks
                    ? t('scopeOfWork', 'Состав и спецификация работ')
                    : isServices
                    ? t('serviceRegulations', 'Регламент и описание услуги')
                    : t('description', 'Описание')}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {!lot.specs || lot.specs.length === 0 ? (
                <tr>
                  <td colSpan={isGoods ? 6 : 5} className="py-6 text-center text-slate-400">
                    {isWorks
                      ? t('noWorkStagesInLot', 'В этом лоте нет этапов работ')
                      : isServices
                      ? t('noServicesInLot', 'В этом лоте нет позиций услуг')
                      : t('noGoodsInLot', 'В этом лоте нет товаров')}
                  </td>
                </tr>
              ) : (
                lot.specs.map((spec, idx) => (
                  <tr key={spec.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                      {safeString(spec?.positionNumber || idx + 1)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {safeString(spec?.generalProduct?.name || spec?.name)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {safeString(spec?.quantity)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {safeString(spec?.unit?.name || spec?.unit?.shortName)}
                    </td>
                    {isGoods && (
                      <td className="py-3.5 px-4 text-center">
                        {safeString(spec?.manufacturer?.name || '-')}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center w-auto min-w-60 whitespace-normal text-wrap text-slate-500">
                      {safeString(spec?.description)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
