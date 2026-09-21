import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Save, Trash2, ChevronDown, AlertCircle, RefreshCw, FileText, AlignLeft, Paperclip, Package, Wrench, Settings2 } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, getCurrencyLabel } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import CatalogFormModal from '../components/CatalogFormModal';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomSelect from '../components/CustomSelect';
import { useAlert } from '../context/AlertContext';

// Запрещенные спецсимволы (<, >, {, }, |, ^, ~, `, \)
const FORBIDDEN_CHARS_REGEX = /[<>{}|^~`\\]/g;

const sanitizeInputText = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(FORBIDDEN_CHARS_REGEX, '');
};

// Кастомное поле выбора даты с модальным календарем в админском стиле
const CustomDateInput = ({ value, onChange, placeholder, isDarkMode, theme, required, min, max, lang, size = 'md', className = '' }) => {
  return (
    <CustomDatePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDarkMode={isDarkMode}
      theme={theme}
      required={required}
      min={min}
      max={max}
      lang={lang}
      size={size}
      className={className}
    />
  );
};

const ProductSearchableSelect = ({
  products,
  value,
  generalProductId,
  onChange,
  onOpenCreateModal,
  placeholder,
  isDarkMode,
  theme,
  lang = 'RU',
  isDuplicate
}) => {
  const t = (key, fallback, params) => getTranslation(lang, key, fallback, params);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: openUpwards ? (rect.top - dropdownHeight - 4) : (rect.bottom + 4),
        left: Math.max(10, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 320) - 10)),
        width: Math.max(rect.width, 320),
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.tradeName && p.tradeName.toLowerCase().includes(search.toLowerCase())) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedProduct = products.find(p => p.id === generalProductId) || products.find(p => p.name === value);

  const handleSelect = (product) => {
    onChange(product.name, product.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleOpenModalAndCloseDropdown = (initialName = '') => {
    setIsOpen(false);
    setSearch('');
    onOpenCreateModal(initialName);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-1">
        <div 
          onClick={() => {
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (nextState) {
              setSearch('');
              updateCoords();
            }
          }}
          className={`flex-1 px-2.5 py-1.5 rounded-md text-xs cursor-pointer flex justify-between items-center transition-all duration-150 font-medium ${
            isDuplicate
              ? 'border border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30'
              : `${theme.inputBg} ${isOpen ? '!border-emerald-500 !ring-2 !ring-emerald-500/25 shadow-xs' : ''}`
          }`}
        >
          <span className={`truncate ${!value && !selectedProduct ? 'opacity-50' : 'text-slate-800 dark:text-slate-100 font-semibold'}`}>
            {selectedProduct ? selectedProduct.name : (value || placeholder)}
          </span>
          <ChevronDown size={14} className="opacity-50 shrink-0 ml-1" />
        </div>

        {/* Кнопка быстрого добавления (+) нового товара в справочник */}
        <button
          type="button"
          onClick={() => handleOpenModalAndCloseDropdown(search || '')}
          className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 transition-colors"
          title={t('addNewProductToCatalog', 'Добавить новый товар в справочник (+)')}
        >
          <Plus size={14} />
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 1000,
          }}
          className={`rounded-xl border shadow-2xl ${theme.cardBg} ${isDarkMode ? 'border-slate-700 bg-slate-900 shadow-black/70' : 'border-slate-200 bg-white shadow-slate-400/40'} max-h-64 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          <div className="p-2 border-b border-slate-200/40 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
            <input
              type="text"
              autoFocus
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg} border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30`}
              placeholder={t('searchProductPlaceholder', 'Поиск товара...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div
                  key={p.id}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition-colors ${
                    (generalProductId === p.id || value === p.name) ? 'bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <span className="truncate">{p.name}</span>
                  {p.code && <span className="text-[10px] text-slate-400 font-mono shrink-0">{p.code}</span>}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                {t('productNotFoundInCatalog', 'Товар не найден в справочнике')}
              </div>
            )}

            {/* Если введен поиск и его нет в результатах - открываем модальное окно с предзаполненным именем */}
            {search.trim().length > 0 && !filteredProducts.some(p => p.name.toLowerCase() === search.trim().toLowerCase()) && (
              <div
                className="p-2.5 text-xs bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 cursor-pointer font-bold flex items-center gap-2 border-t border-emerald-200/50 dark:border-emerald-800/50 transition-colors"
                onClick={() => handleOpenModalAndCloseDropdown(search.trim())}
              >
                <Plus size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">
                  {t('addToCatalogPrompt', `Добавить в справочник: "${search.trim()}"`, { query: search.trim() })}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const DRAFT_KEY = 'tender_creation_form_draft';

const getInitialDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse draft', e);
  }
  return null;
};

export default function CreateTenderPage({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const { showAlert, showConfirm } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const savedDraft = getInitialDraft();

  const [formData, setFormData] = useState(savedDraft?.formData || {
    tenderNumber: '',
    title: '',
    categoryId: '',
    clientId: '',
    type: 'YERLI',
    procurementType: 'GOODS',
    announcementDate: new Date().toISOString().split('T')[0],
    deadline: '',
    description: '',
    technicalSpecs: '',
    status: 'ACYK',
    visibility: 'ACYK',
    currency: 'TMT'
  });

  const [lots, setLots] = useState(savedDraft?.lots || [
    {
      id: Date.now(),
      name: 'Лот 1',
      lotType: 'GOODS',
      deliveryTermId: '',
      deliveryAddress: '',
      workAddress: '',
      workPeriod: '',
      licenseRequired: false,
      serviceFormat: 'ON_SITE',
      slaPeriod: '',
      specs: [
        { id: Date.now(), hk: '1', haryt: '', unit: '', brand: '', mukdar: 1, desc: '' }
      ]
    }
  ]);
  const [docs, setDocs] = useState(savedDraft?.docs || []);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forbiddenBadge, setForbiddenBadge] = useState(null); // { char: string, top: number, left: number }
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);
  const popoverTimeoutRef = useRef(null);

  // Проверка: есть ли в черновике реальные данные для отображения кнопки сброса
  const hasDraftContent = Boolean(
    (formData.title && formData.title.trim() !== '') ||
    (formData.description && formData.description.trim() !== '') ||
    (formData.technicalSpecs && formData.technicalSpecs.trim() !== '') ||
    formData.deadline !== '' ||
    formData.categoryId !== '' ||
    formData.clientId !== '' ||
    docs.length > 0 ||
    lots.some(l => l.name !== 'Лот 1' || l.deliveryTermId !== '' || l.specs.some(s => s.haryt.trim() !== '' || s.desc.trim() !== ''))
  );

  // Автосохранение черновика при любом изменении
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, lots, docs }));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [formData, lots, docs]);

  // Загружаем следующий порядковый номер тендера с сервера
  const fetchNextTenderNumber = async () => {
    try {
      const res = await API.get('/tenders/next-number');
      if (res.data?.nextTenderNumber) {
        setFormData(prev => ({ ...prev, tenderNumber: res.data.nextTenderNumber }));
      }
    } catch (e) {
      console.warn('Failed to fetch next tender number', e);
    }
  };

  // Загружаем справочники с API
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [products, setProducts] = useState([]);
  const [existingTenderNumbers, setExistingTenderNumbers] = useState([]);

  // Модальное окно создания товара через CatalogFormModal
  const [catalogModal, setCatalogModal] = useState({
    isOpen: false,
    catalogId: 'productsMNN',
    editingItem: null,
    lotIdx: null,
    specIdx: null
  });

  const fetchExistingTenders = async () => {
    try {
      const res = await API.get('/tenders');
      if (Array.isArray(res.data)) {
        setExistingTenderNumbers(res.data.map(item => (item.tenderNumber || '').trim().toLowerCase()));
      }
    } catch (e) {
      console.warn('Failed to fetch existing tenders', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get('/catalogs/products');
      if (Array.isArray(res.data)) {
        setProducts(res.data.filter(p => p.isActive));
      }
    } catch (e) {
      console.warn('Failed to fetch products catalog', e);
    }
  };

  const handleOpenProductModal = (initialName = '', lotIdx = null, specIdx = null) => {
    setCatalogModal({
      isOpen: true,
      catalogId: 'productsMNN',
      editingItem: initialName ? { name: initialName } : null,
      lotIdx,
      specIdx
    });
  };

  const handleSaveProductFromModal = async (savedData) => {
    try {
      const res = await API.post('/catalogs/products', {
        name: savedData.name?.trim(),
        tradeName: savedData.tradeName?.trim() || undefined,
        code: savedData.code?.trim() || undefined,
        description: savedData.description?.trim() || undefined,
        categoryId: formData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (catalogModal.lotIdx !== null && catalogModal.specIdx !== null) {
          handleSpecChange(catalogModal.lotIdx, catalogModal.specIdx, 'productSelect', created.name, created.id);
        }
        setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, lotIdx: null, specIdx: null });
      }
    } catch (err) {
      console.error('Failed to create product', err);
      showAlert({ message: err.response?.data?.error || (t('errorTitle', 'Ошибка сохранения товара')), type: 'error' });
    }
  };

  useEffect(() => {
    if (!savedDraft?.formData?.tenderNumber) {
      fetchNextTenderNumber();
    }
    fetchExistingTenders();
    fetchProducts();
    API.get('/catalogs/categories').then(res => { if (Array.isArray(res.data)) setCategories(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/currencies').then(res => { if (Array.isArray(res.data)) setCurrencies(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/units').then(res => {
      if (Array.isArray(res.data)) {
        const activeUnits = res.data.filter(c => c.isActive);
        setUnits(activeUnits);
        if (activeUnits.length > 0) {
          setLots(prevLots => prevLots.map(l => ({
            ...l,
            specs: l.specs.map(s => s.unit ? s : { ...s, unit: activeUnits[0].id })
          })));
        }
      }
    }).catch(() => {});
    API.get('/catalogs/manufacturers').then(res => { if (Array.isArray(res.data)) setManufacturers(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/delivery-terms').then(res => { if (Array.isArray(res.data)) setDeliveryTerms(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/clients').then(res => { if (Array.isArray(res.data)) setClients(res.data.filter(c => c.isActive)); }).catch(() => {});
  }, []);

  const handleClearDraft = async () => {
    const isConfirmed = await showConfirm({
      title: t('resetDraftConfirmTitle', 'Сбросить черновик?'),
      message: t('resetDraftConfirmMessage', 'Вы уверены, что хотите сбросить форму и очистить черновик?'),
      type: 'danger',
      isDanger: true,
      confirmText: t('yesClearBtn', 'Да, очистить'),
      cancelText: t('cancelEditBtn', 'Отмена')
    });
    if (isConfirmed) {
      sessionStorage.removeItem(DRAFT_KEY);
      const defaultUnit = units.length > 0 ? units[0].id : '';
      setFormData({
        tenderNumber: '',
        title: '',
        categoryId: '',
        clientId: '',
        type: 'YERLI',
        announcementDate: new Date().toISOString().split('T')[0],
        deadline: '',
        description: '',
        technicalSpecs: '',
        status: 'ACYK',
        visibility: 'ACYK',
        currency: 'TMT'
      });
      setLots([
        {
          id: Date.now(),
          name: 'Лот 1',
          deliveryTermId: '',
          specs: [
            { id: Date.now(), hk: '1', haryt: '', unit: defaultUnit, brand: '', mukdar: 1, desc: '' }
          ]
        }
      ]);
      setDocs([]);
      setErrorMsg('');
      fetchNextTenderNumber();
    }
  };

  // Показ компактного всплывающего окошка прямо над активным элементом ввода
  const triggerForbiddenCharBadge = (e, char) => {
    if (!e || !e.target) return;
    const rect = e.target.getBoundingClientRect();
    setForbiddenBadge({
      char: char || '<',
      top: rect.top - 36,
      left: rect.left + Math.min(rect.width / 2, 100),
    });

    if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
    popoverTimeoutRef.current = setTimeout(() => {
      setForbiddenBadge(null);
    }, 2500);
  };

  // Проверка дублирования товара в пределах одного лота
  const isDuplicateProduct = (lotIdx, specIdx, productName) => {
    if (!productName || !productName.trim()) return false;
    const clean = productName.trim().toLowerCase();
    const lot = lots[lotIdx];
    if (!lot || !lot.specs) return false;
    return lot.specs.some((s, idx) => idx !== specIdx && (s.haryt || '').trim().toLowerCase() === clean);
  };

  // Добавление новой строки в таблицу позиций лота
  const handleAddSpecRow = (lotIdx) => {
    const updated = [...lots];
    const defaultUnitId = units.length > 0 ? units[0].id : '';
    updated[lotIdx].specs.push({
      id: Date.now() + Math.random(),
      hk: (updated[lotIdx].specs.length + 1).toString(),
      haryt: '',
      unit: defaultUnitId,
      brand: '',
      mukdar: 1,
      desc: ''
    });
    setLots(updated);
  };

  // Изменение ячейки в строке товара с санитизацией спецсимволов и поддержкой выбора из справочника
  const handleSpecChange = (lotIdx, specIdx, field, value, extraParam) => {
    setLots(prev => {
      const nextLots = [...prev];
      const nextLot = { ...nextLots[lotIdx] };
      const nextSpecs = [...nextLot.specs];

      if (field === 'productSelect') {
        nextSpecs[specIdx] = {
          ...nextSpecs[specIdx],
          haryt: value,
          name: value,
          generalProductId: extraParam || null
        };
      } else {
        let sanitizedValue = value;
        if (typeof value === 'string' && FORBIDDEN_CHARS_REGEX.test(value)) {
          const match = value.match(FORBIDDEN_CHARS_REGEX);
          const invalidChar = match ? match[0] : '<';
          sanitizedValue = sanitizeInputText(value);
          if (extraParam && extraParam.target) triggerForbiddenCharBadge(extraParam, invalidChar);
        }
        nextSpecs[specIdx] = { ...nextSpecs[specIdx], [field]: sanitizedValue };
      }

      nextLot.specs = nextSpecs;
      nextLots[lotIdx] = nextLot;
      return nextLots;
    });
  };

  // Удаление строки товара из таблицы лота
  const handleRemoveSpec = (lotIdx, specIdx) => {
    const updated = [...lots];
    updated[lotIdx].specs = updated[lotIdx].specs.filter((_, i) => i !== specIdx);
    updated[lotIdx].specs.forEach((s, i) => {
      s.hk = (i + 1).toString();
    });
    setLots(updated);
  };
  
  // Добавление нового лота
  const handleAddLot = () => {
    const defaultUnitId = units.length > 0 ? units[0].id : '';
    const initialLotType = formData.procurementType === 'SERVICES_WORKS' ? 'WORKS' : 'GOODS';
    let initialHaryt = '';
    if (initialLotType === 'WORKS') initialHaryt = t('worksScopeDefault', 'Выполнение комплекса работ согласно ТЗ и смете');
    if (initialLotType === 'SERVICES') initialHaryt = t('servicesScopeDefault', 'Оказание услуг согласно техническому заданию');

    setLots([
      ...lots,
      {
        id: Date.now(),
        name: `Лот ${lots.length + 1}`,
        lotType: initialLotType,
        deliveryTermId: '',
        deliveryAddress: '',
        workAddress: '',
        workPeriod: '',
        licenseRequired: false,
        serviceFormat: 'ON_SITE',
        slaPeriod: '',
        specs: [
          { id: Date.now() + 1, hk: '1', haryt: initialHaryt, unit: defaultUnitId, brand: '', mukdar: 1, desc: '' }
        ]
      }
    ]);
  };
  
  // Удаление лота
  const handleRemoveLot = (lotIdx) => {
    if (lots.length === 1) return showAlert({ message: t('atLeastOneLotRequired', 'Должен быть хотя бы один лот'), type: 'warning' });
    setLots(lots.filter((_, i) => i !== lotIdx));
  };
  
  // Изменение полей лота (название, условия поставки, тип лота)
  const handleLotChange = (lotIdx, field, value, e) => {
    let sanitizedValue = value;
    if (typeof value === 'string' && FORBIDDEN_CHARS_REGEX.test(value)) {
      const match = value.match(FORBIDDEN_CHARS_REGEX);
      const invalidChar = match ? match[0] : '<';
      sanitizedValue = sanitizeInputText(value);
      if (e) triggerForbiddenCharBadge(e, invalidChar);
    }
    const updated = [...lots];
    updated[lotIdx][field] = sanitizedValue;

    // При смене типа лота на Работы или Услуги, гарантируем наличие дефолтной позиции, если список пуст
    if (field === 'lotType') {
      const defaultUnitId = units.length > 0 ? units[0].id : '';
      if (!updated[lotIdx].specs || updated[lotIdx].specs.length === 0) {
        let initialHaryt = '';
        if (sanitizedValue === 'WORKS') initialHaryt = t('worksScopeDefault', 'Выполнение комплекса работ согласно ТЗ и смете');
        if (sanitizedValue === 'SERVICES') initialHaryt = t('servicesScopeDefault', 'Оказание услуг согласно техническому заданию');
        updated[lotIdx].specs = [
          { id: Date.now(), hk: '1', haryt: initialHaryt, unit: defaultUnitId, brand: '', mukdar: 1, desc: '' }
        ];
      } else if (updated[lotIdx].specs.length === 1 && !updated[lotIdx].specs[0].haryt) {
        if (sanitizedValue === 'WORKS') updated[lotIdx].specs[0].haryt = t('worksScopeDefault', 'Выполнение комплекса работ согласно ТЗ и смете');
        if (sanitizedValue === 'SERVICES') updated[lotIdx].specs[0].haryt = t('servicesScopeDefault', 'Оказание услуг согласно техническому заданию');
      }
    }

    setLots(updated);
  };

  const handleFormChange = (field, value, e) => {
    let sanitizedValue = value;
    if (typeof value === 'string' && FORBIDDEN_CHARS_REGEX.test(value)) {
      const match = value.match(FORBIDDEN_CHARS_REGEX);
      const invalidChar = match ? match[0] : '<';
      sanitizedValue = sanitizeInputText(value);
      if (e) triggerForbiddenCharBadge(e, invalidChar);
    }
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      setLoading(true);
      setErrorMsg('');
      const response = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const docId = response.data?.id || response.data?.file?.id;

      const newDoc = {
        id: docId,
        name: response.data?.fileName || file.name,
        desc: t('uploadedFile', 'Загруженный файл'),
        type: file.name.split('.').pop().toUpperCase(),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('ru-RU')
      };

      setDocs([...docs, newDoc]);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('fileUploadError', 'Ошибка загрузки файла') + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const scrollToError = () => {
    setTimeout(() => {
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const isTenderNumberDuplicate = Boolean(
    formData.tenderNumber && 
    formData.tenderNumber.trim() !== '' &&
    existingTenderNumbers.includes(formData.tenderNumber.trim().toLowerCase())
  );

  const hasValidSpecs = lots.some(lot => lot.specs.some(s => s.haryt && s.haryt.trim() !== ''));
  const isFormValid = Boolean(
    formData.title && formData.title.trim() !== '' &&
    formData.announcementDate &&
    formData.deadline &&
    formData.clientId &&
    formData.categoryId &&
    hasValidSpecs &&
    !isTenderNumberDuplicate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 0. Проверка уникальности номера тендера
    if (isTenderNumberDuplicate) {
      setErrorMsg(t('tenderNumberDuplicateError', `Тендер с номером "${formData.tenderNumber}" уже существует в системе! Пожалуйста, укажите другой номер или нажмите кнопку "Авто".`, { tenderNumber: formData.tenderNumber }));
      setLoading(false);
      scrollToError();
      return;
    }

    // 1. Проверка заполненности позиций в каждом лоте
    for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
      const lot = lots[lotIdx];
      const validSpecs = (lot.specs || []).filter(s => s.haryt && s.haryt.trim() !== '');
      if (validSpecs.length === 0) {
        setErrorMsg(t('lotEmptySpecsError', `В лоте "${lot.name}" нет заполненных позиций. В каждом лоте должна быть хотя бы одна позиция / этап работ.`, { lotName: lot.name }));
        setLoading(false);
        scrollToError();
        return;
      }
    }

    // 2. Проверка дубликатов внутри каждого лота
    for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
      const lot = lots[lotIdx];
      const seenNames = new Set();
      for (const spec of lot.specs) {
        const name = (spec.haryt || '').trim().toLowerCase();
        if (name) {
          if (seenNames.has(name)) {
            setErrorMsg(t('lotDuplicateItemError', `В лоте "${lot.name}" товар "${spec.haryt}" указан дважды. Пожалуйста, удалите или переименуйте дубликат.`, { lotName: lot.name, itemName: spec.haryt }));
            setLoading(false);
            scrollToError();
            return;
          }
          seenNames.add(name);
        }
      }
    }

    // 3. Проверка обязательных полей
    if (!formData.title || !formData.announcementDate || !formData.deadline || !formData.clientId || !formData.categoryId) {
      setErrorMsg(t('fillRequired', 'Заполните обязательные поля (Название, Категория, Заказчик, Даты)'));
      setLoading(false);
      scrollToError();
      return;
    }

    // 4. Проверка соотношения дат: дедлайн должен быть строго позже даты объявления
    const announceDate = new Date(formData.announcementDate);
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= announceDate) {
      setErrorMsg(t('deadlineMustBeAfterAnnouncementError', 'Крайний срок подачи заявок (дедлайн) должен быть позже даты объявления тендера!'));
      setLoading(false);
      scrollToError();
      return;
    }

    try {
      await API.post('/tenders', {
        tenderNumber: formData.tenderNumber ? sanitizeInputText(formData.tenderNumber).trim() : undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        status: formData.status,
        visibility: formData.visibility,
        categoryId: formData.categoryId !== '' ? formData.categoryId : undefined,
        clientId: formData.clientId !== '' ? formData.clientId : undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        lots: lots.map(lot => ({
          name: sanitizeInputText(lot.name),
          lotType: lot.lotType || 'GOODS',
          deliveryTermId: lot.lotType === 'GOODS' ? (lot.deliveryTermId || undefined) : undefined,
          deliveryAddress: lot.deliveryAddress ? sanitizeInputText(lot.deliveryAddress).trim() : undefined,
          workAddress: lot.workAddress ? sanitizeInputText(lot.workAddress).trim() : undefined,
          workPeriod: lot.workPeriod ? sanitizeInputText(lot.workPeriod).trim() : undefined,
          licenseRequired: Boolean(lot.licenseRequired),
          serviceFormat: lot.serviceFormat || undefined,
          slaPeriod: lot.slaPeriod ? sanitizeInputText(lot.slaPeriod).trim() : undefined,
          specs: lot.specs
            .filter(s => s.haryt && s.haryt.trim() !== '')
            .map((s, idx) => ({
              positionNumber: idx + 1,
              generalProductId: s.generalProductId || undefined,
              name: sanitizeInputText(s.haryt).trim(),
              quantity: parseFloat(s.mukdar) || 1,
              unitId: s.unit || undefined,
              manufacturerId: s.brand || undefined,
              description: sanitizeInputText(s.desc).trim()
            }))
        })),
        documents: docs.map(d => d.id).filter(Boolean)
      });

      await showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('tenderCreatedSuccess', 'Тендер успешно создан!'),
        type: 'success'
      });
      sessionStorage.removeItem(DRAFT_KEY);
      if (onNavigate) onNavigate('tenders');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.details || err.message || 'Ошибка сервера при создании тендера');
      scrollToError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Аккуратное всплывающее окошко прямо над активным полем при попытке ввода запрещенного символа */}
      {forbiddenBadge && (
        <div
          style={{
            position: 'fixed',
            top: `${forbiddenBadge.top}px`,
            left: `${forbiddenBadge.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 99999,
          }}
          className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-xl border pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 ${
            isDarkMode
              ? 'bg-[#0f172a] text-slate-100 border-slate-700 shadow-black/50'
              : 'bg-white text-slate-800 border-slate-200 shadow-slate-400/30'
          }`}
        >
          <span className="text-amber-500 font-bold text-xs">⚠️</span>
          <span>{t('forbiddenCharNotice', `Символ "${forbiddenBadge.char}" недопустим`, { char: forbiddenBadge.char })}</span>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
              isDarkMode ? 'border-t-[#0f172a]' : 'border-t-white'
            }`}
          />
        </div>
      )}

      {/* 1. Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${theme.primaryText}`}>
            {t('createTenderBtn', 'Täze tender döretmek')}
          </h2>
          <p className={`text-xs ${theme.subText} mt-0.5`}>
            {t('createTenderSubtitle', 'Форма публикации нового тендерного лота')}
          </p>
        </div>

        {/* Кнопка "Сбросить черновик" отображается ТОЛЬКО если есть введенные данные */}
        {hasDraftContent && (
          <button
            type="button"
            onClick={handleClearDraft}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-500 transition-colors flex items-center gap-1.5 shadow-xs animate-in fade-in"
            title={t('clearDraftAndRestart', 'Очистить черновик и начать сначала')}
          >
            <Trash2 size={14} />
            <span>{t('clearBtn', 'Очистить черновик')}</span>
          </button>
        )}
      </div>

      {/* 2. Форма ввода данных, упакованная в аккуратные белые блоки-карточки */}
      <form id="create-tender-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Карточка 1: Основные параметры */}
        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${theme.tableCardBorderTop}`}>
          <div className={`p-4 border-b flex items-center justify-between rounded-t-2xl ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('mainParametersTitle', 'Основные параметры')}</h3>
                <p className="text-[11px] text-slate-400">{t('mainParametersSubtitle', 'Номер, наименование, категория и сроки подачи')}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Строка 1: Номер тендера (с генерацией и кастомизацией) + Название */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold flex items-center">
                    {t('tenderNumberTitle', 'Номер тендера')}*
                  </label>
                  <button
                    type="button"
                    onClick={fetchNextTenderNumber}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                    title={t('generateNextNumberTooltip', 'Сгенерировать следующий системный номер')}
                  >
                    <RefreshCw size={11} />
                    <span>{t('autoGenerateBadge', 'Авто')}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="TNDR-2026-08-001"
                  value={formData.tenderNumber}
                  onChange={(e) => handleFormChange('tenderNumber', e.target.value, e)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-150 ${
                    isTenderNumberDuplicate
                      ? 'border border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25'
                      : `${theme.inputBg}`
                  }`}
                />
                {isTenderNumberDuplicate && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 animate-in fade-in flex items-center gap-1">
                    <span>⚠️</span>
                    <span>
                      {t('tenderNumberTakenNotice', `Номер "${formData.tenderNumber}" уже занят другим тендером!`, { tenderNumber: formData.tenderNumber })}
                    </span>
                  </p>
                )}
              </div>

              <div className="md:col-span-8">
                <label className="block font-semibold mb-1">
                  {t('tenderName', 'Tender ady')}*
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('tenderTitlePlaceholder', 'Введите название предмета тендера...')}
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value, e)}
                  className={`w-full px-3 py-2 rounded-lg text-xs transition-all duration-150 ${theme.inputBg}`}
                />
              </div>
            </div>

            {/* Строка 2: Категория, Направление закупки, Заказчик, Тип */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold mb-1">{t('category', 'Kategoriýa')}*</label>
                <CustomSelect 
                  options={categories} 
                  value={formData.categoryId} 
                  onChange={(val) => handleFormChange('categoryId', val)} 
                  placeholder={t('selectCategory', 'Выберите категорию')} 
                  searchable={true}
                  isDarkMode={isDarkMode} 
                  theme={theme} 
                  t={t}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('procurementCategory', 'Направление закупки')}*</label>
                <CustomSelect
                  options={[
                    { id: 'GOODS', name: t('supplyOfGoodsCategory', 'Поставка товаров') },
                    { id: 'SERVICES_WORKS', name: t('worksAndServicesCategory', 'Работы и услуги') },
                    { id: 'MIXED', name: t('mixedComplexCategory', 'Смешанный (Комплексный)') }
                  ]}
                  value={formData.procurementType}
                  onChange={(val) => handleFormChange('procurementType', val)}
                  placeholder={t('procurementCategory', 'Направление закупки')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('client', 'Sargyt ediji')}*</label>
                <CustomSelect 
                  options={clients} 
                  value={formData.clientId} 
                  onChange={(val) => handleFormChange('clientId', val)} 
                  placeholder={t('select', 'Saýlaň...')} 
                  searchable={true}
                  isDarkMode={isDarkMode} 
                  theme={theme} 
                  t={t}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('type', 'Görnüşi')}*</label>
                <CustomSelect
                  options={[
                    { id: 'YERLI', name: t('typeLocal', 'Ýerli') },
                    { id: 'HALKARA', name: t('typeGlobal', 'Halkara') }
                  ]}
                  value={formData.type}
                  onChange={(val) => handleFormChange('type', val)}
                  placeholder={t('type', 'Görnüşi')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>
            </div>

            {/* Строка 3: Даты, Валюта */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">{t('announcementDate', 'Yglan edilen senesi')}*</label>
                <CustomDateInput
                  required
                  value={formData.announcementDate}
                  onChange={(val) => handleFormChange('announcementDate', val)}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  lang={lang}
                  placeholder={t('dateFormatPlaceholder', 'ДД.ММ.ГГГГ')}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('deadline', 'Soňky möhleti')}*</label>
                <CustomDateInput
                  required
                  value={formData.deadline}
                  onChange={(val) => handleFormChange('deadline', val)}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  lang={lang}
                  min={formData.announcementDate || undefined}
                  placeholder={t('dateFormatPlaceholder', 'ДД.ММ.ГГГГ')}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('currency', 'Walýuta')}*</label>
                <CustomSelect
                  options={currencies.map(c => ({ id: c.code, name: getCurrencyLabel(c) }))}
                  value={formData.currency}
                  onChange={(val) => handleFormChange('currency', val)}
                  placeholder={t('currency', 'Walýuta')}
                  searchable={currencies.length > 5}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>
            </div>

            {/* Строка 4: Статус и видимость */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">{t('status', 'Status')}*</label>
                <CustomSelect
                  options={[
                    { id: 'ACYK', name: t('statusAcyk', 'Açyk') },
                    { id: 'TASLAMA', name: t('statusTaslama', 'Taslama') },
                    { id: 'YAPYK', name: t('statusYapyk', 'Ýapyk') }
                  ]}
                  value={formData.status}
                  onChange={(val) => handleFormChange('status', val)}
                  placeholder={t('status', 'Status')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('visibility', 'Açyklygy')}*</label>
                <CustomSelect
                  options={[
                    { id: 'ACYK', name: t('visibilityPublic', 'Açyk') },
                    { id: 'YAPYK', name: t('visibilityPrivate', 'Ýapyk') }
                  ]}
                  value={formData.visibility}
                  onChange={(val) => handleFormChange('visibility', val)}
                  placeholder={t('visibility', 'Açyklygy')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Карточка 2: Описание и технические требования */}
        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <AlignLeft size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('descAndTechSpecsTitle', 'Описание и технические требования')}</h3>
                <p className="text-[11px] text-slate-400">{t('descAndTechSpecsSubtitle', 'Подробные условия закупки, стандарты качества и технические условия')}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Описание */}
            <div>
              <label className="block font-semibold mb-1">
                {t('description', 'Tender mazmuny')}*
              </label>
              <textarea
                rows={3}
                required
                placeholder={t('procurementDescriptionPlaceholder', 'Подробное описание предмета закупки...')}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value, e)}
                className={`w-full p-3 rounded-lg text-xs leading-relaxed ${theme.inputBg}`}
              />
            </div>

            {/* Технические условия */}
            <div>
              <label className="block font-semibold mb-1">
                {t('techSpecs', 'Tehniki şartler')}*
              </label>
              <textarea
                rows={3}
                required
                placeholder={t('technicalRequirementsPlaceholder', 'Технические требования к продукции...')}
                value={formData.technicalSpecs}
                onChange={(e) => handleFormChange('technicalSpecs', e.target.value, e)}
                className={`w-full p-3 rounded-lg text-xs leading-relaxed ${theme.inputBg}`}
              />
            </div>
          </div>
        </div>

      {/* 3. Лоты и Спецификации */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className={`font-bold text-lg ${theme.primaryText}`}>{t('lotsAndPositionsTitle', 'Лоты и позиции')}</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              {lots.length} {t('lotLabel', 'лот')}
            </span>
          </div>
        </div>

        {lots.map((lot, lotIdx) => {
          const currentLotType = lot.lotType || 'GOODS';

          return (
            <div key={lot.id} className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
              <div className={`p-4 border-b space-y-3.5 ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'}`}>
                {/* 1. Верхняя линия лота: Название + Переключатель типа + Кнопка удаления */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                      {lotIdx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={lot.name}
                      onChange={(e) => handleLotChange(lotIdx, 'name', e.target.value, e)}
                      placeholder={t('lotNamePlaceholder', 'Напр: Лот 1: Оборудование')}
                      className={`w-full max-w-sm px-3 py-1.5 rounded-lg text-sm font-bold ${theme.inputBg}`}
                    />
                  </div>

                  {/* Переключатель типа предмета лота (Товары, Работы, Услуги) */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleLotChange(lotIdx, 'lotType', 'GOODS')}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentLotType === 'GOODS'
                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Package size={13} />
                        <span>{t('catProductsSub', 'Товары / Материалы')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLotChange(lotIdx, 'lotType', 'WORKS')}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentLotType === 'WORKS'
                            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Wrench size={13} />
                        <span>{t('worksMaintenanceType', 'Работы / Ремонт')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLotChange(lotIdx, 'lotType', 'SERVICES')}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentLotType === 'SERVICES'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Settings2 size={13} />
                        <span>{t('servicesType', 'Услуги / Сервис')}</span>
                      </button>
                    </div>

                    {lots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLot(lotIdx)}
                        className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                        title={t('deleteLotBtn', 'Удалить лот')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Динамические поля лота в зависимости от типа */}
                {currentLotType === 'GOODS' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('incotermsTermsTitle', 'Условия поставки (Incoterms)')}*
                      </label>
                      <CustomSelect
                        options={deliveryTerms.map(dt => ({ id: dt.id, name: `${dt.shortName} — ${dt.name}` }))}
                        value={lot.deliveryTermId}
                        onChange={(val) => handleLotChange(lotIdx, 'deliveryTermId', val)}
                        placeholder={t('selectIncotermsPlaceholder', 'Выберите условие поставки...')}
                        searchable={deliveryTerms.length > 5}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        t={t}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('warehouseAddressTitle', 'Склад / Адрес доставки')}
                      </label>
                      <input
                        type="text"
                        value={lot.deliveryAddress || ''}
                        onChange={(e) => handleLotChange(lotIdx, 'deliveryAddress', e.target.value, e)}
                        placeholder={t('deliveryAddressPlaceholder', 'Напр: г. Ашхабад, Центр кардиологии, Склад №2')}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${theme.inputBg}`}
                      />
                    </div>
                  </div>
                )}

                {currentLotType === 'WORKS' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('workSiteAddressTitle', 'Адрес объекта выполнения работ')}*
                      </label>
                      <input
                        type="text"
                        required
                        value={lot.workAddress || ''}
                        onChange={(e) => handleLotChange(lotIdx, 'workAddress', e.target.value, e)}
                        placeholder={t('workSiteAddressPlaceholder', 'Напр: г. Аркадаг, Корпус Б')}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${theme.inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('executionTimelineTitle', 'Срок выполнения (график)')}
                      </label>
                      <input
                        type="text"
                        value={lot.workPeriod || ''}
                        onChange={(e) => handleLotChange(lotIdx, 'workPeriod', e.target.value, e)}
                        placeholder={t('executionTimelinePlaceholder', 'Напр: 45 календарных дней')}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${theme.inputBg}`}
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(lot.licenseRequired)}
                          onChange={(e) => handleLotChange(lotIdx, 'licenseRequired', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{t('constructionLicenseRequired', 'Требуется строительная лицензия')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {currentLotType === 'SERVICES' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('serviceFormatTitle', 'Формат оказания услуг')}*
                      </label>
                      <CustomSelect
                        options={[
                          { id: 'ON_SITE', name: t('onCustomerSiteFormat', 'На объекте заказчика') },
                          { id: 'REMOTE', name: t('remoteFormat', 'Удаленно') },
                          { id: 'HYBRID', name: t('hybridFormatOption', 'Гибридный формат') }
                        ]}
                        value={lot.serviceFormat || 'ON_SITE'}
                        onChange={(val) => handleLotChange(lotIdx, 'serviceFormat', val)}
                        placeholder={t('deliveryFormatTitle', 'Формат оказания')}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        t={t}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t('slaRegulationTitle', 'Срок действия / регламент SLA')}
                      </label>
                      <input
                        type="text"
                        value={lot.slaPeriod || ''}
                        onChange={(e) => handleLotChange(lotIdx, 'slaPeriod', e.target.value, e)}
                        placeholder={t('slaRegulationPlaceholder', 'Напр: 12 месяцев, реагирование 24/7')}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${theme.inputBg}`}
                      />
                    </div>
                  </div>
                )}
              </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-180">
                <thead className={theme.tableHeaderBg}>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-50">
                      {currentLotType === 'WORKS' 
                        ? (t('workStageRequiredTitle', 'Этап / вид работ *'))
                        : currentLotType === 'SERVICES'
                        ? (t('serviceNameRequiredTitle', 'Наименование услуги *'))
                        : `${t('specProduct', 'Haryt')} *`}
                    </th>
                    <th className="py-3 px-3 w-40 text-center">{t('specUnit', 'Ölçeg birligi')} *</th>
                    {currentLotType === 'GOODS' && (
                      <th className="py-3 px-3 w-48 text-center">{t('specBrand', 'Öndüriji')}</th>
                    )}
                    <th className="py-3 px-3 w-32 text-center whitespace-nowrap">
                      {currentLotType === 'SERVICES' 
                        ? (t('volumePeriodRequiredTitle', 'Объем / Период *'))
                        : `${t('specQty', 'Mukdar')} *`}
                    </th>
                    <th className="py-3 px-3 min-w-55">
                      {currentLotType === 'WORKS'
                        ? (t('scopeOfWork', 'Состав и спецификация работ'))
                        : currentLotType === 'SERVICES'
                        ? (t('serviceRegulations', 'Регламент и описание услуги'))
                        : t('specDesc', 'Mazmuny')}
                    </th>
                    <th className="py-3 px-3 w-12 text-center">{t('action', 'Amal')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {lot.specs.length === 0 ? (
                    <tr>
                      <td colSpan={currentLotType === 'GOODS' ? 7 : 6} className="py-8 text-center text-slate-400">
                        <p className="text-xs mb-2.5">
                          {currentLotType === 'WORKS'
                            ? (t('noStagesInLotYet', 'В этом лоте пока нет этапов работ'))
                            : currentLotType === 'SERVICES'
                            ? (t('noServicesInLotYet', 'В этом лоте пока нет позиций услуг'))
                            : (t('noPositionsInLotYet', 'В этом лоте пока нет позиций'))}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddSpecRow(lotIdx)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus size={14} />
                          {currentLotType === 'WORKS'
                            ? (t('addWorkStage', 'Добавить этап / вид работ'))
                            : currentLotType === 'SERVICES'
                            ? (t('addServicePosition', 'Добавить позицию услуги'))
                            : (t('addFirstPositionBtn', 'Добавить первую позицию'))}
                        </button>
                      </td>
                    </tr>
                  ) : lot.specs.map((item, idx) => {
                    const isDup = currentLotType === 'GOODS' && isDuplicateProduct(lotIdx, idx, item.haryt);

                    return (
                      <tr key={item.id || idx} className={`${theme.tableRowHover} transition-colors ${isDup ? 'bg-rose-50/20' : ''}`}>
                        <td className="py-2.5 px-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                        
                        {/* Поле 1: Для товаров - каталог MNN, для работ и услуг - свободный ввод наименования */}
                        <td className="py-2.5 px-3 min-w-60">
                          {currentLotType === 'GOODS' ? (
                            <>
                              <ProductSearchableSelect
                                products={products}
                                value={item.haryt}
                                generalProductId={item.generalProductId}
                                placeholder={t('selectOrSearchProductPlaceholder', 'Выберите или найдите товар...')}
                                onChange={(prodName, prodId) => handleSpecChange(lotIdx, idx, 'productSelect', prodName, prodId)}
                                onOpenCreateModal={(initialText) => handleOpenProductModal(initialText, lotIdx, idx)}
                                isDarkMode={isDarkMode}
                                theme={theme}
                                lang={lang}
                                isDuplicate={isDup}
                              />
                              {isDup && (
                                <span className="block text-[10px] text-rose-500 font-semibold mt-1">
                                  ⚠️ {t('itemAlreadyInLotNotice', 'Этот товар уже есть в данном лоте')}
                                </span>
                              )}
                            </>
                          ) : (
                            <input
                              type="text"
                              required
                              value={item.haryt}
                              onChange={(e) => handleSpecChange(lotIdx, idx, 'haryt', e.target.value, e)}
                              placeholder={
                                currentLotType === 'WORKS'
                                  ? (t('workExamplePlaceholder', 'Напр: Демонтажные работы, монтаж системы...'))
                                  : (t('serviceExamplePlaceholder', 'Напр: Сервисное и техническое обслуживание...'))
                              }
                              className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${theme.inputBg}`}
                            />
                          )}
                        </td>

                        {/* Поле 2: Ед. изм. */}
                        <td className="py-2.5 px-3">
                          <CustomSelect
                            size="sm"
                            options={units.map(u => ({ id: u.id, name: `${u.name} (${u.shortName})` }))}
                            value={item.unit}
                            onChange={(val) => handleSpecChange(lotIdx, idx, 'unit', val)}
                            placeholder={t('select', 'Выберите...')}
                            searchable={units.length > 6}
                            isDarkMode={isDarkMode}
                            theme={theme}
                            t={t}
                          />
                        </td>

                        {/* Поле 3: Производитель (только для товаров, для работ/услуг скрыто) */}
                        {currentLotType === 'GOODS' && (
                          <td className="py-2.5 px-3">
                            <CustomSelect
                              size="sm"
                              options={[
                                { id: '', name: t('notSpecified', 'Не указан') },
                                ...manufacturers.map(m => ({ id: m.id, name: m.name }))
                              ]}
                              value={item.brand || ''}
                              onChange={(val) => handleSpecChange(lotIdx, idx, 'brand', val)}
                              placeholder={t('notSpecified', 'Не указан')}
                              searchable={manufacturers.length > 5}
                              isDarkMode={isDarkMode}
                              theme={theme}
                              t={t}
                            />
                          </td>
                        )}

                        {/* Поле 4: Количество / Объем */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={item.mukdar}
                            onChange={(e) => handleSpecChange(lotIdx, idx, 'mukdar', Number(e.target.value))}
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs text-center font-bold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${theme.inputBg}`}
                          />
                        </td>

                        {/* Поле 5: Описание (Auto-expanding Textarea) */}
                        <td className="py-2.5 px-3">
                          <textarea
                            rows={1}
                            placeholder={
                              currentLotType === 'WORKS'
                                ? (t('scopeOfWorkPlaceholder', 'Состав работ / ТЗ...'))
                                : currentLotType === 'SERVICES'
                                ? (t('maintenanceRegulationsPlaceholder', 'Регламент обслуживания...'))
                                : (t('specsDescriptionPlaceholder', 'Характеристики / Описание...'))
                            }
                            value={item.desc}
                            onChange={(e) => {
                              handleSpecChange(lotIdx, idx, 'desc', e.target.value, e);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            }}
                            onFocus={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            }}
                            style={{ minHeight: '34px', maxHeight: '120px' }}
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-normal resize-y ${theme.inputBg}`}
                          />
                        </td>

                        {/* Поле 6: Удалить */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(lotIdx, idx)}
                            className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer mx-auto"
                            title={t('delete', 'Удалить позицию')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Подвал лота с отцентрированной кнопкой добавления строки */}
            <div className={`p-3.5 border-t flex justify-center items-center ${isDarkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
              <button
                type="button"
                onClick={() => handleAddSpecRow(lotIdx)}
                className="px-6 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>
                  {currentLotType === 'WORKS'
                    ? (t('addWorkStage', 'Добавить этап / вид работ'))
                    : currentLotType === 'SERVICES'
                    ? (t('addServicePosition', 'Добавить позицию услуги'))
                    : (t('addItemToLotBtn', 'Добавить позицию в лот'))}
                </span>
              </button>
            </div>
          </div>
        );
      })}

        {/* Кнопка "Добавить лот" под всеми лотами */}
        <button
          type="button"
          onClick={handleAddLot}
          className={`w-full py-3.5 px-6 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-bold group shadow-xs hover:shadow-sm active:scale-[0.99] cursor-pointer ${
            isDarkMode
              ? 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300'
              : 'border-emerald-500/40 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs">
            <Plus size={15} />
          </div>
          <span>{t('addNewLotBtn', 'Добавить новый лот')}</span>
        </button>
      </div>

      {/* 4. Документы */}
      <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Paperclip size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t('documents', 'Resminamalar')}</h3>
              <p className="text-[11px] text-slate-400">{t('attachTenderDocsSubtitle', 'Прикрепите сопутствующие тендерные документы и спецификации')}</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button type="button" onClick={handleFileClick} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer">
            <Plus size={15} />
            <span>{t('uploadFileBtn', 'Загрузить файл')}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={theme.tableHeaderBg}>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-[5%] text-center">#</th>
                <th className="py-3 px-4 w-[25%]">{t('fileName', 'Faýl ady')}</th>
                <th className="py-3 px-4 w-[35%]">{t('fileDesc', 'Mazmuny')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('fileType', 'Görnüşi')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('fileSize', 'Ölçegi')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('uploadDate', 'Ýüklenen senesi')}</th>
                <th className="py-3 px-4 text-center w-[5%]">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {t('noDocs', 'Документы пока не загружены')}
                  </td>
                </tr>
              ) : docs.map((doc, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold truncate max-w-xs">{doc.name}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{doc.desc}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{doc.type}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.size}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.date}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setDocs(docs.filter((_, i) => i !== idx))}
                      className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer mx-auto"
                      title={t('deleteDocumentTooltip', 'Удалить документ')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </form>

      {/* Сообщение об ошибке (если есть) */}
      {errorMsg && (
        <div ref={errorRef} className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-bottom-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 5. Плавающая нижняя панель сохранения (Sticky footer) */}
      <div className="sticky bottom-0 z-40 -mx-4 sm:-mx-6 -mb-6 px-4 sm:px-6 py-3 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full transition-colors ${
            isFormValid
              ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
              : 'bg-slate-400 dark:bg-slate-600'
          }`}></span>
          <span className={`font-medium transition-colors ${
            isFormValid
              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {isFormValid
              ? (t('allRequiredFieldsFilled', 'Все обязательные поля заполнены'))
              : (t('fillRequiredFieldsPrompt', 'Заполните обязательные поля (*)'))}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {hasDraftContent && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-400 transition-all active:scale-95 cursor-pointer"
            >
              {t('clearBtn', 'Очистить черновик')}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              handleFormChange('status', 'TASLAMA');
              setTimeout(() => {
                document.getElementById('create-tender-form')?.requestSubmit();
              }, 50);
            }}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {t('saveDraftBtn', 'Сохранить черновик')}
          </button>

          <button
            form="create-tender-form"
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Save size={16} />
            <span>{loading ? t('saving', 'Saklanýar...') : (t('publishTenderBtn', 'Опубликовать тендер'))}</span>
          </button>
        </div>
      </div>

      {/* Модальное окно создания нового товара в справочнике */}
      <CatalogFormModal
        isOpen={catalogModal.isOpen}
        onClose={() => setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, lotIdx: null, specIdx: null })}
        onSave={handleSaveProductFromModal}
        catalogId="productsMNN"
        editingItem={catalogModal.editingItem}
        theme={theme}
        t={t}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
