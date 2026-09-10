import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  AlertCircle, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Package,
  Layers,
  CornerDownRight
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString } from '../utils/themeUtils';

export default function CreateOfferPage({ role = 'SUPPLIER', isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(true);

  // Справочники с API
  const [currencies, setCurrencies] = useState([]);
  const [deliveryTerms, setDeliveryTermsList] = useState([]);

  // Поля коммерческого предложения
  const [currency, setCurrency] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(lang === 'RU' ? '100% оплата' : '100% töleg');
  const [comment, setComment] = useState('');

  // Выбранные лоты и условия поставки по каждому лоту
  const [selectedLots, setSelectedLots] = useState({}); // { [lotId]: boolean }
  const [lotDeliveryTerms, setLotDeliveryTerms] = useState({}); // { [lotId]: deliveryTermId }
  
  // Позиции предложения: { [lotId]: [{ tenderSpecId, requestedName, haryt, brand, unit, mukdar, price, desc }] }
  const [offerItemsByLot, setOfferItemsByLot] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    Promise.all([
      API.get(`/tenders/${id}`),
      API.get('/catalogs/currencies').catch(() => ({ data: [] })),
      API.get('/catalogs/delivery-terms').catch(() => ({ data: [] })),
      API.get('/auth/me').catch(() => ({ data: null }))
    ]).then(([tenderRes, currRes, dtRes, meRes]) => {
      
      if (role === 'SUPPLIER' && meRes.data?.suppliers?.[0]) {
          if (meRes.data.suppliers[0].verificationStatus !== 'VERIFIED') {
              setIsVerified(false);
          }
      }

      const tenderData = tenderRes.data;
      setTender(tenderData);

      const loadedCurrencies = Array.isArray(currRes.data) ? currRes.data.filter(c => c.isActive) : [];
      setCurrencies(loadedCurrencies);
      if (loadedCurrencies.length > 0) {
        setCurrency(loadedCurrencies[0].id);
      }

      const loadedDT = Array.isArray(dtRes.data) ? dtRes.data.filter(c => c.isActive) : [];
      setDeliveryTermsList(loadedDT);

      if (tenderData?.lots) {
        const initialSelectedLots = {};
        const initialLotDT = {};
        const initialOfferItems = {};
        
        tenderData.lots.forEach(lot => {
          initialSelectedLots[lot.id] = true;
          initialLotDT[lot.id] = lot.deliveryTermId || (loadedDT.length > 0 ? loadedDT[0].id : '');
          
          initialOfferItems[lot.id] = (lot.specs || []).map((spec, idx) => ({
            tenderSpecId: spec.id,
            lotId: lot.id,
            positionNumber: spec.positionNumber || idx + 1,
            requestedName: spec.generalProduct?.name || spec.name || '',
            requestedUnit: spec.unit?.name || spec.unit?.shortName || '',
            requestedQty: spec.quantity || 1,
            requestedBrand: spec.manufacturer?.name || '',
            requestedDesc: spec.description || '',
            // Поля предложения поставщика (предзаполнены запросом заказчика)
            haryt: spec.generalProduct?.name || spec.name || '',
            brand: spec.manufacturer?.name || '',
            unit: spec.unit?.name || spec.unit?.shortName || '',
            unitId: spec.unitId || null,
            mukdar: spec.quantity || 1,
            price: 0,
            desc: ''
          }));
        });
        
        setSelectedLots(initialSelectedLots);
        setLotDeliveryTerms(initialLotDT);
        setOfferItemsByLot(initialOfferItems);
      }
    })
      .catch(e => {
        console.error(e);
        setErrorMsg(lang === 'RU' ? 'Ошибка загрузки данных тендера' : 'Tender maglumatlary ýüklenmedi');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const res = await API.post('/documents/upload', formData);
      setUploadedFiles(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      alert(lang === 'RU' ? 'Ошибка загрузки файла' : 'Faýl ýüklemekde ýalňyşlyk');
    }
    
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSpecFieldChange = (lotId, specIdx, field, value) => {
    setOfferItemsByLot(prev => {
      const lotItems = [...(prev[lotId] || [])];
      lotItems[specIdx] = {
        ...lotItems[specIdx],
        [field]: value
      };
      return { ...prev, [lotId]: lotItems };
    });
  };

  const toggleLotSelection = (lotId) => {
    setSelectedLots(prev => ({ ...prev, [lotId]: !prev[lotId] }));
  };

  const selectedCurrencyObj = currencies.find(c => c.id === currency);
  const currencyCode = selectedCurrencyObj ? selectedCurrencyObj.code : 'TMT';

  const calculateLotTotal = (lotId) => {
    const items = offerItemsByLot[lotId] || [];
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.mukdar) || 0;
      const pr = parseFloat(item.price) || 0;
      return sum + (qty * pr);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return Object.keys(selectedLots)
      .filter(lotId => selectedLots[lotId])
      .reduce((sum, lotId) => sum + calculateLotTotal(lotId), 0);
  };

  // Статистика заполненности предложения
  const activeLotIds = Object.keys(selectedLots).filter(lotId => selectedLots[lotId]);
  const allActiveItems = activeLotIds.flatMap(lotId => offerItemsByLot[lotId] || []);
  const pricedItemsCount = allActiveItems.filter(item => parseFloat(item.price) > 0).length;
  const totalActiveItemsCount = allActiveItems.length;

  const scrollToError = () => {
    setTimeout(() => {
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleSubmitOffer = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // 1. Проверка выбора хотя бы одного лота
    if (activeLotIds.length === 0) {
      setErrorMsg(lang === 'RU' 
        ? 'Пожалуйста, выберите хотя бы один лот для участия в тендере' 
        : 'Gatnaşmak üçin iň bolmanda bir lot saýlaň'
      );
      scrollToError();
      return;
    }

    // 2. Строгая проверка на непустое предложение (хотя бы один товар с ценой > 0)
    const specsWithPrices = allActiveItems.filter(item => parseFloat(item.price) > 0);
    if (specsWithPrices.length === 0) {
      setErrorMsg(lang === 'RU' 
        ? 'Вы не указали цену ни для одного товара! Введите цены в поле "Цена за ед." для отправки предложения.' 
        : 'Harytlaryň bahasyny giriziň! Teklip bahasy 0 bolup bilmeýär.'
      );
      scrollToError();
      return;
    }

    // 3. Проверка: нет ли выбранных позиций с ценой 0 в активных лотах
    const unpricedItems = allActiveItems.filter(item => !item.price || parseFloat(item.price) <= 0);
    if (unpricedItems.length > 0) {
      const confirmSend = window.confirm(lang === 'RU'
        ? `Внимание: для ${unpricedItems.length} поз. не указана цена. Вы хотите отправить предложение только по ${specsWithPrices.length} оцененным позициям?`
        : `Üns beriň: ${unpricedItems.length} haryt üçin baha girizilmedi. Diňe baha berlen harytlary ibermek isleýärsiňizmi?`
      );
      if (!confirmSend) return;
    }

    const specsToSubmit = specsWithPrices.map(item => ({
      tenderSpecId: item.tenderSpecId,
      name: item.haryt || item.requestedName,
      quantity: parseFloat(item.mukdar) || 1,
      unitPrice: parseFloat(item.price) || 0,
      description: item.desc || null,
      unitId: item.unitId || null
    }));

    const primaryDeliveryTermId = lotDeliveryTerms[activeLotIds[0]] || null;

    setIsSubmitting(true);
    try {
      await API.post('/offers', {
        tenderId: id,
        deliveryTermId: primaryDeliveryTermId,
        baseCurrencyId: currency || null,
        paymentTerms: paymentTerms.trim() || (lang === 'RU' ? '100% оплата' : '100% töleg'),
        comment,
        attachedDocumentIds: uploadedFiles.map(f => f.id).filter(Boolean),
        specs: specsToSubmit
      });

      alert(`✅ ${lang === 'RU' ? 'Коммерческое предложение успешно отправлено!' : 'Teklip üstünlikli iberildi!'}`);
      navigate('/offers');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.details || err.message || 'Ошибка отправки предложения');
      scrollToError();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <span>{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  const grandTotal = calculateGrandTotal();

  return (
    <div className="space-y-6 pb-6 text-sm">
      {/* 1. Верхняя навигация и заголовок */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-black tracking-tight ${theme.primaryText}`}>
            {lang === 'RU' ? 'Подача коммерческого предложения' : 'Tender teklibi tabşyrmak'}
          </h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 font-mono">
            {tender?.tenderNumber}
          </span>
        </div>
      </div>

      {/* 2. Карточка тендера и Информационный блок */}
      <div className={`p-6 rounded-2xl border shadow-xs ${theme.cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{tender?.title}</h2>
            {tender?.description && (
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">{tender.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 font-medium pt-1">
              {tender?.client?.name && (
                <span>
                  <span className="text-slate-400">{lang === 'RU' ? 'Заказчик:' : 'Sargyt ediji:'}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{tender.client.name}</strong>
                </span>
              )}
              {tender?.deadline && (
                <span>
                  <span className="text-slate-400">{lang === 'RU' ? 'Срок подачи до:' : 'Soňky möhleti:'}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{new Date(tender.deadline).toLocaleDateString('ru-RU')}</strong>
                </span>
              )}
              <span>
                <span className="text-slate-400">{lang === 'RU' ? 'Статус:' : 'Status:'}</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{lang === 'RU' ? 'Прием заявок открыт' : 'Açyk'}</strong>
              </span>
            </div>
          </div>

          {/* Виджет итоговой суммы предложения (компактный, расширяется по контенту) */}
          <div className="shrink-0 px-5 py-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-right shadow-xs">
            <span className="text-[11px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase tracking-wider block">
              {lang === 'RU' ? 'Итоговая стоимость заявки' : 'Jemi teklip bahasy'}
            </span>
            <div className="text-xl font-black text-[#1e3a8a] dark:text-blue-300 my-0.5 whitespace-nowrap">
              {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={13} className={pricedItemsCount > 0 ? "text-emerald-600" : "text-slate-400"} />
              <span>{lang === 'RU' ? `Оценено: ${pricedItemsCount} из ${totalActiveItemsCount} позиций` : `${pricedItemsCount} / ${totalActiveItemsCount} haryt`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Основные параметры вашего предложения */}
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${theme.cardBg}`}>
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {lang === 'RU' ? 'Основные параметры вашего предложения' : 'Teklibiň esasy şertleri'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-1">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('currency', 'Валюта предложения')}*
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border font-bold ${theme.inputBg}`}
            >
              {currencies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.flag || ''} {c.code} — {c.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {lang === 'RU' ? 'Цены по всем лотам будут рассчитаны в этой валюте' : 'Bahalar şu walýutada hasaplanar'}
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {lang === 'RU' ? 'Условия оплаты' : 'Töleg şertleri'}
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {lang === 'RU' ? 'Срок действия предложения / Примечание' : 'Bellikler'}
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs ${theme.inputBg}`}
            />
          </div>
        </div>
      </div>

      {/* 4. Таблицы по лотам с двухуровневыми строками (Верхняя строка - Запрос, Нижняя строка - Предложение) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {lang === 'RU' ? 'Цены и спецификации по лотам' : 'Lotlar we bahalar'}
          </h3>
        </div>

        {tender?.lots && tender.lots.length > 0 ? (
          tender.lots.map((lot, lotIdx) => {
            const isSelected = Boolean(selectedLots[lot.id]);
            const lotItems = offerItemsByLot[lot.id] || [];
            const lotTotal = calculateLotTotal(lot.id);
            const customerDeliveryTerm = lot.deliveryTerm?.shortName || lot.deliveryTerm?.name || 'Не указано';

            return (
              <div 
                key={lot.id} 
                className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${theme.cardBg} ${
                  !isSelected ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Заголовок лота */}
                <div className={`p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`lot-toggle-${lot.id}`}
                      checked={isSelected}
                      onChange={() => toggleLotSelection(lot.id)}
                      className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-blue-600 cursor-pointer shrink-0"
                    />
                    <label htmlFor={`lot-toggle-${lot.id}`} className="font-extrabold text-base cursor-pointer hover:text-[#1e3a8a] dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>{lang === 'RU' ? 'Лот' : 'Lot'} #{lotIdx + 1}: {lot.name}</span>
                      {!isSelected && <span className="text-xs font-normal text-slate-400">({lang === 'RU' ? 'отключен' : 'öçürilen'})</span>}
                    </label>
                  </div>

                  {/* Единая строка условий поставки и сумма лота */}
                  {isSelected && (
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Сравнительная плашка условий поставки */}
                      <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'RU' ? 'Условие заказчика:' : 'Sargyt şerti:'}</span>
                          <strong className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#1e3a8a] dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                            {customerDeliveryTerm}
                          </strong>
                        </div>

                        <span className="text-slate-300 dark:text-slate-600 font-bold">➔</span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold">{lang === 'RU' ? 'Ваше условие:' : 'Teklip şerti:'}</span>
                          <select
                            value={lotDeliveryTerms[lot.id] || ''}
                            onChange={(e) => setLotDeliveryTerms(prev => ({ ...prev, [lot.id]: e.target.value }))}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold text-[#1e3a8a] dark:text-blue-300 ${theme.inputBg} focus:ring-1 focus:ring-blue-500`}
                          >
                            {deliveryTerms.map(dt => (
                              <option key={dt.id} value={dt.id}>
                                {dt.shortName} — {dt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Итого по лоту */}
                      <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700 shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          {lang === 'RU' ? 'Итого по лоту' : 'Lot jemi'}
                        </span>
                        <span className="text-base font-black text-[#1e3a8a] dark:text-blue-400">
                          {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Таблица спецификации: 1 товар = 2 строки (Сверху Запрос, Снизу Предложение) */}
                {isSelected ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-215">
                      <thead>
                        <tr className={`font-semibold ${theme.tableHeaderBg}`}>
                          <th className="py-3 px-3.5 w-12 text-center">#</th>
                          <th className="py-3 px-3.5 min-w-60">{lang === 'RU' ? 'Товар / Предложение' : 'Haryt / Teklip'}</th>
                          <th className="py-3 px-3.5 w-28 text-center">{lang === 'RU' ? 'Ед. изм.' : 'Ölçeg birligi'}</th>
                          <th className="py-3 px-3.5 w-28 text-center">{lang === 'RU' ? 'Количество' : 'Mukdary'}*</th>
                          <th className="py-3 px-3.5 w-36 text-center">{lang === 'RU' ? `Цена за ед. (${currencyCode})` : 'Birlik bahasy'}*</th>
                          <th className="py-3 px-3.5 w-36 text-right">{lang === 'RU' ? `Сумма (${currencyCode})` : 'Jemi baha'}</th>
                          <th className="py-3 px-3.5 min-w-45">{lang === 'RU' ? 'Характеристики / Производитель' : 'Mazmuny / Öndüriji'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                        {lotItems.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400">
                              {lang === 'RU' ? 'В этом лоте нет товаров' : 'Haryt ýok'}
                            </td>
                          </tr>
                        ) : (
                          lotItems.map((item, idx) => {
                            const lineTotal = (parseFloat(item.mukdar) || 0) * (parseFloat(item.price) || 0);
                            const hasPrice = parseFloat(item.price) > 0;

                            return (
                              <React.Fragment key={item.tenderSpecId || idx}>
                                {/* ВЕРХНЯЯ СТРОКА: ЗАПРОС ЗАКАЗЧИКА (Комфортный размер и четкий шрифт) */}
                                <tr className="bg-slate-100/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 font-medium">
                                  {/* Колонка 1: Номер */}
                                  <td className="py-3.5 px-3.5 text-center font-bold text-slate-400">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
                                      {idx + 1}
                                    </span>
                                  </td>

                                  {/* Колонка 2: Название товара заказчика */}
                                  <td className="py-3.5 px-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                        {lang === 'RU' ? 'Запрос' : 'Sargyt'}
                                      </span>
                                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                                        {item.requestedName}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Колонка 3: Ед. изм. */}
                                  <td className="py-3.5 px-3.5 text-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                                    {item.requestedUnit || '-'}
                                  </td>

                                  {/* Колонка 4: Запрошенное количество */}
                                  <td className="py-3.5 px-3.5 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-200/80 dark:bg-slate-800">
                                      {item.requestedQty}
                                    </span>
                                  </td>

                                  {/* Колонка 5: Цена (для запроса прочерк) */}
                                  <td className="py-3.5 px-3.5 text-center text-slate-400 font-medium text-sm">
                                    —
                                  </td>

                                  {/* Колонка 6: Сумма (для запроса прочерк) */}
                                  <td className="py-3.5 px-3.5 text-right text-slate-400 font-medium text-sm">
                                    —
                                  </td>

                                  {/* Колонка 7: Требования заказчика (Без emoji) */}
                                  <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
                                    {item.requestedBrand && (
                                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                                        {item.requestedBrand}
                                      </div>
                                    )}
                                    {item.requestedDesc && (
                                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                        {item.requestedDesc}
                                      </div>
                                    )}
                                    {!item.requestedBrand && !item.requestedDesc && <span className="text-slate-400">—</span>}
                                  </td>
                                </tr>

                                {/* НИЖНЯЯ СТРОКА: ВАШЕ ПРЕДЛОЖЕНИЕ */}
                                <tr className={`bg-white dark:bg-slate-800/90 transition-colors ${hasPrice ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''}`}>
                                  {/* Колонка 1: Стрелка указатель предложения */}
                                  <td className="py-3.5 px-3.5 text-center text-[#1e3a8a] dark:text-blue-400 font-black text-sm">
                                    <CornerDownRight size={16} className="mx-auto" />
                                  </td>

                                  {/* Колонка 2: Предлагаемый товар / Аналог */}
                                  <td className="py-3.5 px-3.5">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-[#1e3a8a] dark:text-blue-300 shrink-0">
                                        {lang === 'RU' ? 'Ваше КП' : 'Teklip'}
                                      </span>
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      value={item.haryt}
                                      onChange={(e) => handleSpecFieldChange(lot.id, idx, 'haryt', e.target.value)}
                                      placeholder={lang === 'RU' ? 'Наименование товара / аналога...' : 'Haryt ady...'}
                                      className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold ${theme.inputBg}`}
                                    />
                                  </td>

                                  {/* Колонка 3: Ед. изм. */}
                                  <td className="py-3.5 px-3.5 text-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                                    {item.unit || item.requestedUnit}
                                  </td>

                                  {/* Колонка 4: Предлагаемое количество */}
                                  <td className="py-3.5 px-3.5 text-center">
                                    <input
                                      type="number"
                                      min="1"
                                      step="any"
                                      required
                                      value={item.mukdar}
                                      onChange={(e) => handleSpecFieldChange(lot.id, idx, 'mukdar', Number(e.target.value))}
                                      className={`w-20 px-2 py-2 text-center font-bold rounded-lg border text-xs ${theme.inputBg}`}
                                    />
                                  </td>

                                  {/* Колонка 5: Цена за единицу */}
                                  <td className="py-3.5 px-3.5 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      required
                                      placeholder="0.00"
                                      value={item.price === 0 ? '' : item.price}
                                      onChange={(e) => handleSpecFieldChange(lot.id, idx, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                                      className={`w-full px-3 py-2 text-right font-black rounded-lg border text-xs transition-all ${
                                        hasPrice
                                          ? 'border-blue-400 dark:border-blue-600 text-[#1e3a8a] dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/40 focus:ring-2 focus:ring-blue-500'
                                          : `text-slate-700 dark:text-slate-300 ${theme.inputBg}`
                                      }`}
                                    />
                                  </td>

                                  {/* Колонка 6: Итоговая сумма по позиции */}
                                  <td className="py-3.5 px-3.5 text-right">
                                    <span className={`font-black text-sm ${hasPrice ? 'text-[#1e3a8a] dark:text-blue-300' : 'text-slate-300'}`}>
                                      {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>

                                  {/* Колонка 7: Характеристики аналога / Производитель */}
                                  <td className="py-3.5 px-3.5">
                                    <input
                                      type="text"
                                      value={item.desc}
                                      onChange={(e) => handleSpecFieldChange(lot.id, idx, 'desc', e.target.value)}
                                      placeholder={lang === 'RU' ? 'Производитель, страна, модель...' : 'Bellikler...'}
                                      className={`w-full px-3 py-2 rounded-lg text-xs border ${theme.inputBg}`}
                                    />
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-5 text-center text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-900/20">
                    {lang === 'RU' ? 'Вы отключили участие в данном лоте' : 'Bu lot üçin teklip berilmeýär'}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={`p-8 rounded-2xl border text-center text-slate-400 ${theme.cardBg}`}>
            {lang === 'RU' ? 'В тендере отсутствуют лоты' : 'Lot tapylmady'}
          </div>
        )}
      </div>

      {/* 5. Шаг 3: Документы (Тендера и Поставщика) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Документы тендера */}
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText size={16} className="text-[#1e3a8a] dark:text-blue-400" />
              <span>{lang === 'RU' ? 'Документы от заказчика' : 'Tender resminamalary'}</span>
            </h3>
            <span className="text-xs text-slate-400">{tender?.files?.length || 0} {lang === 'RU' ? 'файлов' : 'faýl'}</span>
          </div>

          <div className="p-3">
            {tender?.files && tender.files.length > 0 ? (
              <div className="space-y-2">
                {tender.files.map((fileObj, idx) => {
                  const doc = fileObj.document;
                  if (!doc) return null;
                  const baseUrl = API.defaults.baseURL.replace('/api', '');
                  const actualFileName = doc.filePath ? doc.filePath.split(/[\\/]/).pop() : (doc.fileName || doc.name);
                  const fileUrl = `${baseUrl}/uploads/${actualFileName}`;

                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{doc.fileName || doc.name}</div>
                          <div className="text-[10px] text-slate-400">{doc.fileType || 'DOC'}</div>
                        </div>
                      </div>
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-[#1e3a8a] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Скачать файл"
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                {lang === 'RU' ? 'Заказчик не прикрепил документы' : 'Resminama ýok'}
              </div>
            )}
          </div>
        </div>

        {/* Документы коммерческого предложения (Поставщика) */}
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h3 className="font-bold text-sm">
                {lang === 'RU' ? 'Ваши сертификаты и документы' : 'Siziň resminamalaryňyz'}
              </h3>
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()} 
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ${theme.primaryBtn}`}
            >
              <Plus size={14} />
              <span>{lang === 'RU' ? 'Загрузить файл' : 'Faýl goşmak'}</span>
            </button>
          </div>

          <div className="p-3">
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{doc.fileName || doc.name}</div>
                        <div className="text-[10px] text-slate-400">{doc.fileType || 'FILE'}</div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(idx)} 
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Удалить файл"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                {lang === 'RU' ? 'Вы еще не прикрепили файлы к заявке' : 'Faýl ýüklenmedi'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Плавающий / Нижний блок отправки с индикатором ошибок */}
      <div ref={errorRef} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-md animate-in slide-in-from-bottom-2">
            <AlertCircle size={20} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 shadow-xl">
          {!isVerified && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl flex items-center gap-2 border border-rose-200">
              <AlertCircle size={16} />
              {lang === 'RU' ? 'Ваш профиль не прошел верификацию. Подача предложений заблокирована.' : 'Siziň profiliňiz tassyklanmady. Teklip bermek gadagan.'}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold block tracking-wider">
                  {lang === 'RU' ? 'Итого к подаче' : 'Jemi teklip'}:
                </span>
                <span className="text-xl font-black text-[#1e3a8a] dark:text-blue-300">
                  {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                </span>
              </div>
              <div className="hidden md:block pl-6 border-l border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <span>{lang === 'RU' ? `Выбрано лотов: ${activeLotIds.length} | Позиций с ценой: ${pricedItemsCount}` : `Lot: ${activeLotIds.length} | Haryt: ${pricedItemsCount}`}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                {t('cancelBtn', 'Отмена')}
              </button>
              <button
                type="button"
                onClick={handleSubmitOffer}
                disabled={isSubmitting || grandTotal <= 0 || !isVerified}
                className={`flex-1 sm:flex-none px-8 py-3 font-bold rounded-xl text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${theme.primaryBtn}`}
              >
                <Send size={16} />
                <span>
                  {isSubmitting 
                    ? t('saving', 'Iberilýär...') 
                    : (lang === 'RU' ? 'Отправить коммерческое предложение' : 'Teklibi ibermek')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
