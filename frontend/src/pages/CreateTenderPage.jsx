import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Save, Trash2, ArrowLeft, X, Upload, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

// Запрещенные спецсимволы (<, >, {, }, |, ^, ~, `, \)
const FORBIDDEN_CHARS_REGEX = /[<>{}\|^~`\\]/g;

const sanitizeInputText = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(FORBIDDEN_CHARS_REGEX, '');
};

const SearchableSelect = ({ options, value, onChange, placeholder, isDarkMode, theme, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-lg text-xs cursor-pointer flex justify-between items-center ${theme.inputBg}`}
      >
        <span className={!selectedOption ? 'opacity-50' : ''}>{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown size={14} className="opacity-50" />
      </div>
      
      {isOpen && (
        <div className={`absolute z-[50] w-full mt-1 rounded-lg border shadow-lg ${theme.cardBg} ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} max-h-60 flex flex-col overflow-hidden`}>
          <div className="p-2 border-b border-slate-200/20">
            <input
              type="text"
              autoFocus
              className={`w-full px-2 py-1.5 rounded text-xs ${theme.inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              placeholder={t('search', 'Поиск...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div
                key={opt.id}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-emerald-500/10 ${value === opt.id ? 'bg-emerald-500/20 font-semibold' : ''}`}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt.name}
              </div>
            )) : (
              <div className="px-3 py-3 text-xs text-center opacity-50">{t('noResults', 'Нет совпадений')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProductSearchableSelect = ({
  products,
  value,
  generalProductId,
  onChange,
  onOpenCreateModal,
  onQuickAdd,
  placeholder,
  isDarkMode,
  theme,
  lang,
  isDuplicate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
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

  const handleQuickAddClick = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      const created = await onQuickAdd(trimmed);
      if (created) {
        onChange(created.name, created.id);
        setIsOpen(false);
        setSearch('');
      }
    } finally {
      setIsAdding(false);
    }
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
          className={`flex-1 px-2.5 py-1.5 rounded-md text-xs cursor-pointer flex justify-between items-center border font-medium transition-colors ${
            isDuplicate
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
              : `focus:ring-1 focus:ring-teal-500 ${theme.inputBg}`
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
          onClick={() => onOpenCreateModal(search || '')}
          className="p-1.5 rounded-md bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shrink-0 transition-colors"
          title={lang === 'RU' ? 'Добавить новый товар в справочник (+)' : 'Kataloga täze haryt goşmak (+)'}
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
            zIndex: 9999,
          }}
          className={`rounded-xl border shadow-2xl ${theme.cardBg} ${isDarkMode ? 'border-slate-700 bg-slate-900 shadow-black/70' : 'border-slate-200 bg-white shadow-slate-400/40'} max-h-64 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          <div className="p-2 border-b border-slate-200/40 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
            <input
              type="text"
              autoFocus
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${theme.inputBg} border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30`}
              placeholder={lang === 'RU' ? 'Поиск товара...' : 'Haryt gözle...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div
                  key={p.id}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-teal-500/10 flex items-center justify-between gap-2 transition-colors ${
                    (generalProductId === p.id || value === p.name) ? 'bg-teal-500/20 font-bold text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200'
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <span className="truncate">{p.name}</span>
                  {p.code && <span className="text-[10px] text-slate-400 font-mono shrink-0">{p.code}</span>}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                {lang === 'RU' ? 'Товар не найден в справочнике' : 'Haryt tapylmady'}
              </div>
            )}

            {/* Если введен поиск и его нет в результатах - предлагаем быстро добавить */}
            {search.trim().length > 0 && !filteredProducts.some(p => p.name.toLowerCase() === search.trim().toLowerCase()) && (
              <div
                className="p-2.5 text-xs bg-teal-50/80 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 cursor-pointer font-bold flex items-center gap-2 border-t border-teal-200/50 dark:border-teal-800/50 transition-colors"
                onClick={handleQuickAddClick}
              >
                <Plus size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="truncate">
                  {isAdding 
                    ? (lang === 'RU' ? 'Добавление...' : 'Goşulýar...') 
                    : (lang === 'RU' ? `Добавить в справочник: "${search.trim()}"` : `Kataloga goş: "${search.trim()}"`)}
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
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const savedDraft = getInitialDraft();

  const [formData, setFormData] = useState(savedDraft?.formData || {
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

  const [lots, setLots] = useState(savedDraft?.lots || [
    {
      id: Date.now(),
      name: 'Лот 1',
      deliveryTermId: '',
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

  // Модальное окно быстрого создания нового товара
  const [newProductModal, setNewProductModal] = useState({
    isOpen: false,
    name: '',
    code: '',
    description: '',
    lotIdx: null,
    specIdx: null,
    loading: false
  });

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

  const handleQuickAddProduct = async (productName, lotIdx = null, specIdx = null) => {
    try {
      const res = await API.post('/catalogs/products', {
        name: productName,
        categoryId: formData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (lotIdx !== null && specIdx !== null) {
          handleSpecChange(lotIdx, specIdx, 'productSelect', created.name, created.id);
        }
        return created;
      }
    } catch (err) {
      console.error('Failed to create product', err);
      alert(err.response?.data?.error || (lang === 'RU' ? 'Ошибка при создании товара' : 'Haryt goşulmady'));
      return null;
    }
  };

  const handleOpenProductModal = (initialName = '', lotIdx = null, specIdx = null) => {
    setNewProductModal({
      isOpen: true,
      name: initialName,
      code: '',
      description: '',
      lotIdx,
      specIdx,
      loading: false
    });
  };

  const handleSaveNewProductModal = async () => {
    if (!newProductModal.name.trim()) return;
    setNewProductModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await API.post('/catalogs/products', {
        name: newProductModal.name.trim(),
        code: newProductModal.code.trim() || undefined,
        description: newProductModal.description.trim() || undefined,
        categoryId: formData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (newProductModal.lotIdx !== null && newProductModal.specIdx !== null) {
          handleSpecChange(newProductModal.lotIdx, newProductModal.specIdx, 'productSelect', created.name, created.id);
        }
        setNewProductModal({ isOpen: false, name: '', code: '', description: '', lotIdx: null, specIdx: null, loading: false });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || (lang === 'RU' ? 'Ошибка сохранения товара' : 'Ýalňyşlyk'));
      setNewProductModal(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (!savedDraft?.formData?.tenderNumber) {
      fetchNextTenderNumber();
    }
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

  const handleClearDraft = () => {
    if (window.confirm(lang === 'RU' ? 'Вы уверены, что хотите сбросить форму и очистить черновик?' : 'Formany arassalamak we täzeden başlamak isleýärsiňizmi?')) {
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
    setLots([
      ...lots,
      {
        id: Date.now(),
        name: `Лот ${lots.length + 1}`,
        deliveryTermId: '',
        specs: [
          { id: Date.now() + 1, hk: '1', haryt: '', unit: defaultUnitId, brand: '', mukdar: 1, desc: '' }
        ]
      }
    ]);
  };
  
  // Удаление лота
  const handleRemoveLot = (lotIdx) => {
    if (lots.length === 1) return alert(lang === 'RU' ? 'Должен быть хотя бы один лот' : 'Iň bolmanda bir lot bolmaly');
    setLots(lots.filter((_, i) => i !== lotIdx));
  };
  
  // Изменение полей лота (название, условия поставки)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. Проверка заполненности позиций
    const hasSpecs = lots.some(lot => lot.specs.some(s => s.haryt && s.haryt.trim() !== ''));
    if (!hasSpecs) {
      setErrorMsg(t('specRequired', 'Добавьте хотя бы один лот с заполненными товарами'));
      setLoading(false);
      scrollToError();
      return;
    }

    // 2. Проверка дубликатов внутри каждого лота
    for (let lotIdx = 0; lotIdx < lots.length; lotIdx++) {
      const lot = lots[lotIdx];
      const seenNames = new Set();
      for (const spec of lot.specs) {
        const name = (spec.haryt || '').trim().toLowerCase();
        if (name) {
          if (seenNames.has(name)) {
            setErrorMsg(lang === 'RU' 
              ? `В лоте "${lot.name}" товар "${spec.haryt}" указан дважды. Пожалуйста, удалите или переименуйте дубликат.`
              : `"${lot.name}" lotunda "${spec.haryt}" harydy gaýtalanýar. Gaýtalanýan harydy aýyryň.`
            );
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
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        lots: lots.map((lot, lotIdx) => ({
          name: sanitizeInputText(lot.name),
          deliveryTermId: lot.deliveryTermId || undefined,
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

      alert(t('tenderCreatedSuccess', 'Тендер успешно создан!'));
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
    <div className="space-y-6 pb-12 relative">
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
          <span>{lang === 'RU' ? `Символ "${forbiddenBadge.char}" недопустим` : `"${forbiddenBadge.char}" simwoly gadagan`}</span>
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
            title={lang === 'RU' ? 'Очистить черновик и начать сначала' : 'Arassalamak'}
          >
            <Trash2 size={14} />
            <span>{lang === 'RU' ? 'Очистить черновик' : 'Arassala'}</span>
          </button>
        )}
      </div>

      {/* 2. Форма ввода данных */}
      <form id="create-tender-form" onSubmit={handleSubmit} className={`p-6 rounded-xl border shadow-xs space-y-5 ${theme.cardBg}`}>
        {/* Строка 1: Номер тендера (с генерацией и кастомизацией) + Название */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold flex items-center">
                {lang === 'RU' ? 'Номер тендера' : 'Tender belgisi'}*
              </label>
              <button
                type="button"
                onClick={fetchNextTenderNumber}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                title={lang === 'RU' ? 'Сгенерировать следующий системный номер' : 'Awtomatiki täzelemek'}
              >
                <RefreshCw size={11} />
                <span>{lang === 'RU' ? 'Авто' : 'Awtomat'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="TNDR-2026-08-001"
              value={formData.tenderNumber}
              onChange={(e) => handleFormChange('tenderNumber', e.target.value, e)}
              className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-wide ${theme.inputBg}`}
            />
          </div>

          <div className="md:col-span-8">
            <label className="block font-semibold mb-1">
              {t('tenderName', 'Tender ady')}*
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'RU' ? 'Введите название предмета тендера...' : 'Tender adyny giriziň...'}
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value, e)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Строка 2: Категория, Заказчик, Тип */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('category', 'Kategoriýa')}*</label>
            <div className="flex space-x-1.5">
              <SearchableSelect 
                t={t}
                options={categories} 
                value={formData.categoryId} 
                onChange={(val) => handleFormChange('categoryId', val)} 
                placeholder={t('selectCategory', 'Выберите категорию')} 
                isDarkMode={isDarkMode} 
                theme={theme} 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('client', 'Sargyt ediji')}*</label>
            <div className="flex space-x-1.5">
              <SearchableSelect 
                t={t}
                options={clients} 
                value={formData.clientId} 
                onChange={(val) => handleFormChange('clientId', val)} 
                placeholder={t('select', 'Saýlaň...')} 
                isDarkMode={isDarkMode} 
                theme={theme} 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('type', 'Görnüşi')}*</label>
            <select
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="YERLI">{t('typeLocal', 'Ýerli')}</option>
              <option value="HALKARA">{t('typeGlobal', 'Halkara')}</option>
            </select>
          </div>
        </div>

        {/* Строка 3: Даты, Валюта */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('announcementDate', 'Yglan edilen senesi')}*</label>
            <input
              type="date"
              required
              value={formData.announcementDate}
              onChange={(e) => handleFormChange('announcementDate', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('deadline', 'Soňky möhleti')}*</label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => handleFormChange('deadline', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('currency', 'Walýuta')}*</label>
            <select
              value={formData.currency}
              onChange={(e) => handleFormChange('currency', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              {currencies.map(c => (<option key={c.id} value={c.code}>{c.code} - {c.name}</option>))}
            </select>
          </div>
        </div>

        {/* Строка 4: Описание */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>
              {t('description', 'Tender mazmuny')}*
            </label>
          </div>
          <textarea
            rows={4}
            required
            placeholder={lang === 'RU' ? 'Подробное описание предмета закупки...' : 'Tender barada giňişleýin maglumat...'}
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value, e)}
            className={`w-full p-3 rounded-lg text-xs leading-relaxed ${theme.inputBg}`}
          />
        </div>

        {/* Строка 5: Технические условия */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>
              {t('techSpecs', 'Tehniki şartler')}*
            </label>
          </div>
          <textarea
            rows={4}
            required
            placeholder={lang === 'RU' ? 'Технические требования к продукции...' : 'Önümlere bildirilýän tehniki talaplar...'}
            value={formData.technicalSpecs}
            onChange={(e) => handleFormChange('technicalSpecs', e.target.value, e)}
            className={`w-full p-3 rounded-lg text-xs leading-relaxed ${theme.inputBg}`}
          />
        </div>

        {/* Строка 6: Статус и видимость */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('status', 'Status')}*</label>
            <select
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="ACYK">{t('statusAcyk', 'Açyk')}</option>
              <option value="TASLAMA">{t('statusTaslama', 'Taslama')}</option>
              <option value="YAPYK">{t('statusYapyk', 'Ýapyk')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('visibility', 'Açyklygy')}*</label>
            <select
              value={formData.visibility}
              onChange={(e) => handleFormChange('visibility', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="ACYK">{t('visibilityPublic', 'Açyk')}</option>
              <option value="YAPYK">{t('visibilityPrivate', 'Ýapyk')}</option>
            </select>
          </div>
        </div>
      </form>

      {/* 3. Лоты и Спецификации */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className={`font-bold text-lg ${theme.primaryText}`}>{lang === 'RU' ? 'Лоты и позиции' : 'Lotlar we pozisiýalar'}</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              {lots.length} {lang === 'RU' ? (lots.length === 1 ? 'лот' : 'лота') : 'lot'}
            </span>
          </div>
        </div>

        {lots.map((lot, lotIdx) => (
          <div key={lot.id} className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className={`p-4 border-b flex items-end justify-between gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-white'}`}>
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                     {lang === 'RU' ? 'Название лота' : 'Lot ady'}*
                   </label>
                   <input
                     type="text"
                     required
                     value={lot.name}
                     onChange={(e) => handleLotChange(lotIdx, 'name', e.target.value, e)}
                     placeholder={lang === 'RU' ? 'Напр: Лот 1: Оборудование' : 'Meselem: Lot 1'}
                     className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${theme.inputBg}`}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Условия поставки' : 'Eltip beriş şerti'}*</label>
                   <select
                     required
                     value={lot.deliveryTermId}
                     onChange={(e) => handleLotChange(lotIdx, 'deliveryTermId', e.target.value)}
                     className={`w-full px-3 py-2 rounded-lg text-sm ${theme.inputBg}`}
                   >
                     <option value="">{lang === 'RU' ? 'Выберите условие поставки...' : 'Eltip beriş şertini saýlaň...'}</option>
                     {deliveryTerms.map(dt => (
                       <option key={dt.id} value={dt.id}>{dt.shortName} — {dt.name}</option>
                     ))}
                   </select>
                 </div>
               </div>
               {lots.length > 1 && (
                 <div className="flex items-center gap-2 mt-4 md:mt-0">
                   <button type="button" onClick={() => handleRemoveLot(lotIdx)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title={lang === 'RU' ? 'Удалить лот' : 'Loty pozmak'}>
                     <Trash2 size={16} />
                   </button>
                 </div>
               )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className={`font-semibold text-white ${isDarkMode ? 'bg-teal-900' : 'bg-teal-600'}`}>
                    <th className="py-2.5 px-3 w-10 text-center">H/K</th>
                    <th className="py-2.5 px-3 min-w-[200px]">{t('specProduct', 'Haryt')} *</th>
                    <th className="py-2.5 px-3 w-40 text-center">{t('specUnit', 'Ölçeg birligi')} *</th>
                    <th className="py-2.5 px-3 w-48 text-center">{t('specBrand', 'Öndüriji')}</th>
                    <th className="py-2.5 px-3 w-28 text-center">{t('specQty', 'Mukdar')} *</th>
                    <th className="py-2.5 px-3 min-w-[220px]">{t('specDesc', 'Mazmuny')}</th>
                    <th className="py-2.5 px-3 w-12 text-center">{t('action', 'Amal')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {lot.specs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        <p className="text-xs mb-2.5">{lang === 'RU' ? 'В этом лоте пока нет позиций' : 'Bu lota entek haryt goşulmady'}</p>
                        <button
                          type="button"
                          onClick={() => handleAddSpecRow(lotIdx)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/40 rounded-lg hover:bg-teal-100 transition-colors shadow-xs"
                        >
                          <Plus size={14} /> {lang === 'RU' ? 'Добавить первую позицию' : 'Ilkinji harydy goş'}
                        </button>
                      </td>
                    </tr>
                  ) : lot.specs.map((item, idx) => {
                    const isDup = isDuplicateProduct(lotIdx, idx, item.haryt);

                    return (
                      <tr key={item.id || idx} className={`${theme.tableRowHover} transition-colors ${isDup ? 'bg-rose-50/20' : ''}`}>
                        <td className="py-2.5 px-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                        
                        {/* Поле 1: Товар из справочника с поиском и кнопкой (+) */}
                        <td className="py-2.5 px-3 min-w-[240px]">
                          <ProductSearchableSelect
                            products={products}
                            value={item.haryt}
                            generalProductId={item.generalProductId}
                            placeholder={lang === 'RU' ? 'Выберите или найдите товар...' : 'Haryt saýlaň...'}
                            onChange={(prodName, prodId) => handleSpecChange(lotIdx, idx, 'productSelect', prodName, prodId)}
                            onOpenCreateModal={(initialText) => handleOpenProductModal(initialText, lotIdx, idx)}
                            onQuickAdd={(name) => handleQuickAddProduct(name, lotIdx, idx)}
                            isDarkMode={isDarkMode}
                            theme={theme}
                            lang={lang}
                            isDuplicate={isDup}
                          />
                          {isDup && (
                            <span className="block text-[10px] text-rose-500 font-semibold mt-1">
                              ⚠️ {lang === 'RU' ? 'Этот товар уже есть в данном лоте' : 'Bu haryt eýýäm bar'}
                            </span>
                          )}
                        </td>

                        {/* Поле 2: Ед. изм. */}
                        <td className="py-2.5 px-3">
                          <select
                            required
                            value={item.unit}
                            onChange={(e) => handleSpecChange(lotIdx, idx, 'unit', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 ${theme.inputBg}`}
                          >
                            <option value="">{lang === 'RU' ? 'Выберите...' : 'Saýlaň...'}</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                            ))}
                          </select>
                        </td>

                        {/* Поле 3: Производитель */}
                        <td className="py-2.5 px-3">
                          <select
                            value={item.brand}
                            onChange={(e) => handleSpecChange(lotIdx, idx, 'brand', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 ${theme.inputBg}`}
                          >
                            <option value="">{lang === 'RU' ? 'Не указан' : 'Görkezilmedik'}</option>
                            {manufacturers.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Поле 4: Количество */}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={item.mukdar}
                            onChange={(e) => handleSpecChange(lotIdx, idx, 'mukdar', Number(e.target.value))}
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs text-center font-bold border focus:outline-none focus:ring-1 focus:ring-teal-500 ${theme.inputBg}`}
                          />
                        </td>

                        {/* Поле 5: Описание (Auto-expanding Textarea) */}
                        <td className="py-2.5 px-3">
                          <textarea
                            rows={1}
                            placeholder={lang === 'RU' ? 'Характеристики / Описание...' : 'Mazmuny...'}
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
                            className={`w-full px-2.5 py-1.5 rounded-md text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 leading-normal resize-y ${theme.inputBg}`}
                          />
                        </td>

                        {/* Поле 6: Удалить */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(lotIdx, idx)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title={lang === 'RU' ? 'Удалить позицию' : 'Pozmak'}
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
                className="px-6 py-2 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-95"
              >
                <Plus size={15} /> <span>{lang === 'RU' ? 'Добавить позицию в лот' : 'Lota haryt goş'}</span>
              </button>
            </div>
          </div>
        ))}

        {/* Кнопка "Добавить лот" под всеми лотами */}
        <button
          type="button"
          onClick={handleAddLot}
          className={`w-full py-3.5 px-6 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-bold group shadow-xs hover:shadow-sm active:scale-[0.99] ${
            isDarkMode
              ? 'border-teal-500/30 hover:border-teal-400 bg-teal-950/20 hover:bg-teal-900/30 text-teal-400 hover:text-teal-300'
              : 'border-teal-500/40 hover:border-teal-600 bg-teal-50/40 hover:bg-teal-50 text-teal-700 hover:text-teal-800'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-teal-600 group-hover:bg-teal-700 text-white flex items-center justify-center transition-colors shadow-xs">
            <Plus size={15} />
          </div>
          <span>{lang === 'RU' ? 'Добавить новый лот' : 'Täze lot goşmak'}</span>
        </button>
      </div>

      {/* 4. Документы */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{t('documents', 'Resminamalar')}</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button type="button" onClick={handleFileClick} className="p-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-teal-600 text-white font-medium">
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
                  <td className="py-3 px-4 text-center font-bold text-teal-600">{doc.type}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.size}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.date}</td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <button type="button" onClick={() => setDocs(docs.filter((_, i) => i !== idx))} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Блок ошибки и Кнопка сохранения (Ошибка расположена внизу прямо над кнопкой) */}
      <div ref={errorRef} className="space-y-3 pt-2">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-bottom-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            form="create-tender-form"
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 active:scale-95"
          >
            <Save size={18} />
            <span>{loading ? t('saving', 'Saklanýar...') : t('saveTender', 'Ýatda sakla')}</span>
          </button>
        </div>
      </div>

      {/* Модальное окно создания нового товара в справочнике */}
      {newProductModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${theme.cardBg} ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/50 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus size={18} className="text-teal-600 dark:text-teal-400" />
                <span>{lang === 'RU' ? 'Новый товар в справочник' : 'Täze haryt goşmak'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setNewProductModal({ isOpen: false, name: '', code: '', description: '', lotIdx: null, specIdx: null, loading: false })}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'RU' ? 'Наименование товара (МНН)' : 'Harydyň ady'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProductModal.name}
                  onChange={(e) => setNewProductModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={lang === 'RU' ? 'Например: Парацетамол 500 мг' : 'Haryt ady...'}
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none ${theme.inputBg}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'RU' ? 'Код / Артикул' : 'Kody / Artikul'}
                </label>
                <input
                  type="text"
                  value={newProductModal.code}
                  onChange={(e) => setNewProductModal(prev => ({ ...prev, code: e.target.value }))}
                  placeholder={lang === 'RU' ? 'Например: MED-0012' : 'Kody...'}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-teal-500 focus:outline-none ${theme.inputBg}`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'RU' ? 'Описание / Характеристики' : 'Mazmuny'}
                </label>
                <textarea
                  rows="2"
                  value={newProductModal.description}
                  onChange={(e) => setNewProductModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={lang === 'RU' ? 'Краткое описание товара...' : 'Bellik...'}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-teal-500 focus:outline-none ${theme.inputBg}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewProductModal({ isOpen: false, name: '', code: '', description: '', lotIdx: null, specIdx: null, loading: false })}
                className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancelBtn', 'Отмена')}
              </button>
              <button
                type="button"
                disabled={!newProductModal.name.trim() || newProductModal.loading}
                onClick={handleSaveNewProductModal}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {newProductModal.loading ? (lang === 'RU' ? 'Сохранение...' : 'Ýatda saklanýar...') : (lang === 'RU' ? 'Сохранить и выбрать' : 'Goş we saýla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
