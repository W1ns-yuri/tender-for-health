import React, { useState, useEffect } from 'react';
import { Download, Clock, Users, LayoutGrid, Trophy, Bookmark, Edit2, Paperclip, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { cleanLotTitle } from '../utils/pluralize';

export default function TenderDetails({ tenderId, role, isDarkMode, lang = 'RU' }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const activeTenderId = tenderId || paramId;
  const [tender, setTender] = useState(null);
  const [activeLotTab, setActiveLotTab] = useState(0);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  useEffect(() => {
    if (activeTenderId) {
      API.get(`/tenders/${activeTenderId}`)
        .then((res) => {
          if (res.data) setTender(res.data);
        })
        .catch((e) => console.log('Tender details error', e));
    }
    if (role === 'SUPPLIER') {
      API.get('/suppliers/profile')
        .then((res) => {
          if (res.data) setSupplierProfile(res.data);
        })
        .catch(() => {
          try {
            const u = JSON.parse(localStorage.getItem('tender_user'));
            if (u?.suppliers?.[0]) setSupplierProfile(u.suppliers[0]);
          } catch {}
        });
    }
  }, [activeTenderId, role]);

  const data = tender || {};
  const isSupplierVerified = role !== 'SUPPLIER' || supplierProfile?.verificationStatus === 'VERIFIED';

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return dateVal;
    }
  };

  const getClientName = (tItem) => {
    return tItem?.client?.name || tItem?.clientId || '-';
  };

  const getCategoryName = (tItem) => {
    return tItem?.category?.name || tItem?.categoryId || '-';
  };

  const docsList = Array.isArray(data?.files)
    ? data.files.map(f => f.document).filter(Boolean)
    : (Array.isArray(data?.documents) ? data.documents : []);

  const handleDownload = (doc) => {
    if (!doc) return;
    if (doc.filePath && doc.filePath.startsWith('http')) {
      window.open(doc.filePath, '_blank');
      return;
    }
    const cleanPath = (doc.filePath || `uploads/${doc.fileName || doc.name || ''}`).replace(/\\/g, '/');
    const normalized = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    const fileUrl = `http://localhost:5000/${normalized.startsWith('uploads/') ? normalized : `uploads/${normalized}`}`;
    window.open(fileUrl, '_blank');
  };

  if (!tender) {
    return <div className="text-center py-10 text-slate-500">{t('loading', 'Загрузка...')}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Главная карточка деталей */}
      <div className={`p-6 rounded-xl border shadow-xs ${theme.cardBg}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{safeString(data?.tenderNumber)}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{safeString(data?.title)}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {role === 'ADMIN' && (
              <button
                onClick={() => navigate(`/tenders/${data.id}/edit`)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Edit2 size={14} />
                <span>{t('editTenderAndLots', 'Редактировать / Управлять лотами')}</span>
              </button>
            )}
            {role === 'SUPPLIER' && (
              data?.offers?.length > 0 ? (
                <button
                  disabled
                  className={`px-5 py-2 rounded-lg font-semibold text-sm shadow-md transition-all opacity-50 cursor-not-allowed ${theme.primaryBtn}`}
                  title={t('alreadySubmitted', 'Вы уже подали заявку на этот тендер')}
                >
                  {t('offerSubmitted', 'Teklip tabşyryldy')}
                </button>
              ) : !isSupplierVerified ? (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  title={t('verificationRequiredToBid', 'Для подачи ценового предложения необходимо пройти верификацию компании')}
                >
                  {t('submitOfferBtn', 'Teklip ber')}
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/create-offer/${data.id}`)}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm shadow-md transition-all ${theme.primaryBtn}`}
                >
                  {t('submitOfferBtn', 'Teklip ber')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Баннер предупреждения для неверифицированного поставщика */}
        {role === 'SUPPLIER' && supplierProfile && supplierProfile.verificationStatus !== 'VERIFIED' && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">
                  {t('verificationRequiredToBidTitle', 'Требуется верификация компании')}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {supplierProfile.verificationStatus === 'PENDING_REVIEW'
                    ? t('profileInReviewCannotBidNotice', 'Ваши документы находятся на проверке у администратора. Доступ к торгам откроется после одобрения.')
                    : supplierProfile.verificationStatus === 'REJECTED'
                    ? t('profileRejectedCannotBidNotice', 'Верификация отклонена. Исправьте замечания в профиле и отправьте его на повторную проверку.')
                    : t('completeProfileToBidNotice', 'Для подачи ценовых предложений необходимо заполнить реквизиты и прикрепить документы в профиле.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              {t('goToProfileBtn', 'Перейти в профиль')}
            </button>
          </div>
        )}

        {/* Row 1: Dates & Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className={`flex items-center space-x-6 text-sm font-medium ${theme.subText}`}>
            <div className="flex items-center space-x-1.5">
              <Clock size={16} className="opacity-75" />
              <span>{t('announcementDate', 'Yglan edilen wagty')}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>{formatDate(data?.announcementDate)}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock size={16} className="opacity-75" />
              <span>{t('deadline', 'Soňky wagty')}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>{formatDate(data?.deadline)}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className={theme.subText}>{t('type', 'Görnüşi')}:</span> {getTypeBadge(data?.type, lang, isDarkMode)}
            <span className={`ml-3 ${theme.subText}`}>{t('status', 'Status')}:</span> {getStatusBadge(data?.status, lang, isDarkMode)}
            <span className={`ml-3 ${theme.subText}`}>{t('visibility', 'Açyklygy')}:</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              {data?.visibility === 'YAPYK' ? (t('visibilityPrivate', 'Закрытый')) : (t('openVisibility', 'Открытый'))}
            </span>
          </div>
        </div>

        {/* Row 2: Client & Category */}
        <div className={`mt-3 flex items-center space-x-6 text-sm font-medium pb-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} ${theme.subText}`}>
          <div className="flex items-center space-x-1.5">
            <Users size={16} className="opacity-75" />
            <span>{t('client', 'Sargyt ediji')}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>{getClientName(data)}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <LayoutGrid size={16} className="opacity-75" />
            <span>{t('category', 'Категория')}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>{getCategoryName(data)}</strong></span>
          </div>
        </div>

        {/* Mazmuny */}
        <div className="mt-6">
          <h4 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t('description', 'Mazmuny')}:</h4>
          <div className={`text-sm leading-relaxed whitespace-normal text-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {safeString(data?.description)}
          </div>
        </div>

        {/* Tehniki şartler */}
        <div className="mt-6">
          <h4 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t('technicalSpecs', 'Tehniki şartler')}:</h4>
          <div className={`text-sm leading-relaxed whitespace-normal text-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {safeString(data?.technicalSpecs)}
          </div>
        </div>
      </div>

      {/* 3. Таблицы лотов и спецификаций в виде интерактивных закладок (табов) */}
      <div className="space-y-4">
        {(!data?.lots || data.lots.length === 0) && (!data?.specs || data.specs.length === 0) ? (
          <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg} p-6 text-center text-slate-400`}>
            {t('noLotsOrSpecs', 'Нет лотов и спецификаций')}
          </div>
        ) : data?.lots && data.lots.length > 0 ? (
          (() => {
            const lot = data.lots[activeLotTab] || data.lots[0];
            const lotIdx = activeLotTab < data.lots.length ? activeLotTab : 0;

            let winningOffer = null;
            if (data.status === 'YENIJI_YGLAN_EDILDI' && data.offers && lot.specs) {
              const lotSpecIds = lot.specs.map(s => s.id);
              winningOffer = data.offers.find(offer =>
                offer.specs?.some(os => lotSpecIds.includes(os.tenderSpecId) && os.isAwarded)
              );
            }

            const isWorks = lot.lotType === 'WORKS';
            const isServices = lot.lotType === 'SERVICES';
            const isGoods = !isWorks && !isServices;

            return (
              <div className="relative">
                {/* Линейка браузерных закладок лотов */}
                <div className="flex items-end gap-1.5 -mb-[1px] relative z-10 overflow-x-auto scrollbar-thin">
                  {data.lots.map((lItem, lIdx) => {
                    const isActive = (activeLotTab === lIdx) || (!data.lots[activeLotTab] && lIdx === 0);
                    return (
                      <button
                        key={lItem.id || lIdx}
                        type="button"
                        onClick={() => setActiveLotTab(lIdx)}
                        className={`px-4 py-2.5 rounded-t-2xl font-black text-xs flex items-center gap-2 border-t-2 border-x transition-all cursor-pointer shrink-0 select-none ${
                          isActive
                            ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
                        }`}
                      >
                        <Bookmark size={14} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                        <span className="truncate max-w-44">{cleanLotTitle(lItem.name || `Лот №${lItem.lotNumber || lIdx + 1}`, lItem.lotNumber || lIdx + 1)}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {lItem.specs?.length || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Карточка активного лота: единое целое со вкладками */}
                <div className={`rounded-2xl ${(activeLotTab === 0 || !data.lots[activeLotTab]) ? 'rounded-tl-none' : ''} border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs overflow-hidden`}>
                  <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{t('lotUpperLabel', 'Лот')} #{lot.lotNumber || lotIdx + 1}: {cleanLotTitle(lot.name, lot.lotNumber || lotIdx + 1)}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isWorks 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                            : isServices 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {isWorks ? (t('worksType', 'Работы')) : isServices ? (t('servicesType', 'Услуги')) : (t('catProducts', 'Товары'))}
                        </span>
                      </div>

                      {/* Дополнительные метаданные лота: Категория и Конечный получатель */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {lot.category?.name && (
                          <span>📁 {t('lotCategory', 'Категория')}: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{lot.category.name}</strong></span>
                        )}
                        {lot.endUser && (
                          <span>🏢 {t('endUser', 'Конечный получатель')}: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{lot.endUser}</strong></span>
                        )}
                      </div>

                      {/* Условия поставки / выполнения */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {isGoods && lot.deliveryTerm && (
                          <span>📦 {t('deliveryTerm', 'Условие поставки')}: <strong>{lot.deliveryTerm.shortName}</strong></span>
                        )}
                        {isGoods && lot.deliveryAddress && (
                          <span>📍 {t('deliveryAddressLabel', 'Пункт назначения')}: {lot.deliveryAddress}</span>
                        )}
                        {isWorks && (
                          <>
                            {lot.workAddress && <span>📍 {t('siteLabel', 'Объект')}: {lot.workAddress}</span>}
                            {lot.workPeriod && <span>⏱️ {t('termLabel', 'Срок')}: {lot.workPeriod}</span>}
                            {lot.licenseRequired && <span className="text-amber-600 font-semibold">📜 {t('licenseRequired', 'Требуется лицензия')}</span>}
                          </>
                        )}
                        {isServices && (
                          <>
                            {lot.serviceFormat && <span>🏢 {t('serviceFormat', 'Формат')}: {lot.serviceFormat}</span>}
                            {lot.slaPeriod && <span>⏱️ SLA: {lot.slaPeriod}</span>}
                          </>
                        )}
                      </div>
                    </div>

                    {winningOffer && (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        <Trophy size={16} className="text-emerald-500" />
                        <div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">{t('winnerBadge', 'Победитель')}</div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{winningOffer.supplier?.name}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Прикрепленные документы этого лота */}
                  {lot.files && lot.files.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mr-2">
                        <Paperclip size={13} className="text-emerald-600" />
                        <span>{t('lotDocuments', 'Документация лота')}:</span>
                      </div>
                      {lot.files.map((fileObj, fIdx) => {
                        const doc = fileObj.document || fileObj;
                        const cleanPath = (doc.filePath || `uploads/${doc.fileName || doc.name || ''}`).replace(/\\/g, '/');
                        const normalized = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
                        const fileUrl = doc.filePath && doc.filePath.startsWith('http') ? doc.filePath : `http://localhost:5000/${normalized.startsWith('uploads/') ? normalized : `uploads/${normalized}`}`;
                        return (
                          <a
                            key={doc.id || fIdx}
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs transition-colors"
                          >
                            <FileText size={12} className="text-emerald-600" />
                            <span className="truncate max-w-40">{doc.fileName || doc.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Таблица спецификаций лота */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={theme.tableHeaderBg}>
                          <th className="py-3 px-4 w-16 text-center">H/K</th>
                          <th className="py-3 px-4 text-center min-w-48">
                            {isWorks 
                              ? (t('workStages', 'Этап / вид работ')) 
                              : isServices 
                              ? (t('serviceName', 'Наименование услуги')) 
                              : (t('product', 'Товар'))}
                          </th>
                          <th className="py-3 px-4 text-center w-28">{t('unit', 'Ölçeg birligi')}</th>
                          {isGoods && <th className="py-3 px-4 text-center w-36">{t('manufacturer', 'Öndüriji')}</th>}
                          <th className="py-3 px-4 text-center w-28">
                            {isServices ? (t('volumePeriod', 'Объем / Период')) : t('quantity', 'Mukdar')}
                          </th>
                          <th className="py-3 px-4 text-center">
                            {isWorks 
                              ? (t('scopeOfWork', 'Состав и спецификация работ')) 
                              : isServices 
                              ? (t('serviceRegulations', 'Регламент и описание услуги')) 
                              : t('description', 'Mazmuny')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {(!lot.specs || lot.specs.length === 0) ? (
                          <tr>
                            <td colSpan={isGoods ? 6 : 5} className="py-6 text-center text-slate-400">
                              {isWorks 
                                ? (t('noWorkStagesInLot', 'В этом лоте нет этапов работ')) 
                                : isServices 
                                ? (t('noServicesInLot', 'В этом лоте нет позиций услуг')) 
                                : (t('noGoodsInLot', 'В этом лоте нет товаров'))}
                            </td>
                          </tr>
                        ) : lot.specs.map((spec, idx) => (
                          <tr key={idx} className={theme.tableRowHover}>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{safeString(spec?.positionNumber || idx + 1)}</td>
                            <td className="py-3.5 px-4 text-center font-medium">{safeString(spec?.generalProduct?.name || spec?.name)}</td>
                            <td className="py-3.5 px-4 text-center">{safeString(spec?.unit?.name || spec?.unit?.shortName)}</td>
                            {isGoods && <td className="py-3.5 px-4 text-center">{safeString(spec?.manufacturer?.name || '-')}</td>}
                            <td className="py-3.5 px-4 text-center font-bold">{safeString(spec?.quantity)}</td>
                            <td className="py-3.5 px-4 text-center w-auto min-w-60 whitespace-normal text-wrap text-slate-500">
                              {safeString(spec?.description)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className="font-bold text-base">{t('tenderSpecs', 'Товары/Спецификация')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={theme.tableHeaderBg}>
                    <th className="py-3 px-4 w-16 text-center">H/K</th>
                    <th className="py-3 px-4 text-center w-48">{t('product', 'Товар')}</th>
                    <th className="py-3 px-4 text-center w-28">{t('unit', 'Ölçeg birligi')}</th>
                    <th className="py-3 px-4 text-center w-36">{t('manufacturer', 'Öndüriji')}</th>
                    <th className="py-3 px-4 text-center w-24">{t('quantity', 'Mukdar')}</th>
                    <th className="py-3 px-4 text-center">{t('description', 'Mazmuny')}</th>
                    {data?.status === 'YENIJI_YGLAN_EDILDI' && <th className="py-3 px-4 text-center w-36">{t('winnerBadge', 'Победитель')}</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {data.specs.map((spec, idx) => {
                    // Fallback logic for old tenders without lots
                    let winningSupplier = null;
                    if (data.status === 'YENIJI_YGLAN_EDILDI' && data.offers) {
                      for (const offer of data.offers) {
                        const os = offer.specs.find(s => s.tenderSpecId === spec.id);
                        if (os && os.isAwarded) {
                          winningSupplier = offer.supplier?.name;
                          break;
                        }
                      }
                    }

                    return (
                      <tr key={idx} className={theme.tableRowHover}>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{safeString(spec?.positionNumber || idx + 1)}</td>
                        <td className="py-3.5 px-4 text-center font-medium">{safeString(spec?.generalProduct?.name || spec?.name)}</td>
                        <td className="py-3.5 px-4 text-center">{safeString(spec?.unit?.name || spec?.unit?.shortName)}</td>
                        <td className="py-3.5 px-4 text-center">{safeString(spec?.manufacturer?.name || '-')}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{safeString(spec?.quantity)}</td>
                        <td className="py-3.5 px-4 text-center w-auto min-w-60 whitespace-normal text-wrap text-slate-500">
                          {safeString(spec?.description)}
                        </td>
                        {data?.status === 'YENIJI_YGLAN_EDILDI' && (
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                            {winningSupplier ? (
                              <div className="flex items-center justify-center gap-1">
                                <Trophy size={14} /> <span>{winningSupplier}</span>
                              </div>
                            ) : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Таблица документов */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{t('documents', 'Документы')}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-48 text-center">{t('fileName', 'Faýl ady')}</th>
                <th className="py-3 px-4 text-center">{t('description', 'Mazmuny')}</th>
                <th className="py-3 px-4 text-center w-24">{t('type', 'Görnüşi')}</th>
                <th className="py-3 px-4 text-center w-24">{t('size', 'Ölçegi')}</th>
                <th className="py-3 px-4 text-center w-32">{t('uploadDate', 'Дата')}</th>
                <th className="py-3 px-4 text-center w-16">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {docsList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {t('noDocumentsAttached', 'Документы отсутствуют')}
                  </td>
                </tr>
              ) : docsList.map((doc, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 text-center font-semibold">{safeString(doc?.fileName || doc?.name)}</td>
                  <td className="py-3.5 px-4 text-center w-auto min-w-50 whitespace-normal text-wrap text-slate-500">{safeString(doc?.description)}</td>
                  <td className={`py-3.5 px-4 text-center font-bold ${theme.primaryText}`}>{safeString(doc?.fileType || doc?.type)}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">{safeString(doc?.size, '-')}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">{formatDate(doc?.createdAt)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-md hover:bg-slate-200/50 transition-colors" title="Скачать файл">
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
