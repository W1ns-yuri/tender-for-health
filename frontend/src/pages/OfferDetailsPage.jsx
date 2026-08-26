import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Package, DollarSign, Calendar, MapPin, Building2, Box, Download } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';

export default function OfferDetailsPage({ role, lang = 'RU', isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/offers/${id}`);
        setOffer(res.data);
      } catch (err) {
        console.error('Failed to fetch offer', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id]);

  const bgClass = isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (loading) {
    return (
      <div className={`p-6 flex-1 flex justify-center items-center h-full ${bgClass}`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.primaryBorder}`}></div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className={`p-6 flex-1 ${bgClass}`}>
        <div className="text-center py-10 text-slate-500 text-lg">Предложение не найдено</div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto ${bgClass} space-y-6 w-full`}>
      {/* Шапка предложения */}
      <div className={`rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center ${cardBg}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Заявка № {offer.number || 'Без номера'}</h1>
            {getStatusBadge(offer.status, lang, isDarkMode)}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(offer.createdAt).toLocaleDateString('ru-RU')}</span>
            <span className="flex items-center"><Building2 size={14} className="mr-1" /> {safeString(offer.supplier?.name)}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Сумма предложения</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${theme.primaryText}`}>{offer.offeredPrice.toLocaleString()}</span>
            <span className="text-lg font-bold text-slate-400">{offer.baseCurrency?.code}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Инфо о тендере */}
        <div className={`rounded-2xl shadow-sm border p-6 space-y-4 md:col-span-1 ${cardBg}`}>
          <h3 className="font-bold text-lg border-b border-slate-100/10 pb-3">Связанный тендер</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500 font-medium mb-1">Лот</p>
              <p className="font-semibold">{offer.tender?.tenderNumber}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Название</p>
              <p className={`font-semibold hover:underline cursor-pointer ${theme.primaryText}`} onClick={() => navigate(`/tender-details/${offer.tender?.id}`)}>
                {offer.tender?.title || 'Нет названия'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Тип тендера</p>
              {getTypeBadge(offer.tender?.type, lang, isDarkMode)}
            </div>
          </div>
        </div>

        {/* Условия предложения */}
        <div className={`rounded-2xl shadow-sm border p-6 space-y-4 md:col-span-2 ${cardBg}`}>
          <h3 className="font-bold text-lg border-b border-slate-100/10 pb-3">Условия оплаты и поставки</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-500 font-medium mb-2 flex items-center gap-2"><DollarSign size={16}/> Условия оплаты</p>
              <p className="font-semibold leading-relaxed">{offer.paymentTerms || 'Не указаны'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-2 flex items-center gap-2"><MapPin size={16}/> Условия поставки</p>
              <p className="font-semibold leading-relaxed">Согласно базовым условиям тендера (DDP/CIP)</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-500 font-medium mb-2 flex items-center gap-2"><FileText size={16}/> Комментарий от поставщика</p>
              <p className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg italic">
                {offer.comment || 'Нет комментариев'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Спецификации / Предложенные товары */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${cardBg}`}>
        <div className="p-4 md:p-6 border-b border-slate-100/10 flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Package size={20} className={theme.primaryText} />
            Спецификация (Предложенные товары)
          </h3>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold">
            {offer.specs?.length || 0} позиций
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">Наименование товара/услуги</th>
                <th className="py-3 px-4 text-center">Ед. изм.</th>
                <th className="py-3 px-4 text-right">Кол-во</th>
                <th className="py-3 px-4 text-right">Цена за ед.</th>
                <th className="py-3 px-4 text-right font-bold">Сумма</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {!offer.specs || offer.specs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Товары не добавлены</td>
                </tr>
              ) : (
                offer.specs.map((spec, index) => (
                  <tr key={spec.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold">{spec.tenderSpec?.generalProduct?.name || spec.name || 'Неизвестный товар'}</p>
                      {spec.description && (
                        <p className="text-xs text-slate-500 mt-1">Описание: {spec.description}</p>
                      )}
                      {spec.manufacturer && (
                        <p className="text-xs text-slate-500 mt-1">Производитель: {spec.manufacturer}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">{spec.unit || 'шт'}</td>
                    <td className="py-4 px-4 text-right font-medium">{spec.quantity}</td>
                    <td className="py-4 px-4 text-right font-medium">
                      {(spec.unitPrice || 0).toLocaleString()} <span className="text-xs text-slate-400">{offer.baseCurrency?.code}</span>
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${theme.primaryText}`}>
                      {((spec.unitPrice || 0) * (spec.quantity || 0)).toLocaleString()} <span className="text-xs text-slate-400">{offer.baseCurrency?.code}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Прикрепленные документы */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${cardBg}`}>
        <div className="px-6 py-4 border-b border-slate-100/10 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-lg">{t('attachedDocuments', 'Прикрепленные документы')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">{t('fileName', 'Имя файла')}</th>
                <th className="py-3 px-4 text-center">{t('type', 'Тип')}</th>
                <th className="py-3 px-4 text-center">{t('date', 'Дата загрузки')}</th>
                <th className="py-3 px-4 text-center w-24">{t('action', 'Действие')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {!offer.files || offer.files.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">Документы не прикреплены</td>
                </tr>
              ) : (
                offer.files.map((fileObj, index) => {
                  const doc = fileObj.document;
                  if (!doc) return null;
                  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : '-';
                  const baseUrl = API.defaults?.baseURL?.replace('/api', '') || 'http://localhost:5000';
                  const uniqueFileName = doc.filePath ? doc.filePath.split(/[\\/]/).pop() : (doc.fileName || doc.name);
                  const fileUrl = `${baseUrl}/uploads/${uniqueFileName}`;

                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className={`py-4 px-4 font-bold hover:underline cursor-pointer ${theme.primaryText}`} onClick={() => window.open(fileUrl, '_blank')}>
                        {safeString(doc.fileName || doc.name)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.fileType?.includes('pdf') ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                          {safeString(doc.fileType)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-500">{dateStr}</td>
                      <td className="py-4 px-4 text-center">
                        <button onClick={() => window.open(fileUrl, '_blank')} className={`${theme.primaryText} hover:opacity-80 transition-all p-2 bg-slate-100 dark:bg-slate-800 rounded-full`}>
                          <Download size={18} />
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

    </div>
  );
}
