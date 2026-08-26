import React, { useState, useEffect } from 'react';
import { Download, Calendar, User, Tag, Clock, Users, LayoutGrid } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function TenderDetails({ tenderId, onNavigate, role, isDarkMode, lang = 'RU' }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const activeTenderId = tenderId || paramId;
  const [tender, setTender] = useState(null);
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
  }, [activeTenderId]);

  const data = tender || {};

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    if (typeof dateVal === 'string' && /^\d{2}\.\d{2}\.\d{4}/.test(dateVal)) return dateVal;
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return '-';
    }
  };

  const getClientName = (d) => {
    if (d?.client?.name) return d.client.name;
  if (d?.createdBy?.firstName) return `${d.createdBy.firstName} ${d.createdBy.lastName || ''}`.trim();
    return safeString(d?.client, '-');
  };

  const getCategoryName = (d) => {
    if (d?.category?.name) return d.category.name;
    return safeString(d?.category, '-');
  };

  const handleDownload = (doc) => {
    // API.defaults.baseURL is usually http://localhost:5000/api
    const baseUrl = API.defaults.baseURL.replace('/api', '');
    const actualFileName = doc.filePath ? doc.filePath.split(/[\\/]/).pop() : (doc.fileName || doc.name);
    const fileUrl = `${baseUrl}/uploads/${actualFileName}`;
    window.open(fileUrl, '_blank');
  };

  const specsList = Array.isArray(data?.specs) ? data.specs : [];
  const docsList = Array.isArray(data?.files) ? data.files.map(f => f.document).filter(Boolean) : [];

  if (!tender) {
    return <div className="text-center py-10 text-slate-500">{t('loading', 'Загрузка...')}</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Главная карточка деталей */}
      <div className={`p-6 rounded-xl border shadow-xs ${theme.cardBg}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${theme.primaryText}`}>{safeString(data?.tenderNumber)}</h1>
            <p className={`text-sm font-medium mt-1 ${theme.subText}`}>{safeString(data?.title)}</p>
          </div>
          {role === 'SUPPLIER' && (
            data?.offers?.length > 0 ? (
              <button
                disabled
                className={`px-5 py-2 rounded-lg font-semibold text-sm shadow-md transition-all opacity-50 cursor-not-allowed ${theme.primaryBtn}`}
                title={t('alreadySubmitted', 'Вы уже подали заявку на этот тендер')}
              >
                {t('offerSubmitted', 'Teklip tabşyryldy')}
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
              {data?.visibility === 'YAPYK' ? (lang === 'RU' ? 'Закрытый' : 'Ýapyk') : (lang === 'RU' ? 'Открытый' : 'Açyk')}
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
            <span>{lang === 'RU' ? 'Категория' : 'Kategoriýa'}: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>{getCategoryName(data)}</strong></span>
          </div>
        </div>

        {/* Mazmuny */}
        <div className="mt-6">
          <h4 className={`text-base font-bold mb-1 ${theme.primaryText}`}>{t('description', 'Mazmuny')}:</h4>
          <div className={`text-sm leading-relaxed whitespace-normal break-words ${theme.primaryText} ${isDarkMode ? 'opacity-90' : 'text-slate-700'}`}>
            {safeString(data?.description)}
          </div>
        </div>

        {/* Tehniki şartler */}
        <div className="mt-6">
          <h4 className={`text-base font-bold mb-1 ${theme.primaryText}`}>{t('technicalSpecs', 'Tehniki şartler')}:</h4>
          <div className={`text-sm leading-relaxed whitespace-normal break-words ${theme.primaryText} ${isDarkMode ? 'opacity-90' : 'text-slate-700'}`}>
            {safeString(data?.technicalSpecs)}
          </div>
        </div>
      </div>

      {/* 3. Таблица спецификаций */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{lang === 'RU' ? 'Товары/Спецификация' : 'Tender spesifikasiýasy'}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3 px-4 w-16 text-center">H/K</th>
                <th className="py-3 px-4 text-center w-48">{lang === 'RU' ? 'Товар' : 'Haryt'}</th>
                <th className="py-3 px-4 text-center w-28">{t('unit', 'Ölçeg birligi')}</th>
                <th className="py-3 px-4 text-center w-36">{t('manufacturer', 'Öndüriji')}</th>
                <th className="py-3 px-4 text-center w-24">{t('quantity', 'Mukdar')}</th>
                <th className="py-3 px-4 text-center">{t('description', 'Mazmuny')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {specsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    {lang === 'RU' ? 'Нет спецификаций' : 'Spesifikasiýa ýok'}
                  </td>
                </tr>
              ) : specsList.map((spec, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{safeString(spec?.positionNumber || idx + 1)}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{safeString(spec?.generalProduct?.name || spec?.name)}</td>
                  <td className="py-3.5 px-4 text-center">{safeString(spec?.unit?.name || spec?.unit?.shortName)}</td>
                  <td className="py-3.5 px-4 text-center">{safeString(spec?.manufacturer?.name || '-')}</td>
                  <td className="py-3.5 px-4 text-center font-bold">{safeString(spec?.quantity)}</td>
                  <td className="py-3.5 px-4 text-center w-auto min-w-[240px] whitespace-normal break-words text-slate-500">
                    {safeString(spec?.description)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Таблица документов */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{lang === 'RU' ? 'Документы' : 'Resminamalar'}</h3>
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
                <th className="py-3 px-4 text-center w-32">{lang === 'RU' ? 'Дата' : 'Ýüklenen senesi'}</th>
                <th className="py-3 px-4 text-center w-16">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {docsList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {lang === 'RU' ? 'Документы отсутствуют' : 'Resminama ýok'}
                  </td>
                </tr>
              ) : docsList.map((doc, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 text-center font-semibold">{safeString(doc?.fileName || doc?.name)}</td>
                  <td className="py-3.5 px-4 text-center w-auto min-w-[200px] whitespace-normal break-words text-slate-500">{safeString(doc?.description)}</td>
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
