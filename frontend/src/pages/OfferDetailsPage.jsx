import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Package, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building2, 
  Download, 
  Clock, 
  Users, 
  Tag, 
  CheckCircle2,
  Trophy,
  Layers
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';

export default function OfferDetailsPage({ role, lang = 'RU', isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';

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
    if (id) fetchOffer();
  }, [id]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return '-';
    }
  };

  const handleDownload = (doc) => {
    const baseUrl = API.defaults?.baseURL?.replace('/api', '') || 'http://localhost:5000';
    const actualFileName = doc.filePath ? doc.filePath.split(/[\\/]/).pop() : (doc.fileName || doc.name);
    const fileUrl = `${baseUrl}/uploads/${actualFileName}`;
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center justify-center space-y-3">
        <div className={`w-8 h-8 border-3 rounded-full animate-spin border-t-transparent ${isAdmin ? 'border-teal-600' : 'border-[#1e3a8a]'}`} />
        <span>{t('loading', 'Загрузка данных заявки...')}</span>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className={`p-12 rounded-xl border text-center text-slate-500 ${theme.cardBg}`}>
        <p className="text-base font-semibold">{lang === 'RU' ? 'Коммерческое предложение не найдено' : 'Teklip tapylmady'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
        >
          {lang === 'RU' ? 'Вернуться назад' : 'Yza gaýt'}
        </button>
      </div>
    );
  }

  const currencyCode = offer.baseCurrency?.code || 'TMT';
  const supplierName = offer.supplier?.name || (offer.supplier?.user?.username) || '-';
  const tenderNumber = offer.tender?.tenderNumber || '-';
  const tenderTitle = offer.tender?.title || '-';

  // 🟢 Группировка спецификаций по Лотам
  const rawSpecs = offer.specs || [];
  const lotsMap = {};
  const unassignedSpecs = [];

  rawSpecs.forEach(spec => {
    const lot = spec.tenderSpec?.lot;
    if (lot && lot.id) {
      if (!lotsMap[lot.id]) {
        lotsMap[lot.id] = {
          lot: lot,
          specs: []
        };
      }
      lotsMap[lot.id].specs.push(spec);
    } else {
      unassignedSpecs.push(spec);
    }
  });

  const lotGroups = Object.values(lotsMap);

  return (
    <div className="space-y-6 pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-2"
      >
        <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
      </button>

      {/* 1. Главная карточка деталей коммерческого предложения */}
      <div className={`p-6 rounded-xl border shadow-xs ${theme.cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-2xl font-bold tracking-tight ${theme.primaryText}`}>
                {offer.number || `OFFER-${offer.id.slice(0, 8)}`}
              </h1>
              {getStatusBadge(offer.status, lang, isDarkMode)}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="opacity-70" />
                <span className="text-slate-400">{lang === 'RU' ? 'Дата подачи:' : 'Tabşyrylan senesi:'}</span>
                <strong className="text-slate-700 dark:text-slate-200 font-semibold">{formatDate(offer.createdAt)}</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <Building2 size={14} className="opacity-70" />
                <span className="text-slate-400">{lang === 'RU' ? 'Поставщик:' : 'Üpjün ediji:'}</span>
                <strong className="text-slate-700 dark:text-slate-200 font-semibold">{supplierName}</strong>
              </span>

              {offer.supplier?.country?.name && (
                <span className="text-slate-400">
                  ({offer.supplier.country.name})
                </span>
              )}
            </div>
          </div>

          {/* Виджет общей суммы предложения */}
          <div className={`shrink-0 px-5 py-3.5 rounded-xl border text-right shadow-xs ${
            isAdmin
              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-700 dark:text-teal-300'
              : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-[#1e3a8a] dark:text-blue-300'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              isAdmin ? 'text-teal-700 dark:text-teal-300' : 'text-[#1e3a8a] dark:text-blue-300'
            }`}>
              {lang === 'RU' ? 'Сумма предложения' : 'Teklip bahasy'}
            </span>
            <div className={`text-2xl font-black my-0.5 whitespace-nowrap ${
              isAdmin ? 'text-teal-700 dark:text-teal-300' : 'text-[#1e3a8a] dark:text-blue-300'
            }`}>
              {(offer.offeredPrice || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={13} className={isAdmin ? "text-teal-600" : "text-blue-600"} />
              <span>{rawSpecs.length} {lang === 'RU' ? 'позиций в заявке' : 'pozisiýa'}</span>
            </div>
          </div>
        </div>

        {/* Информационные блоки: Связанный тендер и Условия предложения */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Блок 1: Данные о тендере */}
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText size={16} className={theme.primaryText} />
              <span>{lang === 'RU' ? 'Связанный тендер' : 'Degişli tender'}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Номер тендера:' : 'Tender belgisi:'}</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200">{tenderNumber}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Предмет тендера:' : 'Tender ady:'}</span>
                <span 
                  onClick={() => offer.tender?.id && navigate(`/tender-details/${offer.tender.id}`)}
                  className={`font-bold text-right hover:underline cursor-pointer transition-colors max-w-xs ${theme.primaryText}`}
                >
                  {tenderTitle}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Тип закупки:' : 'Görnüşi:'}</span>
                <div>{getTypeBadge(offer.tender?.type, lang, isDarkMode)}</div>
              </div>
            </div>
          </div>

          {/* Блок 2: Условия оплаты и общие комментарии */}
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin size={16} className={theme.primaryText} />
              <span>{lang === 'RU' ? 'Условия оплаты и поставки' : 'Töleg we eltip beriş şertleri'}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Условие поставки (общее):' : 'Eltip beriş şerti:'}</span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold border ${
                  isAdmin
                    ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                    : 'bg-blue-100 dark:bg-blue-950/70 text-[#1e3a8a] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}>
                  {offer.deliveryTerm ? `${offer.deliveryTerm.shortName} — ${offer.deliveryTerm.name}` : (lang === 'RU' ? 'По лотам' : 'Lotlar boýunça')}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Условия оплаты:' : 'Töleg şertleri:'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{offer.paymentTerms || (lang === 'RU' ? 'Не указаны' : 'Görkezilmedik')}</span>
              </div>

              {offer.comment && (
                <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block mb-0.5">{lang === 'RU' ? 'Примечание поставщика:' : 'Bellik:'}</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">{offer.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Спецификация коммерческого предложения с разбивкой по лотам */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className={theme.primaryText} />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {lang === 'RU' ? 'Предложенные товары по лотам' : 'Lotlar boýunça harytlar'}
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isAdmin
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
              : 'bg-blue-100 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300'
          }`}>
            {lang === 'RU' ? `Лотов: ${lotGroups.length || 1} | Позиций: ${rawSpecs.length}` : `Lot: ${lotGroups.length || 1} | Haryt: ${rawSpecs.length}`}
          </span>
        </div>

        {/* Если есть лоты - рендерим каждый лот отдельной карточкой */}
        {lotGroups.length > 0 ? (
          lotGroups.map((group, groupIdx) => {
            const lotTotal = group.specs.reduce((acc, s) => acc + ((s.unitPrice || 0) * (s.quantity || 0)), 0);
            const lotDeliveryTerm = group.lot?.deliveryTerm?.shortName 
              ? `${group.lot.deliveryTerm.shortName} — ${group.lot.deliveryTerm.name}`
              : (offer.deliveryTerm ? `${offer.deliveryTerm.shortName} — ${offer.deliveryTerm.name}` : null);

            return (
              <div key={group.lot.id || groupIdx} className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
                {/* Шапка конкретного лота */}
                <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
                }`}>
                  <div className="flex items-center gap-3">
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                      {lang === 'RU' ? 'Лот' : 'Lot'} #{groupIdx + 1}: {group.lot.name}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {lotDeliveryTerm && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 font-medium">{lang === 'RU' ? 'Условие поставки:' : 'Şerti:'}</span>
                        <strong className={`px-2.5 py-0.5 rounded-md font-bold border ${
                          isAdmin
                            ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : 'bg-blue-100 dark:bg-blue-950/70 text-[#1e3a8a] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}>
                          {lotDeliveryTerm}
                        </strong>
                      </div>
                    )}

                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        {lang === 'RU' ? 'Итого по лоту' : 'Lot jemi'}
                      </span>
                      <span className={`text-base font-black ${theme.primaryText}`}>
                        {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Таблица спецификации по этому лоту */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`font-semibold ${theme.tableHeaderBg}`}>
                        <th className="py-2.5 px-3 w-12 text-center">H/K</th>
                        <th className="py-2.5 px-3 min-w-[240px]">{lang === 'RU' ? 'Наименование предложенного товара' : 'Harydyň ady'}</th>
                        <th className="py-2.5 px-3 min-w-[180px]">{lang === 'RU' ? 'Производитель / Модель' : 'Öndüriji'}</th>
                        <th className="py-2.5 px-3 w-28 text-center">{lang === 'RU' ? 'Ед. изм.' : 'Ölçeg birligi'}</th>
                        <th className="py-2.5 px-3 w-28 text-center">{lang === 'RU' ? 'Количество' : 'Mukdary'}</th>
                        <th className="py-2.5 px-3 w-36 text-center">{lang === 'RU' ? `Цена за ед. (${currencyCode})` : 'Birlik bahasy'}</th>
                        <th className="py-2.5 px-3 w-36 text-right">{lang === 'RU' ? `Сумма (${currencyCode})` : 'Jemi baha'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {group.specs.map((spec, index) => {
                        const mfr = spec.manufacturer?.name || spec.tenderSpec?.manufacturer?.name || (typeof spec.manufacturer === 'string' ? spec.manufacturer : null);
                        const unitStr = spec.unit?.shortName || spec.unit?.name || spec.tenderSpec?.unit?.shortName || spec.tenderSpec?.unit?.name || (typeof spec.unit === 'string' ? spec.unit : 'шт');
                        const itemPrice = spec.unitPrice || 0;
                        const itemQty = spec.quantity || 0;
                        const lineTotal = itemPrice * itemQty;
                        const productName = spec.name || spec.tenderSpec?.generalProduct?.name || spec.tenderSpec?.name || (lang === 'RU' ? 'Товар' : 'Haryt');

                        return (
                          <tr key={spec.id || index} className={`${theme.tableRowHover} transition-colors`}>
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                {productName}
                              </div>
                              {spec.description && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                                  {spec.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              {mfr || '—'}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-bold">
                              {unitStr}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100">
                              {itemQty}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {itemPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`py-3 px-3 text-right font-black text-sm ${theme.primaryText}`}>
                              {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          /* Стандартная таблица если тендер без лотов */
          <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`font-semibold ${theme.tableHeaderBg}`}>
                    <th className="py-2.5 px-3 w-12 text-center">H/K</th>
                    <th className="py-2.5 px-3 min-w-[240px]">{lang === 'RU' ? 'Наименование предложенного товара' : 'Harydyň ady'}</th>
                    <th className="py-2.5 px-3 min-w-[180px]">{lang === 'RU' ? 'Производитель / Модель' : 'Öndüriji'}</th>
                    <th className="py-2.5 px-3 w-28 text-center">{lang === 'RU' ? 'Ед. изм.' : 'Ölçeg birligi'}</th>
                    <th className="py-2.5 px-3 w-28 text-center">{lang === 'RU' ? 'Количество' : 'Mukdary'}</th>
                    <th className="py-2.5 px-3 w-36 text-center">{lang === 'RU' ? `Цена за ед. (${currencyCode})` : 'Birlik bahasy'}</th>
                    <th className="py-2.5 px-3 w-36 text-right">{lang === 'RU' ? `Сумма (${currencyCode})` : 'Jemi baha'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {rawSpecs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        {lang === 'RU' ? 'В предложении нет позиций' : 'Haryt ýok'}
                      </td>
                    </tr>
                  ) : (
                    rawSpecs.map((spec, index) => {
                      const mfr = spec.manufacturer?.name || spec.tenderSpec?.manufacturer?.name || (typeof spec.manufacturer === 'string' ? spec.manufacturer : null);
                      const unitStr = spec.unit?.shortName || spec.unit?.name || spec.tenderSpec?.unit?.shortName || spec.tenderSpec?.unit?.name || (typeof spec.unit === 'string' ? spec.unit : 'шт');
                      const itemPrice = spec.unitPrice || 0;
                      const itemQty = spec.quantity || 0;
                      const lineTotal = itemPrice * itemQty;
                      const productName = spec.name || spec.tenderSpec?.generalProduct?.name || spec.tenderSpec?.name || (lang === 'RU' ? 'Товар' : 'Haryt');

                      return (
                        <tr key={spec.id || index} className={`${theme.tableRowHover} transition-colors`}>
                          <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {productName}
                            </div>
                            {spec.description && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                                {spec.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                            {mfr || '—'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-bold">
                            {unitStr}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100">
                            {itemQty}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {itemPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-3 text-right font-black text-sm ${theme.primaryText}`}>
                            {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Нераспределенные позиции, если таковые есть */}
        {unassignedSpecs.length > 0 && lotGroups.length > 0 && (
          <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className="p-3 border-b bg-slate-50 dark:bg-slate-900 font-bold text-xs">
              {lang === 'RU' ? 'Дополнительные позиции' : 'Goşmaça harytlar'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {unassignedSpecs.map((spec, index) => {
                    const itemPrice = spec.unitPrice || 0;
                    const itemQty = spec.quantity || 0;
                    const lineTotal = itemPrice * itemQty;
                    const productName = spec.name || spec.tenderSpec?.generalProduct?.name || spec.tenderSpec?.name || (lang === 'RU' ? 'Товар' : 'Haryt');

                    return (
                      <tr key={spec.id || index} className={`${theme.tableRowHover} transition-colors`}>
                        <td className="py-3 px-3 text-center font-bold text-slate-400 w-12">{index + 1}</td>
                        <td className="py-3 px-3 min-w-[240px] font-bold text-slate-800 dark:text-slate-100">{productName}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600 w-28">{spec.unit?.shortName || 'шт'}</td>
                        <td className="py-3 px-3 text-center font-black text-slate-800 w-28">{itemQty}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 w-36">{itemPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-3 text-right font-black text-sm w-36 ${theme.primaryText}`}>{lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Общая плашка итога по всему коммерческому предложению */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
            {lang === 'RU' ? 'Итоговая стоимость коммерческого предложения:' : 'Jemi teklip bahasy:'}
          </span>
          <span className={`text-xl font-black ${theme.primaryText}`}>
            {(offer.offeredPrice || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
          </span>
        </div>
      </div>

      {/* 3. Прикрепленные документы коммерческого предложения */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <FileText size={18} className={theme.primaryText} />
            <h3 className="font-bold text-base">{t('attachedDocuments', 'Прикрепленные документы')}</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {offer.files?.length || 0} {lang === 'RU' ? 'файлов' : 'faýl'}
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
              {!offer.files || offer.files.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    {lang === 'RU' ? 'Документы не прикреплены к заявке' : 'Resminama goşulmady'}
                  </td>
                </tr>
              ) : (
                offer.files.map((fileObj, index) => {
                  const doc = fileObj.document;
                  if (!doc) return null;
                  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : '-';

                  return (
                    <tr key={index} className={`${theme.tableRowHover} transition-colors`}>
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {safeString(doc.fileName || doc.name)}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${theme.primaryText}`}>
                        {safeString(doc.fileType || 'DOC')}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">{dateStr}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDownload(doc)}
                          className={`p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 inline-flex transition-colors ${theme.primaryText}`}
                          title="Скачать документ"
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
    </div>
  );
}
