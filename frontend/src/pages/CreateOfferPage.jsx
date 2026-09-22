import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Package,
  CornerDownRight,
  UploadCloud,
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
import { getRoleTheme, getCurrencyLabel } from '../utils/themeUtils';
import { useAlert } from '../context/AlertContext';
import CustomSelect from '../components/CustomSelect';

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
  const [paymentTerms, setPaymentTerms] = useState(t('payment100Percent', '100% оплата'));
  const [comment, setComment] = useState('');

  // Управление вкладками лотов и режимом отображения
  const [activeLotTab, setActiveLotTab] = useState(0);
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' | 'all'

  // Выбранные лоты и условия поставки по каждому лоту
  const [selectedLots, setSelectedLots] = useState({}); // { [lotId]: boolean }
  const [lotDeliveryTerms, setLotDeliveryTerms] = useState({}); // { [lotId]: deliveryTermId }
  const [supplierCategoryIds, setSupplierCategoryIds] = useState([]);
  
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
      let suppCatIds = [];
      if (role === 'SUPPLIER' && meRes.data?.suppliers?.[0]) {
          const supp = meRes.data.suppliers[0];
          if (supp.verificationStatus !== 'VERIFIED') {
              setIsVerified(false);
          }
          if (supp.categories && supp.categories.length > 0) {
              suppCatIds = supp.categories.map(c => c.categoryId);
              setSupplierCategoryIds(suppCatIds);
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
          const isLotPermitted = !lot.categoryId || suppCatIds.length === 0 || suppCatIds.includes(lot.categoryId);
          initialSelectedLots[lot.id] = isLotPermitted;
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
        setErrorMsg(t('tenderLoadError', 'Ошибка загрузки данных тендера'));
      })
      .finally(() => setLoading(false));
  }, [id, role]);

  const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
  const MAX_FILE_SIZE_MB = 25;

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setFileUploadError('');

    const filesToUpload = Array.from(fileList);
    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        setFileUploadError(t('fileInvalidFormatError', `Файл "${file.name}" имеет недопустимый формат. Разрешены: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.`, { fileName: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileUploadError(t('fileExceedsSizeError', `Файл "${file.name}" превышает допустимый размер ${MAX_FILE_SIZE_MB} МБ.`, { fileName: file.name, maxMb: MAX_FILE_SIZE_MB }));
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
        setFileUploadError(t('fileUploadErrorWithName', 'Ошибка загрузки "${file.name}"'));
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

    // 0. Проверка верификации поставщика
    if (!isVerified) {
      setErrorMsg(t('verificationRequiredToBid', 'Для подачи ценового предложения необходимо пройти верификацию компании'));
      scrollToError();
      return;
    }

    // 0. Проверка статуса тендера и крайнего срока
    if (tender?.status !== 'ACYK') {
      setErrorMsg(t('tenderClosedForOffersError', 'Тендер закрыт или не принимает коммерческие предложения.'));
      scrollToError();
      return;
    }

    if (tender?.deadline && new Date() > new Date(tender.deadline)) {
      setErrorMsg(t('tenderDeadlinePassedError', 'Срок подачи заявок по данному тендеру истек (дедлайн прошел)!'));
      scrollToError();
      return;
    }

    // 1. Проверка выбора хотя бы одного лота
    if (activeLotIds.length === 0) {
      setErrorMsg(t('selectAtLeastOneLotError', 'Пожалуйста, выберите хотя бы один лот для участия в тендере'));
      scrollToError();
      return;
    }

    // Проверка категорий поставщика: блокируем подачу КП на лоты вне аккредитации
    if (supplierCategoryIds.length > 0) {
      for (const lot of tender?.lots || []) {
        if (lot.categoryId && !supplierCategoryIds.includes(lot.categoryId) && selectedLots[lot.id]) {
          setErrorMsg(t('notAccreditedForLot', 'Подача КП по данному лоту недоступна'));
          scrollToError();
          return;
        }
      }
    }

    // 2. Строгая проверка на непустое предложение (хотя бы один товар с ценой > 0)
    const specsWithPrices = allActiveItems.filter(item => parseFloat(item.price) > 0);
    if (specsWithPrices.length === 0) {
      setErrorMsg(t('noPricesSpecifiedError', 'Вы не указали цену ни для одного товара! Введите цены в поле "Цена за ед." для отправки предложения.'));
      scrollToError();
      return;
    }

    // 3. Проверка: нет ли выбранных позиций с ценой 0 в активных лотах
    const unpricedItems = allActiveItems.filter(item => !item.price || parseFloat(item.price) <= 0);
    if (unpricedItems.length > 0) {
      const confirmSend = await showConfirm({
        title: t('unpricedItemsTitle', 'Неоцененные позиции'),
        message: t('unpricedItemsConfirmPrompt', `Внимание: для ${unpricedItems.length} поз. не указана цена. Вы хотите отправить предложение только по ${specsWithPrices.length} оцененным позициям?`, { unpricedCount: unpricedItems.length, pricedCount: specsWithPrices.length }),
        type: 'warning',
        confirmText: t('submitBtn', 'Отправить'),
        cancelText: t('cancelEditBtn', 'Отмена')
      });
      if (!confirmSend) return;
    }

    const specsToSubmit = specsWithPrices.map(item => ({
      tenderSpecId: item.tenderSpecId,
      name: item.isEquivalent ? (item.equivalentName?.trim() || item.requestedName) : (item.haryt?.trim() || item.requestedName),
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
        paymentTerms: paymentTerms.trim() || (t('payment100Percent', '100% оплата')),
        comment,
        attachedDocumentIds: uploadedFiles.map(f => f.id).filter(Boolean),
        specs: specsToSubmit
      });

      await showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('successOffer', 'Коммерческое предложение успешно отправлено!'),
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
            {t('offerDetailsTitle', 'Подача коммерческого предложения')}
          </h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
            {tender?.tenderNumber}
          </span>
        </div>
      </div>

      {/* Баннер предупреждения для неверифицированного поставщика */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">
                {t('verificationRequiredToBidTitle', 'Требуется верификация компании')}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {t('completeProfileToBidNotice', 'Для подачи ценовых предложений необходимо заполнить реквизиты и прикрепить документы в профиле.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            {t('goToProfileBtn', 'Перейти в профиль')}
          </button>
        </div>
      )}

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
                  <span className="text-slate-400">{t('clientWithColon', 'Заказчик:')}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{tender.client.name}</strong>
                </span>
              )}
              {tender?.deadline && (
                <span>
                  <span className="text-slate-400">{t('deadlineUntilLabel', 'Срок подачи до:')}</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold">{new Date(tender.deadline).toLocaleDateString('ru-RU')}</strong>
                </span>
              )}
              <span>
                <span className="text-slate-400">{t('statusWithColon', 'Статус:')}</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('visibilityPublic', 'Прием заявок открыт')}</strong>
              </span>
            </div>
          </div>

          {/* Виджет итоговой суммы предложения (компактный, расширяется по контенту) */}
          <div className="shrink-0 px-5 py-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-right shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
              {t('totalOfferCost', 'Итоговая стоимость заявки')}
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 my-0.5 whitespace-nowrap">
              {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={13} className={pricedItemsCount > 0 ? "text-emerald-600" : "text-slate-400"} />
              <span>{t('pricedItemsProgress', `Оценено: ${pricedItemsCount} из ${totalActiveItemsCount} позиций`, { pricedItemsCount, totalActiveItemsCount })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Памятка об эквивалентах и процедуре равных условий */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {t('analogsProcedureNotice', 'Процедура предложения аналогов и эквивалентов')}
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
            {t('analogsGuidelinesText', 'Количество позиций зафиксировано в строгом соответствии с потребностью заказчика. Если вы предлагаете сертифицированный эквивалент/аналог, включите опцию «Предложить эквивалент / аналог» в строке позиции и подробно укажите торговое наименование и обоснование (МНН, характеристики, дозировка). Все заявки с эквивалентами оцениваются экспертной комиссией на общих основаниях.')}
          </p>
        </div>
      </div>

      {/* 3. Основные параметры вашего предложения */}
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${theme.cardBg}`}>
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t('offerMainParamsTitle', 'Основные параметры вашего предложения')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-1">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('currency', 'Валюта предложения')}*
            </label>
            <CustomSelect
              role="SUPPLIER"
              options={currencies.map(c => ({ id: c.id, name: getCurrencyLabel(c) }))}
              value={currency}
              onChange={(val) => setCurrency(val)}
              isDarkMode={isDarkMode}
              theme={theme}
              t={t}
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {t('currencyNotice', 'Цены по всем лотам будут рассчитаны в этой валюте')}
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('paymentTerms', 'Условия оплаты')}
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
              {t('offerValidityNotes', 'Срок действия предложения / Примечание')}
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

      {/* 4. Таблицы по лотам с вкладками переключения */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {t('lotsPricesSpecsTitle', 'Цены и спецификации по лотам')}
            </h3>
            {tender?.lots && tender.lots.length > 1 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {t('lotsNavigationHint', 'Переключайтесь между лотами для заполнения цен и условий')}
              </p>
            )}
          </div>

          {tender?.lots && tender.lots.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tabs'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('viewModeByLots', 'По лотам')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('viewModeAllLots', 'Все лоты сразу')}
              </button>
            </div>
          )}
        </div>

        {/* Табы лотов (при наличии нескольких лотов в режиме по лотам) */}
        {tender?.lots && tender.lots.length > 1 && viewMode === 'tabs' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {tender.lots.map((lot, idx) => {
              const isAllowed = !lot.categoryId || supplierCategoryIds.length === 0 || supplierCategoryIds.includes(lot.categoryId);
              const isSelected = Boolean(selectedLots[lot.id]) && isAllowed;
              const lotTotal = calculateLotTotal(lot.id);
              const isActiveTab = activeLotTab === idx;

              return (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => setActiveLotTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border ${
                    isActiveTab
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : isSelected
                      ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-transparent opacity-60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? (isActiveTab ? 'bg-white' : 'bg-blue-500') : 'bg-slate-300'}`}></span>
                  <span>{t('lotUpperLabel', 'Лот')} #{idx + 1}: {lot.name}</span>
                  {isSelected && lotTotal > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActiveTab ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {lotTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {tender?.lots && tender.lots.length > 0 ? (
          (viewMode === 'tabs' && tender.lots.length > 1 ? [tender.lots[Math.min(activeLotTab, tender.lots.length - 1)]] : tender.lots).map((lot) => {
            const lotIdx = tender.lots.findIndex(l => l.id === lot.id);
            const isAllowed = !lot.categoryId || supplierCategoryIds.length === 0 || supplierCategoryIds.includes(lot.categoryId);
            const isSelected = Boolean(selectedLots[lot.id]) && isAllowed;
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
                      disabled={!isAllowed}
                      onChange={() => isAllowed && toggleLotSelection(lot.id)}
                      className={`w-5 h-5 rounded text-blue-600 focus:ring-blue-500 shrink-0 ${
                        !isAllowed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                      }`}
                    />
                    <label htmlFor={`lot-toggle-${lot.id}`} className="font-extrabold text-base cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span>{t('lotUpperLabel', 'Лот')} #{lotIdx + 1}: {lot.name}</span>
                      {!isSelected && isAllowed && <span className="text-xs font-normal text-slate-400">({t('disabledBadge', 'отключен')})</span>}
                    </label>

                    {/* Бейдж вне категории */}
                    {!isAllowed && (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 border border-rose-200 dark:border-rose-900/60">
                        <AlertCircle size={12} className="text-rose-500" />
                        <span>{t('lotOutsideCategory', 'Лот вне вашей категории аккредитации')}</span>
                      </span>
                    )}

                    {/* Бейдж типа предмета лота */}
                    {lotType === 'GOODS' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                        <Package size={12} />
                        <span>{t('catProducts', 'Товары')}</span>
                      </span>
                    )}
                    {lotType === 'WORKS' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
                        <Wrench size={12} />
                        <span>{t('worksType', 'Работы')}</span>
                      </span>
                    )}
                    {lotType === 'SERVICES' && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800/60">
                        <Settings2 size={12} />
                        <span>{t('servicesType', 'Услуги')}</span>
                      </span>
                    )}

                    {lot.endUser && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium pl-1">
                        🏢 {t('endUser', 'Конечный получатель')}: <strong className="text-slate-800 dark:text-slate-200 font-bold">{lot.endUser}</strong>
                      </span>
                    )}

                    {lot.files && lot.files.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Paperclip size={12} className="text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('lotDocuments', 'Документы лота')}:</span>
                        {lot.files.map((f, fIdx) => {
                          const doc = f.document || f;
                          return (
                            <a
                              key={doc.id || fIdx}
                              href={`http://localhost:5000/${doc.filePath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline text-[11px] font-bold flex items-center gap-1 border border-blue-200/60 dark:border-blue-800"
                              title={doc.fileName || doc.name}
                            >
                              <FileText size={11} />
                              <span className="max-w-28 truncate">{doc.fileName || doc.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Единая строка условий поставки / выполнения и сумма лота */}
                  {isSelected && (
                    <div className="flex flex-wrap items-center gap-4">
                      {/* 1. Для ТОВАРОВ: сравнительная плашка Incoterms + адрес доставки */}
                      {lotType === 'GOODS' && (
                        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('customerConditionLabel', 'Условие заказчика:')}</span>
                            <strong className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                              {customerDeliveryTerm}
                            </strong>
                          </div>

                          <span className="text-slate-300 dark:text-slate-600 font-bold">➔</span>

                          <div className="flex items-center gap-1.5 min-w-44">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold shrink-0">{t('yourConditionLabel', 'Ваше условие:')}</span>
                            <CustomSelect
                              role="SUPPLIER"
                              size="sm"
                              className="min-w-36"
                              options={deliveryTerms.map(dt => ({ id: dt.id, name: `${dt.shortName} — ${dt.name}` }))}
                              value={lotDeliveryTerms[lot.id] || ''}
                              onChange={(val) => setLotDeliveryTerms(prev => ({ ...prev, [lot.id]: val }))}
                              searchable={deliveryTerms.length > 5}
                              isDarkMode={isDarkMode}
                              theme={theme}
                              t={t}
                            />
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
                              <span className="text-slate-400">{t('siteWithColon', 'Объект:')}</span>
                              <strong className="truncate max-w-45" title={lot.workAddress}>{lot.workAddress}</strong>
                            </div>
                          )}
                          {lot.workPeriod && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 pl-2 border-l border-slate-200 dark:border-slate-700">
                              <Clock size={13} className="text-slate-400 shrink-0" />
                              <span className="text-slate-400">{t('termWithColon', 'Срок:')}</span>
                              <strong>{lot.workPeriod}</strong>
                            </div>
                          )}
                          {lot.licenseRequired && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                              <ShieldCheck size={12} />
                              <span>{t('constructionLicenseRequired', 'Требуется строительная лицензия')}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* 3. Для УСЛУГ: Формат оказания и SLA (Incoterms скрыт) */}
                      {lotType === 'SERVICES' && (
                        <div className="flex flex-wrap items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Settings2 size={13} className="text-blue-500 shrink-0" />
                            <span className="text-slate-400">{t('formatWithColon', 'Формат:')}</span>
                            <strong>
                              {lot.serviceFormat === 'REMOTE'
                                ? (t('remoteFormat', 'Удаленно'))
                                : lot.serviceFormat === 'HYBRID'
                                ? (t('formatHybrid', 'Гибридный'))
                                : (t('onCustomerSiteFormat', 'На объекте заказчика'))}
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
                          {t('lotSubtotal', 'Итого по лоту')}
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
                          <th className="py-3 px-3.5 min-w-60">
                            {lotType === 'WORKS' 
                              ? (t('workStages', 'Этап / вид работ'))
                              : lotType === 'SERVICES'
                              ? (t('serviceName', 'Наименование услуги'))
                              : (t('itemOfferColumn', 'Товар / Предложение'))}
                          </th>
                          <th className="py-3 px-3.5 w-28 text-center">{t('specUnit', 'Ед. изм.')}</th>
                          <th className="py-3 px-3.5 w-28 text-center">
                            {lotType === 'SERVICES' 
                              ? (t('volumePeriod', 'Объем / Период')) 
                              : (t('specQty', 'Количество'))}*
                          </th>
                          <th className="py-3 px-3.5 w-36 text-center">{t('unitPriceWithCurrency', `Цена за ед. (${currencyCode})`, { currencyCode })}*</th>
                          <th className="py-3 px-3.5 w-36 text-right">{t('totalSumWithCurrency', `Сумма (${currencyCode})`, { currencyCode })}</th>
                          <th className="py-3 px-3.5 min-w-45">
                            {lotType === 'WORKS'
                              ? (t('scopeOfWork', 'Состав и спецификация работ'))
                              : lotType === 'SERVICES'
                              ? (t('serviceRegulations', 'Регламент и описание услуги'))
                              : (t('specsJustificationColumn', 'Характеристики / Обоснование'))}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                        {lotItems.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400">
                              {t('noItemsInLot', 'В этом лоте нет позиций')}
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
                                        {t('requestLabel', 'Запрос')}
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
                                        {t('yourBidColumn', 'Ваше КП')}
                                      </span>

                                      {/* Чекбокс эквивалента / аналога (только для товаров) */}
                                      {lotType === 'GOODS' && (
                                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                          <input
                                            type="checkbox"
                                            checked={isEq}
                                            onChange={(e) => handleSpecFieldChange(lot.id, idx, 'isEquivalent', e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          />
                                          <span>{t('proposeAnalogBtn', 'Предложить эквивалент / аналог')}</span>
                                        </label>
                                      )}
                                    </div>

                                    {isEq ? (
                                      <input
                                        type="text"
                                        required
                                        disabled={!isAllowed || !isSelected}
                                        value={item.equivalentName || ''}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'equivalentName', e.target.value)}
                                        placeholder={
                                          lotType === 'SERVICES'
                                            ? (t('serviceEquivalentPlaceholder', 'Предлагаемая услуга-аналог...'))
                                            : (t('productEquivalentPlaceholder', 'Торговое наименование аналога / модель...'))
                                        }
                                        className={`w-full px-3 py-2 rounded-lg border text-xs font-bold ${
                                          !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 placeholder:text-blue-400'
                                        }`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        required
                                        disabled={!isAllowed || !isSelected}
                                        value={item.haryt || item.requestedName || ''}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'haryt', e.target.value)}
                                        placeholder={
                                          lotType === 'WORKS'
                                            ? (t('workScopePlaceholder', 'Наименование / состав выполняемых работ...'))
                                            : lotType === 'SERVICES'
                                            ? (t('serviceNamePlaceholder', 'Наименование оказываемой услуги...'))
                                            : (t('productNamePlaceholder', 'Наименование товара...'))
                                        }
                                        className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold ${theme.inputBg} ${
                                          !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                                        }`}
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
                                        {t('fixedBadge', 'фиксировано')}
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
                                      disabled={!isAllowed || !isSelected}
                                      placeholder="0.00"
                                      value={item.price === 0 ? '' : item.price}
                                      onChange={(e) => handleSpecFieldChange(lot.id, idx, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                                      className={`w-full px-3 py-2 text-right font-black rounded-lg border text-xs transition-all ${
                                        !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                                      } ${
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
                                        disabled={!isAllowed || !isSelected}
                                        value={item.equivalentJustification || ''}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'equivalentJustification', e.target.value)}
                                        placeholder={t('equivalenceJustificationPlaceholder', 'Обоснование эквивалентности (МНН, форма, дозировка, характеристики)...')}
                                        className={`w-full px-3 py-1.5 rounded-lg text-xs border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none ${
                                          !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed' : ''
                                        }`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        disabled={!isAllowed || !isSelected}
                                        value={item.desc}
                                        onChange={(e) => handleSpecFieldChange(lot.id, idx, 'desc', e.target.value)}
                                        placeholder={t('manufacturerNotesPlaceholder', 'Производитель, страна, модель...')}
                                        className={`w-full px-3 py-2 rounded-lg text-xs border ${theme.inputBg} ${
                                          !isAllowed || !isSelected ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                                        }`}
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
                                          {t('analogOfferedNotice', 'Предложен эквивалент / аналог. Заявка будет проверена экспертной комиссией на соответствие техническим и качественным характеристикам.')}
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
                    {t('optedOutOfLotNotice', 'Вы отключили участие в данном лоте')}
                  </div>
                )}

                {/* Навигация между лотами в табовом режиме */}
                {viewMode === 'tabs' && tender.lots.length > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={activeLotTab === 0}
                      onClick={() => setActiveLotTab(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {t('lotTabPrevBtn', '← Предыдущий лот')}
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      {activeLotTab + 1} / {tender.lots.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeLotTab >= tender.lots.length - 1}
                      onClick={() => setActiveLotTab(prev => Math.min(tender.lots.length - 1, prev + 1))}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      {t('lotTabNextBtn', 'Следующий лот →')}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={`p-8 rounded-2xl border text-center text-slate-400 ${theme.cardBg}`}>
            {t('noLotsInTender', 'В тендере отсутствуют лоты')}
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
              <span>{t('customerDocsTitle', 'Документы от заказчика')}</span>
            </h3>
            <span className="text-xs text-slate-400">{tender?.files?.length || 0} {t('filesSuffix', 'файлов')}</span>
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
                {t('noDocumentsAttached', 'Заказчик не прикрепил документы')}
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
                <span>{t('supplierDocsTitle', 'Ваши сертификаты и документы')}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('supplierDocsSubtitle', 'Сертификаты, лицензии, коммерческое предложение (до 25 МБ)')}
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>{t('attachMoreDocsBtn', 'Прикрепить еще документ')}</span>
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
                  {t('dragFilesNotice', 'Перетащите файлы сюда или нажмите для выбора')}
                </div>
                <div className="text-xs text-slate-400">
                  {t('supportedFileFormats25MB', 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG до 25 МБ (до 10 файлов)')}
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
                            <CheckCircle2 size={11} /> {t('attachedBadge', 'Прикреплен')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(idx)} 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title={t('deleteFileTooltip', 'Удалить файл')}
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
              {t('unverifiedProfileBlockNotice', 'Ваш профиль не прошел верификацию. Подача предложений заблокирована.')}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            {/* Левая часть: сумма, индикатор готовности и статистика */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full transition-all shrink-0 ${
                  grandTotal > 0 && pricedItemsCount > 0
                    ? 'bg-blue-600 shadow-sm shadow-blue-500/50 ring-4 ring-blue-100 dark:ring-blue-900/40'
                    : 'bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-900/30'
                }`} />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                    {t('totalOfferAmountTitle', 'Итоговая сумма заявки')}:
                  </span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                  </span>
                </div>
              </div>
              <div className="hidden md:block pl-5 border-l border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {t('selectedLotsCountStr', `Выбрано лотов: ${activeLotIds.length}`, { count: activeLotIds.length, activeLotsCount: activeLotIds.length })}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={12} className={pricedItemsCount > 0 ? "text-emerald-500" : "text-slate-400"} />
                  <span>{t('pricedItemsProgress', `Оценено: ${pricedItemsCount} из ${totalActiveItemsCount} позиций`, { pricedItemsCount, totalActiveItemsCount })}</span>
                </div>
              </div>
            </div>

            {/* Правая часть: подсказка при нуле + кнопки действий */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {grandTotal <= 0 && isVerified && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Info size={14} className="shrink-0" />
                  <span>{t('specifyAtLeastOnePrice', 'Укажите цену хотя бы по одной позиции выбранного лота')}</span>
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
                    : (t('submitProposalBtn', 'Отправить коммерческое предложение'))
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
