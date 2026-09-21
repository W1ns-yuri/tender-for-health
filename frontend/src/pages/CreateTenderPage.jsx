import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Trash2, ChevronDown, AlertCircle, RefreshCw, FileText, 
  Paperclip, Package, Check, ArrowRight, Eye, 
  Bookmark, MapPin, Clock, ShieldCheck, ChevronUp
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
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

        <button
          type="button"
          onClick={() => handleOpenModalAndCloseDropdown(search || '')}
          className="w-7 h-7 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title={t('createNewCatalogProduct', 'Создать новый товар в справочнике')}
        >
          <Plus size={13} />
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
            zIndex: 999999,
          }}
          className={`rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-60 ${
            isDarkMode ? 'bg-[#151c28] border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              autoFocus
              className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${theme.inputBg}`}
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

export default function CreateTenderPage({ onNavigate: _onNavigate, role, isDarkMode, lang = 'RU', isEdit: _isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = useCallback((key, fallback, params) => getTranslation(lang, key, fallback, params), [lang]);

  const tenderId = id || null;

  // Базовые данные тендера (Шаг 1)
  const [formData, setFormData] = useState({
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
    status: 'TASLAMA',
    visibility: 'ACYK',
  });

  // Лоты тендера (Шаг 2 - Закладки)
  const [lots, setLots] = useState([]);
  const [activeLotIndex, setActiveLotIndex] = useState(0);

  // Состояние загрузки и сохранения
  const [pageLoading, setPageLoading] = useState(Boolean(tenderId));
  const [savingBase, setSavingBase] = useState(false);
  const [savingActiveLot, setSavingActiveLot] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [baseInfoExpanded, setBaseInfoExpanded] = useState(!tenderId);
  const [activeLotDirty, setActiveLotDirty] = useState(false);

  // Справочники
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [products, setProducts] = useState([]);

  // Модальное окно быстрого добавления товаров в каталог
  const [catalogModal, setCatalogModal] = useState({
    isOpen: false,
    catalogId: 'productsMNN',
    editingItem: null,
    specIdx: null
  });

  // Загрузка справочников
  useEffect(() => {
    API.get('/catalogs/categories').then(res => { if (Array.isArray(res.data)) setCategories(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/units').then(res => { if (Array.isArray(res.data)) setUnits(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/manufacturers').then(res => { if (Array.isArray(res.data)) setManufacturers(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/delivery-terms').then(res => { if (Array.isArray(res.data)) setDeliveryTerms(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/clients').then(res => { if (Array.isArray(res.data)) setClients(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/products').then(res => { if (Array.isArray(res.data)) setProducts(res.data.filter(p => p.isActive)); }).catch(() => {});
  }, []);

  // Если это режим создания с нуля: генерируем номер тендера
  useEffect(() => {
    if (!tenderId) {
      API.get('/tenders/next-number')
        .then(res => {
          if (res.data?.nextTenderNumber) {
            setFormData(prev => ({ ...prev, tenderNumber: res.data.nextTenderNumber }));
          }
        })
        .catch(e => console.warn('Failed to fetch next tender number', e));
    }
  }, [tenderId]);

  // Загрузка существующего тендера по ID (при открытии /tenders/:id/edit)
  const loadTenderData = useCallback(async (targetId) => {
    try {
      setPageLoading(true);
      const res = await API.get(`/tenders/${targetId}`);
      const tData = res.data;
      if (tData) {
        setFormData({
          tenderNumber: tData.tenderNumber || '',
          title: tData.title || '',
          categoryId: tData.categoryId || '',
          clientId: tData.clientId || '',
          type: tData.type || 'YERLI',
          procurementType: tData.procurementType || 'GOODS',
          announcementDate: tData.announcementDate ? tData.announcementDate.split('T')[0] : new Date().toISOString().split('T')[0],
          deadline: tData.deadline ? tData.deadline.split('T')[0] : '',
          description: tData.description || '',
          technicalSpecs: tData.technicalSpecs || '',
          status: tData.status || 'TASLAMA',
          visibility: tData.visibility || 'ACYK',
        });

        const loadedLots = (tData.lots || []).map(lot => ({
          id: lot.id,
          lotNumber: lot.lotNumber || 1,
          name: lot.name || `Лот №${lot.lotNumber || 1}`,
          description: lot.description || '',
          lotType: lot.lotType || 'GOODS',
          categoryId: lot.categoryId || '',
          endUser: lot.endUser || '',
          deliveryTermId: lot.deliveryTermId || '',
          deliveryAddress: lot.deliveryAddress || '',
          workAddress: lot.workAddress || '',
          workPeriod: lot.workPeriod || '',
          licenseRequired: Boolean(lot.licenseRequired),
          serviceFormat: lot.serviceFormat || 'ON_SITE',
          slaPeriod: lot.slaPeriod || '',
          files: lot.files || [],
          specs: (lot.specs || []).map((s, sIdx) => ({
            id: s.id,
            hk: String(s.positionNumber || (sIdx + 1)),
            positionNumber: s.positionNumber || (sIdx + 1),
            generalProductId: s.generalProductId || null,
            haryt: s.name || '',
            name: s.name || '',
            unit: s.unitId || '',
            brand: s.manufacturerId || '',
            mukdar: s.quantity || 1,
            desc: s.description || ''
          }))
        }));

        setLots(loadedLots);
        if (loadedLots.length > 0) {
          setActiveLotIndex(0);
          setBaseInfoExpanded(false); // В режиме редактирования лотов скрываем базовую плашку
        }
      }
    } catch (err) {
      console.error('Failed to load tender', err);
      showAlert({ message: t('tenderLoadError', 'Ошибка загрузки тендера'), type: 'error' });
    } finally {
      setPageLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    if (tenderId) {
      loadTenderData(tenderId);
    }
  }, [tenderId, loadTenderData]);

  // Хэндлеры изменения полей формы тендера
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: sanitizeInputText(value) }));
  };

  // Шаг 1: Создание черновика тендера и переход к управлению лотами
  const handleCreateBaseTender = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title?.trim()) {
      setErrorMsg(t('titleRequired', 'Пожалуйста, введите название тендера'));
      return;
    }
    if (!formData.deadline) {
      setErrorMsg(t('deadlineRequired', 'Укажите крайний срок подачи заявок (дедлайн)'));
      return;
    }

    try {
      setSavingBase(true);
      setErrorMsg('');

      const payload = {
        tenderNumber: formData.tenderNumber?.trim() || undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        status: 'TASLAMA',
        visibility: formData.visibility,
        categoryId: formData.categoryId || undefined,
        clientId: formData.clientId || undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        lots: []
      };

      const res = await API.post('/tenders', payload);
      const newTender = res.data;

      if (newTender?.id) {
        // Создаем начальный первый лот для удобства
        await API.post(`/tenders/${newTender.id}/lots`, {
          lotNumber: 1,
          name: 'Лот №1',
          lotType: formData.procurementType === 'SERVICES_WORKS' ? 'WORKS' : 'GOODS'
        });

        showAlert({
          title: t('successTitle', 'Успешно'),
          message: t('tenderDraftCreated', 'Черновик тендера создан! Теперь добавьте позиции в лоты.'),
          type: 'success'
        });

        // Переходим на страницу управления лотами созданного тендера
        navigate(`/tenders/${newTender.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Error creating base tender draft', err);
      setErrorMsg(err.response?.data?.error || t('errorSaving', 'Ошибка сохранения данных'));
    } finally {
      setSavingBase(false);
    }
  };

  // Сохранение общих данных существующего тендера (PUT /api/tenders/:id)
  const handleUpdateBaseTender = async () => {
    if (!tenderId) return;
    try {
      setSavingBase(true);
      await API.put(`/tenders/${tenderId}`, {
        tenderNumber: formData.tenderNumber?.trim() || undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        visibility: formData.visibility,
        categoryId: formData.categoryId || undefined,
        clientId: formData.clientId || undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: formData.announcementDate ? new Date(formData.announcementDate).toISOString() : undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('generalDataSaved', 'Общие сведения о тендере успешно обновлены!'),
        type: 'success'
      });
      setBaseInfoExpanded(false);
    } catch (err) {
      console.error('Error updating tender info', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка обновления'), type: 'error' });
    } finally {
      setSavingBase(false);
    }
  };

  // Шаг 2: Добавление нового лота (Закладка + легкий запрос на сервер)
  const handleAddNewLotTab = async () => {
    if (!tenderId) return;
    const nextLotNumber = (lots.reduce((max, l) => Math.max(max, l.lotNumber || 0), 0)) + 1;
    const initialLotType = formData.procurementType === 'SERVICES_WORKS' ? 'WORKS' : 'GOODS';

    try {
      const res = await API.post(`/tenders/${tenderId}/lots`, {
        lotNumber: nextLotNumber,
        name: `Лот №${nextLotNumber}`,
        lotType: initialLotType,
        categoryId: formData.categoryId || undefined
      });

      const createdLot = res.data;
      const formattedLot = {
        id: createdLot.id,
        lotNumber: createdLot.lotNumber || nextLotNumber,
        name: createdLot.name || `Лот №${nextLotNumber}`,
        description: createdLot.description || '',
        lotType: createdLot.lotType || initialLotType,
        categoryId: createdLot.categoryId || '',
        endUser: createdLot.endUser || '',
        deliveryTermId: createdLot.deliveryTermId || '',
        deliveryAddress: createdLot.deliveryAddress || '',
        workAddress: createdLot.workAddress || '',
        workPeriod: createdLot.workPeriod || '',
        licenseRequired: Boolean(createdLot.licenseRequired),
        serviceFormat: createdLot.serviceFormat || 'ON_SITE',
        slaPeriod: createdLot.slaPeriod || '',
        files: createdLot.files || [],
        specs: []
      };

      setLots(prev => [...prev, formattedLot]);
      setActiveLotIndex(lots.length);
      setActiveLotDirty(false);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotCreatedSuccess', `Лот №${nextLotNumber} создан и добавлен в закладки`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error creating new lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка добавления лота'), type: 'error' });
    }
  };

  // Текущий активный лот
  const activeLot = lots[activeLotIndex] || null;

  // Изменение полей активного лота
  const handleActiveLotChange = (field, value) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      nextLots[activeLotIndex] = {
        ...nextLots[activeLotIndex],
        [field]: sanitizeInputText(value)
      };
      return nextLots;
    });
  };

  // Добавление позиции в спецификацию активного лота
  const handleAddSpecRow = () => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    const defaultUnitId = units.length > 0 ? units[0].id : '';
    setLots(prev => {
      const nextLots = [...prev];
      const nextSpecs = [...(nextLots[activeLotIndex].specs || [])];
      nextSpecs.push({
        id: Date.now() + Math.random(),
        hk: String(nextSpecs.length + 1),
        positionNumber: nextSpecs.length + 1,
        generalProductId: null,
        haryt: '',
        name: '',
        unit: defaultUnitId,
        brand: '',
        mukdar: 1,
        desc: ''
      });
      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  };

  // Изменение позиции в спецификации активного лота
  const handleSpecChange = (specIdx, field, value, extraParam) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      const nextSpecs = [...(nextLots[activeLotIndex].specs || [])];

      if (field === 'productSelect') {
        nextSpecs[specIdx] = {
          ...nextSpecs[specIdx],
          haryt: value,
          name: value,
          generalProductId: extraParam || null
        };
      } else {
        nextSpecs[specIdx] = {
          ...nextSpecs[specIdx],
          [field]: sanitizeInputText(value)
        };
      }

      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  };

  // Удаление позиции из спецификации активного лота
  const handleRemoveSpec = (specIdx) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      let nextSpecs = [...(nextLots[activeLotIndex].specs || [])];
      nextSpecs = nextSpecs.filter((_, i) => i !== specIdx);
      nextSpecs.forEach((s, idx) => {
        s.hk = String(idx + 1);
        s.positionNumber = idx + 1;
      });
      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  };

  // АТОМАРНОЕ СОХРАНЕНИЕ ТОЛЬКО АКТИВНОГО ЛОТА (PUT /api/tenders/:id/lots/:lotId)
  const handleSaveActiveLot = async () => {
    if (!tenderId || !activeLot) return;

    try {
      setSavingActiveLot(true);
      const validSpecs = (activeLot.specs || [])
        .filter(s => (s.haryt || s.name) && (s.haryt || s.name).trim() !== '')
        .map((s, idx) => ({
          positionNumber: idx + 1,
          generalProductId: s.generalProductId || undefined,
          name: sanitizeInputText(s.haryt || s.name).trim(),
          quantity: parseFloat(s.mukdar) || 1,
          unitId: s.unit || undefined,
          manufacturerId: s.brand || undefined,
          description: s.desc ? sanitizeInputText(s.desc).trim() : undefined
        }));

      const payload = {
        lotNumber: parseInt(activeLot.lotNumber, 10) || (activeLotIndex + 1),
        name: sanitizeInputText(activeLot.name) || `Лот №${activeLotIndex + 1}`,
        description: activeLot.description ? sanitizeInputText(activeLot.description) : undefined,
        lotType: activeLot.lotType || 'GOODS',
        categoryId: activeLot.categoryId || undefined,
        endUser: activeLot.endUser ? sanitizeInputText(activeLot.endUser).trim() : undefined,
        deliveryTermId: activeLot.lotType === 'GOODS' ? (activeLot.deliveryTermId || undefined) : undefined,
        deliveryAddress: activeLot.deliveryAddress ? sanitizeInputText(activeLot.deliveryAddress).trim() : undefined,
        workAddress: activeLot.workAddress ? sanitizeInputText(activeLot.workAddress).trim() : undefined,
        workPeriod: activeLot.workPeriod ? sanitizeInputText(activeLot.workPeriod).trim() : undefined,
        licenseRequired: Boolean(activeLot.licenseRequired),
        serviceFormat: activeLot.serviceFormat || undefined,
        slaPeriod: activeLot.slaPeriod ? sanitizeInputText(activeLot.slaPeriod).trim() : undefined,
        specs: validSpecs
      };

      const res = await API.put(`/tenders/${tenderId}/lots/${activeLot.id}`, payload);
      const updatedLot = res.data;

      // Обновляем локальное состояние
      setLots(prev => {
        const nextLots = [...prev];
        nextLots[activeLotIndex] = {
          ...nextLots[activeLotIndex],
          ...updatedLot,
          specs: (updatedLot.specs || []).map((s, sIdx) => ({
            id: s.id,
            hk: String(s.positionNumber || (sIdx + 1)),
            positionNumber: s.positionNumber || (sIdx + 1),
            generalProductId: s.generalProductId || null,
            haryt: s.name || '',
            name: s.name || '',
            unit: s.unitId || '',
            brand: s.manufacturerId || '',
            mukdar: s.quantity || 1,
            desc: s.description || ''
          }))
        };
        return nextLots;
      });

      setActiveLotDirty(false);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotSavedSuccess', `Данные лота "${activeLot.name}" сохранены!`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error saving active lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка сохранения лота'), type: 'error' });
    } finally {
      setSavingActiveLot(false);
    }
  };

  // Удаление отдельного лота (DELETE /api/tenders/:id/lots/:lotId)
  const handleDeleteActiveLot = async () => {
    if (!tenderId || !activeLot) return;
    const confirmed = await showConfirm({
      title: t('deleteLotBtn', 'Удалить лот'),
      message: t('confirmDeleteLot', `Вы уверены, что хотите удалить лот "${activeLot.name}"? Это действие необратимо.`),
      type: 'danger',
      isDanger: true,
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancel', 'Отмена')
    });

    if (!confirmed) return;

    try {
      await API.delete(`/tenders/${tenderId}/lots/${activeLot.id}`);
      const remainingLots = lots.filter((_, idx) => idx !== activeLotIndex);
      setLots(remainingLots);
      setActiveLotIndex(Math.max(0, activeLotIndex - 1));
      setActiveLotDirty(false);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotDeleted', 'Лот успешно удален'),
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления лота'), type: 'error' });
    }
  };

  // Прикрепление документа к конкретному активному лоту (POST /api/documents/upload)
  const handleLotFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeLot) return;

    const data = new FormData();
    data.append('file', file);
    data.append('name', file.name);
    data.append('lotId', activeLot.id);
    if (tenderId) data.append('tenderId', tenderId);

    try {
      const res = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedDoc = res.data;

      // Обновляем список файлов активного лота
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = nextLots[activeLotIndex];
        curLot.files = [...(curLot.files || []), { id: Date.now(), document: uploadedDoc }];
        return nextLots;
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('fileUploaded', `Файл "${file.name}" прикреплен к лоту!`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading lot document', err);
      showAlert({ message: err.response?.data?.error || t('fileUploadError', 'Ошибка загрузки файла'), type: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  // Удаление документа из лота
  const handleLotFileDelete = async (docId) => {
    if (!docId) return;
    try {
      await API.delete(`/documents/${docId}`);
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = nextLots[activeLotIndex];
        curLot.files = (curLot.files || []).filter(f => f.documentId !== docId && f.document?.id !== docId);
        return nextLots;
      });
    } catch (err) {
      console.error('Error deleting lot file', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления файла'), type: 'error' });
    }
  };

  // ФИНАЛЬНАЯ ПУБЛИКАЦИЯ ТЕНДЕРА (POST /api/tenders/:id/publish)
  const handlePublishTender = async () => {
    if (!tenderId) return;

    if (lots.length === 0) {
      showAlert({ message: t('noLotsYet', 'Добавьте хотя бы один лот для публикации тендера'), type: 'warning' });
      return;
    }

    const hasAnySpecs = lots.some(l => l.specs && l.specs.length > 0 && l.specs.some(s => s.haryt && s.haryt.trim() !== ''));
    if (!hasAnySpecs) {
      showAlert({ message: t('lotEmptySpecsError', 'Заполните хотя бы одну позицию спецификации в лотах!'), type: 'warning' });
      return;
    }

    const confirmed = await showConfirm({
      title: t('publishTenderBtn', 'Опубликовать тендер'),
      message: t('publishConfirm', 'Вы уверены, что хотите опубликовать тендер? Он станет открытым и поставщики смогут подавать предложения.'),
      type: 'info',
      confirmText: t('publishTenderBtn', 'Опубликовать'),
      cancelText: t('cancel', 'Отмена')
    });

    if (!confirmed) return;

    try {
      setPublishing(true);
      await API.post(`/tenders/${tenderId}/publish`);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('tenderPublishedSuccess', 'Тендер успешно опубликован! Поставщики могут подавать заявки.'),
        type: 'success'
      });

      navigate(`/tenders/${tenderId}`);
    } catch (err) {
      console.error('Error publishing tender', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка публикации тендера'), type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  // Модалка добавления товара в каталог
  const handleOpenProductModal = (initialName = '', specIdx = null) => {
    setCatalogModal({
      isOpen: true,
      catalogId: 'productsMNN',
      editingItem: initialName ? { name: initialName } : null,
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
        categoryId: activeLot?.categoryId || formData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (catalogModal.specIdx !== null) {
          handleSpecChange(catalogModal.specIdx, 'productSelect', created.name, created.id);
        }
        setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null });
      }
    } catch (err) {
      console.error('Failed to create product in catalog', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка создания товара'), type: 'error' });
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-slate-500">
        <RefreshCw className="animate-spin text-emerald-600" size={28} />
        <span className="text-sm font-medium">{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 🟢 ВЕРХНЯЯ ШАПКА: Статус, Название, Номер и Кнопки действий */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 ${theme.cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base shadow-xs">
            {tenderId ? '📋' : '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black tracking-wide border border-emerald-500/20">
                {formData.tenderNumber || 'TNDR-NEW'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                formData.status === 'TASLAMA' 
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}>
                {formData.status === 'TASLAMA' ? t('draftStatusBadge', 'Черновик (Taslama)') : t('statusAcyk', 'Открыт (Açyk)')}
              </span>
            </div>
            <h1 className={`text-lg font-black tracking-tight mt-1 ${theme.primaryText}`}>
              {formData.title || t('newTenderTitle', 'Новый тендер')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {tenderId && (
            <button
              type="button"
              onClick={() => navigate(`/tenders/${tenderId}`)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye size={15} />
              <span>{t('previewTenderBtn', 'Просмотр тендера')}</span>
            </button>
          )}

          {tenderId && formData.status === 'TASLAMA' && (
            <button
              type="button"
              onClick={handlePublishTender}
              disabled={publishing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              <span>{publishing ? t('publishing', 'Публикация...') : t('publishTenderBtn', 'Опубликовать тендер')}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 🟢 ШАГ 1: ОСНОВНЫЕ СВЕДЕНИЯ О ТЕНДЕРЕ (Сворачиваемый блок) */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${theme.cardBg}`}>
        <div 
          onClick={() => setBaseInfoExpanded(!baseInfoExpanded)}
          className={`p-4 flex items-center justify-between cursor-pointer border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">1</span>
            <h2 className={`text-sm font-black ${theme.primaryText}`}>
              {t('step1Title', 'Шаг 1: Основные сведения о тендере')}
            </h2>
            {!baseInfoExpanded && (
              <span className="text-xs text-slate-400 font-medium">
                ({formData.title || t('notSpecified', 'Не заполнено')}, {t('deadline', 'Дедлайн')}: {formData.deadline || '-'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {baseInfoExpanded ? t('collapseBtn', 'Свернуть') : t('expandBtn', 'Развернуть и редактировать')}
            </span>
            {baseInfoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {baseInfoExpanded && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Номер тендера */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('tenderNumberLabel', 'Номер тендера')} *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={formData.tenderNumber}
                    onChange={(e) => handleFormChange('tenderNumber', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none border ${theme.inputBg}`}
                    placeholder="TNDR-2026-09-001"
                  />
                  {!tenderId && (
                    <button
                      type="button"
                      onClick={() => {
                        API.get('/tenders/next-number').then(res => {
                          if (res.data?.nextTenderNumber) setFormData(p => ({ ...p, tenderNumber: res.data.nextTenderNumber }));
                        });
                      }}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      title={t('generateNumber', 'Автогенерация')}
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Заказчик */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('client', 'Заказчик')} *
                </label>
                <CustomSelect
                  role={role}
                  value={formData.clientId}
                  onChange={(val) => handleFormChange('clientId', val)}
                  options={clients.map(c => ({ id: c.id, name: c.name }))}
                  placeholder={t('selectClient', 'Выберите заказчика...')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>

              {/* Общая категория тендера */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('tenderGeneralCategory', 'Категория тендера')} *
                </label>
                <CustomSelect
                  role={role}
                  value={formData.categoryId}
                  onChange={(val) => handleFormChange('categoryId', val)}
                  options={categories.map(c => ({ id: c.id, name: c.name }))}
                  placeholder={t('selectCategory', 'Выберите категорию...')}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>
            </div>

            {/* Наименование тендера */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                {t('tenderTitleLabel', 'Наименование тендера')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold outline-none border ${theme.inputBg}`}
                placeholder={t('tenderTitlePlaceholder', 'Например: Закупка лекарственных средств и расходных материалов для стационаров')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Дата объявления */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('announcementDate', 'Дата объявления')} *
                </label>
                <CustomDateInput
                  value={formData.announcementDate}
                  onChange={(val) => handleFormChange('announcementDate', val)}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  lang={lang}
                />
              </div>

              {/* Дедлайн */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('deadline', 'Крайний срок подачи')} *
                </label>
                <CustomDateInput
                  value={formData.deadline}
                  onChange={(val) => handleFormChange('deadline', val)}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  lang={lang}
                />
              </div>

              {/* Тип тендера (Местный / Международный) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('tenderTypeLabel', 'Тип тендера')}
                </label>
                <CustomSelect
                  role={role}
                  value={formData.type}
                  onChange={(val) => handleFormChange('type', val)}
                  options={[
                    { id: 'YERLI', name: t('typeLocal', 'Местный (Ýerli)') },
                    { id: 'HALKARA', name: t('typeGlobal', 'Международный (Halkara)') }
                  ]}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>

              {/* Тип закупки (Товары / Работы / Услуги) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('procurementTypeLabel', 'Тип предмета закупки')}
                </label>
                <CustomSelect
                  role={role}
                  value={formData.procurementType}
                  onChange={(val) => handleFormChange('procurementType', val)}
                  options={[
                    { id: 'GOODS', name: t('catProducts', 'Товары (Harytlar)') },
                    { id: 'SERVICES_WORKS', name: t('servicesAndWorks', 'Работы и услуги') },
                    { id: 'MIXED', name: t('mixedType', 'Смешанный') }
                  ]}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              </div>
            </div>

            {/* Описание и требования */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('description', 'Описание тендера')}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                  placeholder={t('descriptionPlaceholder', 'Краткая аннотация и цели закупки...')}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                  {t('technicalSpecs', 'Общие требования к участникам')}
                </label>
                <textarea
                  rows={2}
                  value={formData.technicalSpecs}
                  onChange={(e) => handleFormChange('technicalSpecs', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                  placeholder={t('techSpecsPlaceholder', 'Общие квалификационные требования...')}
                />
              </div>
            </div>

            {/* Кнопка сохранения общих данных */}
            <div className="pt-2 flex justify-end">
              {tenderId ? (
                <button
                  type="button"
                  onClick={handleUpdateBaseTender}
                  disabled={savingBase}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{savingBase ? t('saving', 'Сохранение...') : t('saveBaseInfo', 'Сохранить общие данные')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateBaseTender}
                  disabled={savingBase}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span>{savingBase ? t('saving', 'Создание...') : t('saveDraftAndProceed', 'Создать черновик и перейти к лотам →')}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🟢 ШАГ 2: УПРАВЛЕНИЕ ЛОТАМИ (ТОЛЬКО ЕСЛИ ТЕНДЕР СОЗДАН В БАЗЕ) */}
      {tenderId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">2</span>
              <div>
                <h2 className={`text-base font-black ${theme.primaryText}`}>
                  {t('step2Title', 'Шаг 2: Управление лотами и спецификацией')}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('lotsAtomicHint', 'Каждый лот сохраняется и обрабатывается независимо в виде отдельной закладки')}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              {t('totalLotsCount', 'Всего лотов')}: <span className="text-emerald-600 font-mono text-sm">{lots.length}</span>
            </div>
          </div>

          {/* 📑 ЛИНЕЙКА ЗАКЛАДОК (ТАБОВ) КАК В УЧЕБНИКЕ */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {lots.map((lot, idx) => {
              const isActive = activeLotIndex === idx;
              return (
                <button
                  key={lot.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveLotIndex(idx);
                    setActiveLotDirty(false);
                  }}
                  className={`relative px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                      : isDarkMode
                      ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Bookmark size={14} className={isActive ? 'text-emerald-200' : 'text-slate-400'} />
                  <span className="truncate max-w-40">
                    {lot.name || `Лот №${lot.lotNumber || idx + 1}`}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    isActive 
                      ? 'bg-emerald-700 text-emerald-100' 
                      : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {lot.specs?.length || 0}
                  </span>
                </button>
              );
            })}

            {/* Кнопка добавления нового таба лота */}
            <button
              type="button"
              onClick={handleAddNewLotTab}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-dashed border-emerald-500/60 bg-emerald-50/60 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus size={15} />
              <span>{t('addLotTab', '+ Добавить лот')}</span>
            </button>
          </div>

          {/* 📄 СОДЕРЖИМОЕ АКТИВНОГО ЛОТА */}
          {activeLot ? (
            <div className={`p-6 rounded-2xl border shadow-xs space-y-6 ${theme.cardBg}`}>
              {/* Верхняя строка активного лота: Номер, Название, Тип, Категория */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                    {t('lotNumberLabel', 'Номер лота')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={activeLot.lotNumber || ''}
                    onChange={(e) => handleActiveLotChange('lotNumber', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none border ${theme.inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                    {t('lotNameLabel', 'Название лота')} *
                  </label>
                  <input
                    type="text"
                    value={activeLot.name || ''}
                    onChange={(e) => handleActiveLotChange('name', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold outline-none border ${theme.inputBg}`}
                    placeholder="Например: Поставка антибиотиков"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                    {t('lotTypeLabel', 'Тип лота')}
                  </label>
                  <CustomSelect
                    role={role}
                    value={activeLot.lotType || 'GOODS'}
                    onChange={(val) => handleActiveLotChange('lotType', val)}
                    options={[
                      { id: 'GOODS', name: t('catProducts', 'Товары (Goods)') },
                      { id: 'WORKS', name: t('worksType', 'Работы (Works)') },
                      { id: 'SERVICES', name: t('servicesType', 'Услуги (Services)') }
                    ]}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    t={t}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                    {t('lotCategory', 'Категория лота')}
                  </label>
                  <CustomSelect
                    role={role}
                    value={activeLot.categoryId || ''}
                    onChange={(val) => handleActiveLotChange('categoryId', val)}
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                    placeholder={t('selectCategory', 'Категория лота...')}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    t={t}
                  />
                </div>
              </div>

              {/* 🏢 КОНЕЧНЫЙ ПОЛУЧАТЕЛЬ (БЕНЕФИЦИАР) ЛОТА */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-black ${theme.primaryText}`}>
                    🏢 {t('endUser', 'Конечный получатель (Бенефициар)')}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {t('endUserHint', 'В отличие от Заказчика (Минздрав), это непосредственный получатель товара/услуг')}
                  </span>
                </div>
                <input
                  type="text"
                  value={activeLot.endUser || ''}
                  onChange={(e) => handleActiveLotChange('endUser', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${theme.inputBg}`}
                  placeholder={t('endUserPlaceholder', 'Например: IT-отдел Госпиталя №1 (при заказчике Минздрав)')}
                />
              </div>

              {/* Специфические условия: Товары (Incoterms), Работы (Адрес, Срок, Лицензия), Услуги (SLA, Формат) */}
              {activeLot.lotType === 'GOODS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      {t('deliveryTerm', 'Базис поставки (Incoterms)')}
                    </label>
                    <CustomSelect
                      role={role}
                      value={activeLot.deliveryTermId || ''}
                      onChange={(val) => handleActiveLotChange('deliveryTermId', val)}
                      options={deliveryTerms.map(dt => ({ id: dt.id, name: `${dt.shortName} — ${dt.name}` }))}
                      placeholder={t('selectDeliveryTerm', 'Выберите базис поставки...')}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      t={t}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      <MapPin size={13} className="inline mr-1 text-emerald-500" />
                      {t('deliveryAddressLabel', 'Пункт назначения / Адрес поставки')}
                    </label>
                    <input
                      type="text"
                      value={activeLot.deliveryAddress || ''}
                      onChange={(e) => handleActiveLotChange('deliveryAddress', e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                      placeholder={t('deliveryAddressPlaceholder', 'г. Ашхабад, Склад №2')}
                    />
                  </div>
                </div>
              )}

              {activeLot.lotType === 'WORKS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      <MapPin size={13} className="inline mr-1 text-amber-500" />
                      {t('siteLabel', 'Объект выполнения работ')}
                    </label>
                    <input
                      type="text"
                      value={activeLot.workAddress || ''}
                      onChange={(e) => handleActiveLotChange('workAddress', e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                      placeholder="г. Ашхабад, ул. Здоровья 14"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      <Clock size={13} className="inline mr-1 text-amber-500" />
                      {t('termLabel', 'Срок выполнения')}
                    </label>
                    <input
                      type="text"
                      value={activeLot.workPeriod || ''}
                      onChange={(e) => handleActiveLotChange('workPeriod', e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                      placeholder="60 календарных дней"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(activeLot.licenseRequired)}
                        onChange={(e) => handleActiveLotChange('licenseRequired', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-amber-600" />
                        {t('licenseRequired', 'Требуется строительная лицензия')}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {activeLot.lotType === 'SERVICES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      {t('serviceFormat', 'Формат оказания услуг')}
                    </label>
                    <CustomSelect
                      role={role}
                      value={activeLot.serviceFormat || 'ON_SITE'}
                      onChange={(val) => handleActiveLotChange('serviceFormat', val)}
                      options={[
                        { id: 'ON_SITE', name: t('onCustomerSiteFormat', 'На объекте заказчика (On-site)') },
                        { id: 'REMOTE', name: t('remoteFormat', 'Удаленно (Remote)') },
                        { id: 'HYBRID', name: t('formatHybrid', 'Гибридный (Hybrid)') }
                      ]}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      t={t}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme.subText}`}>
                      <Clock size={13} className="inline mr-1 text-blue-500" />
                      {t('slaPeriod', 'Требования к SLA / Реакции')}
                    </label>
                    <input
                      type="text"
                      value={activeLot.slaPeriod || ''}
                      onChange={(e) => handleActiveLotChange('slaPeriod', e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border ${theme.inputBg}`}
                      placeholder="24/7, реакция до 2 часов"
                    />
                  </div>
                </div>
              )}

              {/* 📎 ИЗОЛИРОВАННАЯ ДОКУМЕНТАЦИЯ ЛОТА */}
              <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('lotDocuments', 'Документация лота')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({t('lotDocsIsolatedHint', 'Файлы, прикрепленные именно к этому лоту')})
                    </span>
                  </div>

                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Plus size={13} />
                    <span>{t('uploadLotDocBtn', 'Прикрепить документ')}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleLotFileUpload}
                    />
                  </label>
                </div>

                {activeLot.files && activeLot.files.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {activeLot.files.map((fileObj, fIdx) => {
                      const doc = fileObj.document || fileObj;
                      return (
                        <div 
                          key={doc.id || fIdx} 
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-emerald-600 shrink-0" />
                            <a 
                              href={doc.filePath ? `http://localhost:5000/${doc.filePath}` : '#'} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline truncate"
                              title={doc.fileName || doc.name}
                            >
                              {doc.fileName || doc.name}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLotFileDelete(doc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title={t('delete', 'Удалить')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    {t('noLotDocumentsYet', 'Для этого лота пока не загружено документов.')}
                  </p>
                )}
              </div>

              {/* 📋 ТАБЛИЦА СПЕЦИФИКАЦИИ ПОЗИЦИЙ ДАННОГО ЛОТА */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {t('specificationsList', 'Спецификация позиций')} ({activeLot.specs?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800"
                  >
                    <Plus size={14} />
                    <span>{t('addPosition', 'Добавить позицию')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${theme.tableHeaderBg}`}>
                        <th className="py-2.5 px-3 w-12 text-center font-bold">#</th>
                        <th className="py-2.5 px-3 min-w-56 font-bold">
                          {activeLot.lotType === 'WORKS' 
                            ? t('workStages', 'Этап / вид работ')
                            : activeLot.lotType === 'SERVICES'
                            ? t('serviceName', 'Наименование услуги')
                            : t('product', 'Товар / МНН')} *
                        </th>
                        <th className="py-2.5 px-3 w-28 text-center font-bold">{t('unit', 'Ед. изм.')}</th>
                        {activeLot.lotType === 'GOODS' && (
                          <th className="py-2.5 px-3 w-36 text-center font-bold">{t('manufacturer', 'Производитель')}</th>
                        )}
                        <th className="py-2.5 px-3 w-24 text-center font-bold">
                          {activeLot.lotType === 'SERVICES' ? t('volumePeriod', 'Объем') : t('quantity', 'Кол-во')} *
                        </th>
                        <th className="py-2.5 px-3 min-w-44 font-bold">{t('description', 'Описание / Требования')}</th>
                        <th className="py-2.5 px-3 w-12 text-center font-bold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(!activeLot.specs || activeLot.specs.length === 0) ? (
                        <tr>
                          <td colSpan={activeLot.lotType === 'GOODS' ? 7 : 6} className="py-8 text-center text-slate-400">
                            {t('noSpecsInLot', 'В этом лоте пока нет позиций. Нажмите «+ Добавить позицию».')}
                          </td>
                        </tr>
                      ) : (
                        activeLot.specs.map((spec, sIdx) => (
                          <tr key={spec.id || sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                              {sIdx + 1}
                            </td>

                            <td className="py-2.5 px-3">
                              <ProductSearchableSelect
                                products={products}
                                value={spec.haryt || spec.name}
                                generalProductId={spec.generalProductId}
                                onChange={(val, genId) => handleSpecChange(sIdx, 'productSelect', val, genId)}
                                onOpenCreateModal={(initialName) => handleOpenProductModal(initialName, sIdx)}
                                placeholder={t('selectProduct', 'Выберите или введите...')}
                                isDarkMode={isDarkMode}
                                theme={theme}
                                lang={lang}
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <CustomSelect
                                role={role}
                                size="sm"
                                value={spec.unit || ''}
                                onChange={(val) => handleSpecChange(sIdx, 'unit', val)}
                                options={units.map(u => ({ id: u.id, name: u.shortName || u.name }))}
                                isDarkMode={isDarkMode}
                                theme={theme}
                                t={t}
                              />
                            </td>

                            {activeLot.lotType === 'GOODS' && (
                              <td className="py-2.5 px-3">
                                <CustomSelect
                                  role={role}
                                  size="sm"
                                  value={spec.brand || ''}
                                  onChange={(val) => handleSpecChange(sIdx, 'brand', val)}
                                  options={manufacturers.map(m => ({ id: m.id, name: m.name }))}
                                  placeholder={t('selectBrand', 'Бренд...')}
                                  isDarkMode={isDarkMode}
                                  theme={theme}
                                  t={t}
                                />
                              </td>
                            )}

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={spec.mukdar || 1}
                                onChange={(e) => handleSpecChange(sIdx, 'mukdar', e.target.value)}
                                className={`w-full px-2 py-1 rounded-md text-xs text-center font-mono font-bold outline-none border ${theme.inputBg}`}
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={spec.desc || ''}
                                onChange={(e) => handleSpecChange(sIdx, 'desc', e.target.value)}
                                className={`w-full px-2.5 py-1 rounded-md text-xs outline-none border ${theme.inputBg}`}
                                placeholder={t('specDescPlaceholder', 'Доп. требования...')}
                              />
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSpec(sIdx)}
                                className="w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title={t('delete', 'Удалить позицию')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 🟢 НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ АКТИВНОГО ЛОТА: СОХРАНИТЬ ТОЛЬКО ЭТОТ ЛОТ ИЛИ УДАЛИТЬ */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteActiveLot}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 size={14} />
                    <span>{t('deleteLotBtn', 'Удалить этот лот')}</span>
                  </button>

                  {activeLotDirty && (
                    <span className="text-xs text-amber-600 font-medium animate-pulse">
                      ● {t('unsavedChanges', 'Есть несохраненные изменения')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveActiveLot}
                  disabled={savingActiveLot}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>
                    {savingActiveLot 
                      ? t('saving', 'Сохранение...') 
                      : t('saveLotBtn', `Сохранить лот №${activeLot.lotNumber || activeLotIndex + 1}`)}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-3">
              <Package size={36} className="mx-auto text-slate-400 opacity-50" />
              <p className="text-sm font-medium">
                {t('noLotsYet', 'У тендера пока нет лотов. Нажмите «+ Добавить лот», чтобы создать первый лот.')}
              </p>
              <button
                type="button"
                onClick={handleAddNewLotTab}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} />
                <span>{t('addLotTab', '+ Добавить лот')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно быстрого добавления товара в каталог */}
      <CatalogFormModal
        isOpen={catalogModal.isOpen}
        onClose={() => setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null })}
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
