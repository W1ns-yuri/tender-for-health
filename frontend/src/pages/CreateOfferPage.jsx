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
  CornerDownRight,
  UploadCloud,
  Upload,
  CheckCircle,
  X,
  Wrench,
  Settings2,
  ShieldCheck,
  MapPin,
  Info,
  Paperclip
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString, getCurrencyLabel } from '../utils/themeUtils';
import { useAlert } from '../context/AlertContext';

export default function CreateOfferPage({ role = 'SUPPLIER', isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);
  const { showAlert, showConfirm } = useAlert();

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
  
  // Позиции предложения: { [lotId]: [{ tenderSpecId, requestedName, haryt, brand, unit, mukdar, price, desc, isEquivalent, equivalentName, equivalentJustification }] }
  const [offerItemsByLot, setOfferItemsByLot] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
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
            desc: '',
            isEquivalent: false,
            equivalentName: '',
            equivalentJustification: ''
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

  const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
  const MAX_FILE_SIZE_MB = 25;

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setFileUploadError('');

    const filesToUpload = Array.from(fileList);
    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        setFileUploadError(lang === 'RU' 
          ? `Файл "${file.name}" имеет недопустимый формат. Разрешены: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.`
          : `"${file.name}" faýlyň formaty rugsat berilmeýär.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileUploadError(lang === 'RU'
          ? `Файл "${file.name}" превышает допустимый размер ${MAX_FILE_SIZE_MB} МБ.`
          : `"${file.name}" faýlyň göwrümi ${MAX_FILE_SIZE_MB} MB-dan uly.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      try {
        const res = await API.post('/documents/upload', formData);
        const docData = {
          ...res.data,
          size: file.size,
          fileName: file.name
        };
        setUploadedFiles(prev => [...prev, docData]);
      } catch (err) {
        console.error('File upload error', err);
        setFileUploadError(lang === 'RU' ? `Ошибка загрузки "${file.name}"` : `Faýl ýüklemekde ýalňyşlyk`);
      }
    }
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      const confirmSend = await showConfirm({
        title: lang === 'RU' ? 'Неоцененные позиции' : 'Bahasysyz harytlar',
        message: lang === 'RU'
          ? `Внимание: для ${unpricedItems.length} поз. не указана цена. Вы хотите отправить предложение только по ${specsWithPrices.length} оцененным позициям?`
          : `Üns beriň: ${unpricedItems.length} haryt üçin baha girizilmedi. Diňe baha berlen harytlary ibermek isleýärsiňizmi?`,
        type: 'warning',
        confirmText: lang === 'RU' ? 'Отправить' : 'Ugrat',
        cancelText: lang === 'RU' ? 'Отмена' : 'Ýatyr'
      });
      if (!confirmSend) return;
    }

    const specsToSubmit = specsWithPrices.map(item => ({
      tenderSpecId: item.tenderSpecId,
      name: item.isEquivalent ? (item.equivalentName?.trim() || item.requestedName) : item.requestedName,
      quantity: parseFloat(item.requestedQty) || 1, // Зафиксировано строго по заказчику!
      unitPrice: parseFloat(item.price) || 0,
      description: item.desc || null,
      unitId: item.unitId || null,
      isEquivalent: Boolean(item.isEquivalent),
      equivalentName: item.isEquivalent ? item.equivalentName?.trim() : null,
      equivalentJustification: item.isEquivalent ? item.equivalentJustification?.trim() : null
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

      await showAlert({
        title: lang === 'RU' ? 'Успешно' : 'Üstünlikli',
        message: lang === 'RU' ? 'Коммерческое предложение успешно отправлено!' : 'Teklip üstünlikli iberildi!',
        type: 'success'
      });
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
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  const grandTotal = calculateGrandTotal();

  return (
    <div className="space-y-6 pb-32 text-sm">
      {/* 1. Верхняя навигация и заголовок */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-black tracking-tight ${theme.primaryText}`}>
            {lang === 'RU' ? 'Подача коммерческого предложения' : 'Tender teklibi tabşyrmak'}
          </h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
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
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
              {lang === 'RU' ? 'Итоговая стоимость заявки' : 'Jemi teklip bahasy'}
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 my-0.5 whitespace-nowrap">
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
                  {getCurrencyLabel(c)}
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
            const lotType = lot.lotType || 'GOODS';

            return (
              <div 
                key={lot.id} 
                className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${theme.cardBg} ${
                  !isSelected ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Заголовок лота с динамическими параметрами */}
                <div className={`p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/90'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`lot-toggle-${lot.id}`}
                      checked={isSelected}
                      onChange={() => toggleLotSelection(lot.id)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor={`lot-toggle-${lot.id}`} className="font-extrabold text-base cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>{lang === 'RU' ? 'Лот' : 'Lot'} #{lotIdx + 1}: {lot.name}</span>
                      {!isSelected && <span className="text-xs font-normal text-slate-400">({lang === 'RU' ? 'отключен' : 'öçürilen'})</span>}
                    </label>

                    {/* Бейдж типа предмета лота */}
                    {lotType === 'GOODS' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                        <Package size={12} />
                        <span>{lang === 'RU' ? 'Товары' : 'Harytlar'}</span>
                      </span>
                    )}
                    {lotType === 'WORKS' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
                        <Wrench size={12} />
                        <span>{lang === 'RU' ? 'Работы' : 'Işler'}</span>
                      </span>
                    )}
                    {lotType === 'SERVICES' && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800/60">
                        <Settings2 size={12} />
                        <span>{lang === 'RU' ? 'Услуги' : 'Hyzmatlar'}</span>
                      </span>
                    )}
                  </div>

                  {/* Единая строка условий поставки / выполнения и сумма лота */}
                  {isSelected && (
                    <div className="flex flex-wrap items-center gap-4">
                      {/* 1. Для ТОВАРОВ: сравнительная плашка Incoterms + адрес доставки */}
                      {lotType === 'GOODS' && (
                        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'RU' ? 'Условие заказчика:' : 'Sargyt şerti:'}</span>
                            <strong className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                              {customerDeliveryTerm}
                            </strong>
                          </div>

                          <span className="text-slate-300 dark:text-slate-600 font-bold">➔</span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">{lang === 'RU' ? 'Ваше условие:' : 'Teklip şerti:'}</span>
                            <select
                              value={lotDeliveryTerms[lot.id] || ''}
                              onChange={(e) => setLotDeliveryTerms(prev => ({ ...prev, [lot.id]: e.target.value }))}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold text-blue-700 dark:text-blue-300 ${theme.inputBg} focus:ring-1 focus:ring-blue-500`}
                            >
                              {deliveryTerms.map(dt => (
                                <option key={dt.id} value={dt.id}>
                                  {dt.shortName} — {dt.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {lot.deliveryAddress && (
                            <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                              <MapPin size={12} className="text-slate-400" />
                              <span className="truncate max-w-45" title={lot.deliveryAddress}>{lot.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Для РАБОТ: Объект, график, строительная лицензия (Incoterms скрыт) */}
                      {lotType === 'WORKS' && (
                        <div className="flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                          {lot.workAddress && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <MapPin size={13} className="text-amber-500 shrink-0" />
                              <span className="text-slate-400">{lang === 'RU' ? 'Объект:' : 'Ýer:'}</span>
                              <strong className="truncate max-w-45" title={lot.workAddress}>{lot.workAddress}</strong>
                            </div>
                          )}
                          {lot.workPeriod && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                              <Clock size={13} className="text-slate-400 shrink-0" />
                              <span className="text-slate-400">{lang === 'RU' ? 'Срок:' : 'Möhleti:'}</span>
                              <strong>{lot.workPeriod}</strong>
                            </div>
                          )}
                          {lot.licenseRequired && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                              <ShieldCheck size={12} />
                              <span>{lang === 'RU' ? 'Требуется строительная лицензия' : 'Ygtyýarnama talap edilýär'}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3. Для УСЛУГ: Формат оказания и SLA (Incoterms скрыт) */}
                      {lotType === 'SERVICES' && (
                        <div className="flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Settings2 size={13} className="text-blue-500 shrink-0" />
                            <span className="text-slate-400">{lang === 'RU' ? 'Формат:' : 'Görnüşi:'}</span>
                            <strong>
                              {lot.serviceFormat === 'REMOTE'
                                ? (lang === 'RU' ? 'Удаленно' : 'Alysda')
                                : lot.serviceFormat === 'HYBRID'
                                ? (lang === 'RU' ? 'Гибридный' : 'Gatyşyk')
                                : (lang === 'RU' ? 'На объекте заказчика' : 'Ýerinde')}
                            </strong>
                          </div>
                          {lot.slaPeriod && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                              <Clock size={13} className="text-slate-400 shrink-0" />
                              <span className="text-slate-400">SLA:</span>
                              <strong>{lot.slaPeriod}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Итого по лоту */}
                      <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700 shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          {lang === 'RU' ? 'Итого по лоту' : 'Lot jemi'}
                        </span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
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
                          <th className="py-3 px-3.5 min-w-45">{lang === 'RU' ? 'Характеристики / Обоснование' : 'Mazmuny / Esaslandyrma'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                        {lotItems.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400">
                              {lang === 'RU' ? 'В этом лоте нет позиций' : 'Haryt ýok'}
                            </td>
                          </tr>
                        ) : (
                          lotItems.map((item, idx) => {
                            const lineTotal = (parseFloat(item.requestedQty) || 0) * (parseFloat(item.price) || 0);
                            const hasPrice = parseFloat(item.price) > 0;
                            const isEq = Boolean(item.isEquivalent);

                            return (
                              <React.Fragment key={item.tenderSpecId || idx}>
                                {/* ВЕРХНЯЯ СТРОКА: ЗАПРОС ЗАКАЗЧИКА */}
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

                                  {/* Колонка 5: Цена (прочерк для запроса) */}
                                  <td className="py-3.5 px-3.5 text-center text-slate-400 font-medium text-sm">
                                    —
                                  </td>

                                  {/* Колонка 6: Сумма (прочерк для запроса) */}
                                  <td className="py-3.5 px-3.5 text-right text-slate-400 font-medium text-sm">
                                    —
                                  </td>

                                  {/* Колонка 7: Требования заказчика */}
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

                                {/* НИЖНЯЯ СТРОКА: ПРЕДЛОЖЕНИЕ ПОСТАВЩИКА */}
                                <tr className={`bg-white dark:bg-slate-800/90 transition-colors ${hasPrice ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''}`}>
                                  {/* Колонка 1: Указатель предложения */}
                                  <td className="py-3.5 px-3.5 text-center text-blue-600 dark:text-blue-400 font-black text-sm">
                                    <CornerDownRight size={16} className="mx-auto" />
                                  </td>

                                  {/* Колонка 2: Предложение и чекбокс эквивалента */}
                                  <td className="py-3.5 px-3.5">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                                        {lang === 'RU' ? 'Ваше КП' : 'Teklip'}
                                      </span>

                                      {/* Чекбокс эквивалента / аналога */}
                                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                        <input
                                          type="checkbox"
                                          checked={isEq}
                                          onChange={(e) => handleSpecFieldChange(lot.id, idx, 'isEquivalent', e.target.checked)}
                                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span>{lang === 'RU' ? 'Предложить эквивалент / аналог' : 'Meňzeş haryt teklip et'}</span>
                                      </label>
                                    </div>

                                    {isEq ? (
                                      <input
                                        type="text"
                                        required
                                        value={item.equivalentName || ''}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'equivalentName', e.target.value)}
                                        placeholder={lang === 'RU' ? 'Торговое наименование предлагаемого аналога...' : 'Meňzeş harydyň söwda ady...'}
                                        className={`w-full px-3 py-2 rounded-lg border text-xs font-bold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/30`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        required
                                        value={item.haryt || item.requestedName}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'haryt', e.target.value)}
                                        placeholder={lang === 'RU' ? 'Наименование товара...' : 'Haryt ady...'}
                                        className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold ${theme.inputBg}`}
                                      />
                                    )}
                                  </td>

                                  {/* Колонка 3: Ед. изм. */}
                                  <td className="py-3.5 px-3.5 text-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                                    {item.requestedUnit || item.unit || '-'}
                                  </td>

                                  {/* Колонка 4: Количество (СТРОГО ЗАФИКСИРОВАНО ПО ЗАКАЗЧИКУ) */}
                                  <td className="py-3.5 px-3.5 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs border border-slate-200 dark:border-slate-700 shadow-2xs">
                                        {item.requestedQty}
                                      </span>
                                      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                        {lang === 'RU' ? 'фиксировано' : 'bellenen'}
                                      </span>
                                    </div>
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
                                          ? 'border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/40 focus:ring-2 focus:ring-blue-500'
                                          : `text-slate-700 dark:text-slate-300 ${theme.inputBg}`
                                      }`}
                                    />
                                  </td>

                                  {/* Колонка 6: Итоговая сумма по позиции */}
                                  <td className="py-3.5 px-3.5 text-right">
                                    <span className={`font-black text-sm ${hasPrice ? 'text-blue-600 dark:text-blue-300' : 'text-slate-300'}`}>
                                      {lineTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>

                                  {/* Колонка 7: Обоснование эквивалента или характеристики */}
                                  <td className="py-3.5 px-3.5">
                                    {isEq ? (
                                      <textarea
                                        rows="2"
                                        value={item.equivalentJustification || ''}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'equivalentJustification', e.target.value)}
                                        placeholder={lang === 'RU' ? 'Обоснование эквивалентности (МНН, форма, дозировка, характеристики)...' : 'Ekwivalentlik esaslandyrmasy...'}
                                        className="w-full px-3 py-1.5 rounded-lg text-xs border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={item.desc}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'desc', e.target.value)}
                                        placeholder={lang === 'RU' ? 'Производитель, страна, модель...' : 'Bellikler...'}
                                        className={`w-full px-3 py-2 rounded-lg text-xs border ${theme.inputBg}`}
                                      />
                                    )}
                                  </td>
                                </tr>

                                {/* Подсказка об эквиваленте */}
                                {isEq && (
                                  <tr className="bg-blue-50/30 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40">
                                    <td colSpan="7" className="py-1.5 px-4">
                                      <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                                        <Info size={13} className="shrink-0 text-blue-600" />
                                        <span>
                                          {lang === 'RU' 
                                            ? 'Предложен эквивалент / аналог. Заявка будет проверена экспертной комиссией на соответствие техническим и качественным характеристикам.'
                                            : 'Ekwivalent haryt teklip edildi. Tehniki şertlere laýyklygy barlagdan geçiriler.'}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )}
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

      {/* 5. Документы: Заказчик и Интерактивная Дропзона поставщика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Документы тендера (от заказчика) */}
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText size={16} className="text-blue-600 dark:text-blue-400" />
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
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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

        {/* Документы коммерческого предложения (Поставщика) — Интерактивная Dropzone */}
        <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Paperclip size={16} className="text-blue-600 dark:text-blue-400" />
                <span>{lang === 'RU' ? 'Ваши сертификаты и документы' : 'Siziň resminamalaryňyz'}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'RU' ? 'Сертификаты, лицензии, коммерческое предложение (до 25 МБ)' : 'Resminamalar, ygtyýarnamalar (25 MB çenli)'}
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'RU' ? 'Прикрепить еще документ' : 'Ýene faýl goş'}</span>
              </button>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            multiple 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" 
            className="hidden" 
          />

          <div className="p-4 space-y-3">
            {fileUploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{fileUploadError}</span>
                </div>
                <button type="button" onClick={() => setFileUploadError('')} className="p-1 hover:bg-rose-100 rounded-md cursor-pointer">
                  <X size={13} />
                </button>
              </div>
            )}

            {uploadedFiles.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/40 dark:bg-slate-900/30 hover:bg-blue-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <UploadCloud size={24} />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {lang === 'RU' ? 'Перетащите файлы сюда или нажмите для выбора' : 'Faýllary şu ýere süýräň ýa-da saýlaň'}
                </div>
                <div className="text-xs text-slate-400">
                  {lang === 'RU' ? 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG до 25 МБ (до 10 файлов)' : 'PDF, DOC, XLS, JPG 25 MB çenli'}
                </div>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="space-y-2"
              >
                {uploadedFiles.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 transition-all shadow-2xs">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
                        <FileText size={18} />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {doc.fileName || doc.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="uppercase font-semibold">{doc.fileType || 'FILE'}</span>
                          {doc.size && <span>• {formatFileSize(doc.size)}</span>}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 size={11} /> {lang === 'RU' ? 'Прикреплен' : 'Ýüklendi'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(idx)} 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title={lang === 'RU' ? 'Удалить файл' : 'Faýly aýyr'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Нижняя фиксированная панель действий (Sticky Action Bar) */}
      <div ref={errorRef} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-md">
            <AlertCircle size={20} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="sticky bottom-0 z-30 -mx-6 -mb-6 px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {!isVerified && (
            <div className="w-full p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200">
              <AlertCircle size={15} />
              {lang === 'RU' ? 'Ваш профиль не прошел верификацию. Подача предложений заблокирована.' : 'Siziň profiliňiz tassyklanmady. Teklip bermek gadagan.'}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            {/* Левая часть: сумма и статистика */}
            <div className="flex items-center gap-5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                  {lang === 'RU' ? 'Итоговая сумма заявки' : 'Jemi teklip bahasy'}:
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                </span>
              </div>
              <div className="hidden md:block pl-5 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
                <div>{lang === 'RU' ? `Выбрано лотов: ${activeLotIds.length}` : `Lotlar: ${activeLotIds.length}`}</div>
                <div className="text-[11px] text-slate-400">{lang === 'RU' ? `Оценено: ${pricedItemsCount} позиций` : `Bahalandyrylan: ${pricedItemsCount}`}</div>
              </div>
            </div>

            {/* Правая часть: подсказка при нуле + кнопки действий */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {grandTotal <= 0 && isVerified && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Info size={14} className="shrink-0" />
                  <span>{lang === 'RU' ? 'Укажите цену хотя бы по одной позиции выбранного лота' : 'Iň bolmanda bir haryda baha belläň'}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer"
              >
                {t('cancelBtn', 'Отмена')}
              </button>

              <button
                type="button"
                onClick={handleSubmitOffer}
                disabled={isSubmitting || grandTotal <= 0 || !isVerified}
                className={`px-7 py-3 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                  grandTotal <= 0 || !isVerified
                    ? 'bg-blue-300 dark:bg-blue-900/40 text-white cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
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
