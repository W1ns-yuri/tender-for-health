import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';
import { useAlert } from '../context/AlertContext';

// Subcomponents & Constants
import {
  OfferHeader,
  OfferCommercialTermsCard,
  OfferLotsNavigation,
  OfferLotCard,
  OfferDocumentsCard,
  OfferStickyFooter,
  ALLOWED_EXTS,
  MAX_FILE_SIZE_MB,
  formatFileSize,
} from '../components/offer';
import { CatalogFormModal } from '../components/catalogs';

export default function CreateOfferPage({ role = 'SUPPLIER', isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useCallback((key, fallback) => getTranslation(lang, key, fallback), [lang]);
  const theme = getRoleTheme(role, isDarkMode);
  const { showAlert, showConfirm } = useAlert();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(true);

  // Справочники с API
  const [currencies, setCurrencies] = useState([]);
  const [deliveryTerms, setDeliveryTermsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Модалка добавления товара в справочник
  const [catalogModal, setCatalogModal] = useState({
    isOpen: false,
    lotId: null,
    itemIdx: null,
    field: null,
    initialName: ''
  });

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
      API.get('/catalogs/products').catch(() => ({ data: [] })),
      API.get('/catalogs/categories').catch(() => ({ data: [] })),
      API.get('/auth/me').catch(() => ({ data: null }))
    ]).then(([tenderRes, currRes, dtRes, prodRes, catRes, meRes]) => {
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);

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
            requestedName: spec.generalProduct?.tradeName 
              ? `${spec.generalProduct.name} (${spec.generalProduct.tradeName})` 
              : (spec.generalProduct?.name || spec.name || ''),
            generalProductId: spec.generalProductId || null,
            requestedUnit: spec.unit?.name || spec.unit?.shortName || '',
            requestedQty: spec.quantity || 1,
            requestedBrand: spec.manufacturer?.name || '',
            requestedDesc: spec.description || '',
            // Поля предложения поставщика (предзаполнены запросом заказчика)
            haryt: spec.generalProduct?.tradeName 
              ? `${spec.generalProduct.name} (${spec.generalProduct.tradeName})` 
              : (spec.generalProduct?.name || spec.name || ''),
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
  }, [id, role, t]);

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

  const handleOpenCatalogModal = (lotId, itemIdx, field, initialName = '') => {
    setCatalogModal({
      isOpen: true,
      lotId,
      itemIdx,
      field,
      initialName
    });
  };

  const handleSaveProductFromModal = async (savedData) => {
    try {
      const res = await API.post('/catalogs/products', {
        name: savedData.name?.trim(),
        tradeName: savedData.tradeName?.trim() || undefined,
        code: savedData.code?.trim() || undefined,
        description: savedData.description?.trim() || undefined,
        categoryId: savedData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);

        const { lotId, itemIdx, field } = catalogModal;
        if (lotId && itemIdx !== null) {
          const displayName = created.tradeName ? `${created.name} (${created.tradeName})` : created.name;
          handleSpecFieldChange(lotId, itemIdx, field || 'haryt', displayName);
          handleSpecFieldChange(lotId, itemIdx, 'generalProductId', created.id);
          if (created.description) {
            handleSpecFieldChange(lotId, itemIdx, 'desc', created.description);
          }
        }

        setCatalogModal({ isOpen: false, lotId: null, itemIdx: null, field: null, initialName: '' });
        showAlert({
          title: t('successTitle', 'Успешно'),
          message: t('productAddedToCatalog', `Товар "${created.tradeName || created.name}" добавлен в справочник!`),
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Failed to create product in catalog', err);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: err.response?.data?.error || t('errorSaving', 'Ошибка добавления товара в справочник'),
        type: 'error'
      });
    }
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
      generalProductId: item.generalProductId || null,
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
      {/* 1. Верхняя навигация, заголовок, карточка тендера и памятка об эквивалентах */}
      <OfferHeader
        tender={tender}
        isVerified={isVerified}
        grandTotal={grandTotal}
        currencyCode={currencyCode}
        pricedItemsCount={pricedItemsCount}
        totalActiveItemsCount={totalActiveItemsCount}
        theme={theme}
        navigate={navigate}
        t={t}
      />

      {/* 2. Основные параметры вашего предложения */}
      <OfferCommercialTermsCard
        currencies={currencies}
        currency={currency}
        setCurrency={setCurrency}
        paymentTerms={paymentTerms}
        setPaymentTerms={setPaymentTerms}
        comment={comment}
        setComment={setComment}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 3. Таблицы по лотам с вкладками переключения */}
      <div className="space-y-4">
        <OfferLotsNavigation
          tender={tender}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeLotTab={activeLotTab}
          setActiveLotTab={setActiveLotTab}
          selectedLots={selectedLots}
          supplierCategoryIds={supplierCategoryIds}
          calculateLotTotal={calculateLotTotal}
          currencyCode={currencyCode}
          t={t}
        />

        {tender?.lots && tender.lots.length > 0 ? (
          (viewMode === 'tabs' && tender.lots.length > 1
            ? [tender.lots[Math.min(activeLotTab, tender.lots.length - 1)]]
            : tender.lots
          ).map((lot) => {
            const lotIdx = tender.lots.findIndex(l => l.id === lot.id);
            return (
              <OfferLotCard
                key={lot.id}
                lot={lot}
                lotIdx={lotIdx}
                tender={tender}
                viewMode={viewMode}
                activeLotTab={activeLotTab}
                setActiveLotTab={setActiveLotTab}
                selectedLots={selectedLots}
                toggleLotSelection={toggleLotSelection}
                supplierCategoryIds={supplierCategoryIds}
                offerItemsByLot={offerItemsByLot}
                handleSpecFieldChange={handleSpecFieldChange}
                deliveryTerms={deliveryTerms}
                lotDeliveryTerms={lotDeliveryTerms}
                setLotDeliveryTerms={setLotDeliveryTerms}
                calculateLotTotal={calculateLotTotal}
                currencyCode={currencyCode}
                products={products}
                onOpenCatalogModal={handleOpenCatalogModal}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            );
          })
        ) : (
          <div className={`p-8 rounded-2xl border text-center text-slate-400 ${theme?.cardBg || ''}`}>
            {t('noLotsInTender', 'В тендере отсутствуют лоты')}
          </div>
        )}
      </div>

      {/* 4. Документы: Заказчик и Интерактивная Дропзона поставщика */}
      <OfferDocumentsCard
        tender={tender}
        uploadedFiles={uploadedFiles}
        handleRemoveFile={handleRemoveFile}
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        isDragging={isDragging}
        fileUploadError={fileUploadError}
        setFileUploadError={setFileUploadError}
        formatFileSize={formatFileSize}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* 5. Нижняя фиксированная панель действий (Sticky Action Bar) */}
      <OfferStickyFooter
        errorRef={errorRef}
        errorMsg={errorMsg}
        isVerified={isVerified}
        grandTotal={grandTotal}
        currencyCode={currencyCode}
        activeLotIds={activeLotIds}
        pricedItemsCount={pricedItemsCount}
        totalActiveItemsCount={totalActiveItemsCount}
        isSubmitting={isSubmitting}
        handleSubmitOffer={handleSubmitOffer}
        navigate={navigate}
        t={t}
      />

      {/* 6. Модальное окно быстрого добавления товара в каталог для поставщика */}
      {catalogModal.isOpen && (
        <CatalogFormModal
          isOpen={catalogModal.isOpen}
          onClose={() => setCatalogModal({ isOpen: false, lotId: null, itemIdx: null, field: null, initialName: '' })}
          onSave={handleSaveProductFromModal}
          catalogId="productsMNN"
          editingItem={catalogModal.initialName ? { name: catalogModal.initialName } : null}
          categories={categories}
          existingProducts={products}
          role="SUPPLIER"
          theme={theme}
          t={t}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
