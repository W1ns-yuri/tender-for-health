import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, ArrowLeft, X, Upload, ChevronDown } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';


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

export default function CreateTenderPage({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [formData, setFormData] = useState({
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

  const [lots, setLots] = useState([{ id: Date.now(), name: 'Лот 1', deliveryTermId: '', specs: [] }]);
  const [activeLotIndex, setActiveLotIndex] = useState(null);
  const [docs, setDocs] = useState([]);

  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editSpecIndex, setEditSpecIndex] = useState(null);
  const [newSpec, setNewSpec] = useState({
    haryt: '',
    unit: '',
    type: 'Haryt',
    brand: '',
    mukdar: 1,
    desc: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Загружаем справочники с API
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  useEffect(() => {
    API.get('/catalogs/categories').then(res => { if (Array.isArray(res.data)) setCategories(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/currencies').then(res => { if (Array.isArray(res.data)) setCurrencies(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/units').then(res => { if (Array.isArray(res.data)) setUnits(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/manufacturers').then(res => { if (Array.isArray(res.data)) setManufacturers(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/delivery-terms').then(res => { if (Array.isArray(res.data)) setDeliveryTerms(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/clients').then(res => { if (Array.isArray(res.data)) setClients(res.data.filter(c => c.isActive)); }).catch(() => {});
  }, []);

  const handleSaveSpec = () => {
    if (!newSpec.haryt || !newSpec.unit || !newSpec.mukdar) {
      alert(t('fillRequiredFields', 'Заполните обязательные поля (Haryt, Ölçeg birligi, Mukdary)'));
      return;
    }
    const selectedUnit = units.find(u => u.id === newSpec.unit);
    const selectedBrand = manufacturers.find(m => m.id === newSpec.brand);

    const formattedSpec = {
      ...newSpec,
      unitName: selectedUnit ? selectedUnit.shortName : newSpec.unit,
      brandName: selectedBrand ? selectedBrand.name : newSpec.brand
    };

    const updatedLots = [...lots];
    const targetLot = updatedLots[activeLotIndex];

    if (editSpecIndex !== null) {
      targetLot.specs[editSpecIndex] = { ...formattedSpec, hk: targetLot.specs[editSpecIndex].hk };
    } else {
      targetLot.specs.push({ ...formattedSpec, hk: (targetLot.specs.length + 1).toString() });
    }
    setLots(updatedLots);
    
    setShowSpecModal(false);
    setEditSpecIndex(null);
    setActiveLotIndex(null);
    setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' });
  };

  const handleRemoveSpec = (lotIdx, specIdx) => {
    const updated = [...lots];
    updated[lotIdx].specs = updated[lotIdx].specs.filter((_, i) => i !== specIdx);
    setLots(updated);
  };
  
  const handleAddLot = () => {
    setLots([...lots, { id: Date.now(), name: `Лот ${lots.length + 1}`, deliveryTermId: '', specs: [] }]);
  };
  
  const handleRemoveLot = (lotIdx) => {
    if (lots.length === 1) return alert(lang === 'RU' ? 'Должен быть хотя бы один лот' : 'Iň bolmanda bir lot bolmaly');
    setLots(lots.filter((_, i) => i !== lotIdx));
  };
  
  const handleLotChange = (lotIdx, field, value) => {
    const updated = [...lots];
    updated[lotIdx][field] = value;
    setLots(updated);
  };

  const handleEditSpec = (index) => {
    setNewSpec(specs[index]);
    setEditSpecIndex(index);
    setShowSpecModal(true);
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
    // In a real scenario, you'd optionally send tenderId or documentTypeId if the endpoint requires it.

    try {
      setLoading(true);
      setErrorMsg('');
      const response = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newDoc = {
        id: response.data.id || Date.now().toString(),
        name: response.data.fileName || file.name,
        desc: t('uploadedFile', 'Загруженный файл'),
        type: file.name.split('.').pop().toUpperCase(),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('ru-RU')
      };

      setDocs([...docs, newDoc]);
    } catch (err) {
      console.error(err);
      alert(t('fileUploadError', 'Ошибка загрузки файла') + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const hasSpecs = lots.some(lot => lot.specs.length > 0);
    if (!hasSpecs) {
      setErrorMsg(t('specRequired', 'Добавьте хотя бы один лот со спецификациями'));
      setLoading(false);
      return;
    }

    if (!formData.announcementDate || !formData.deadline || !formData.clientId || !formData.categoryId) {
      setErrorMsg(t('fillRequired', 'Заполните обязательные поля (даты)'));
      setLoading(false);
      return;
    }

    try {
      await API.post('/tenders', {
        tenderNumber: `Lot № ${Math.floor(Math.random() * 900) + 100}`,
        title: formData.title,
        description: formData.description,
        technicalSpecs: formData.technicalSpecs,
        type: formData.type,
        status: formData.status,
        visibility: formData.visibility,
        // categoryId is omitted because "1" is not a valid UUID in the database
        categoryId: formData.categoryId !== '' ? formData.categoryId : undefined,
        clientId: formData.clientId !== '' ? formData.clientId : undefined,
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        lots: lots.map((lot, lotIdx) => ({
          name: lot.name,
          deliveryTermId: lot.deliveryTermId || undefined,
          specs: lot.specs.map((s, idx) => ({
            positionNumber: idx + 1,
            name: s.haryt,
            quantity: parseFloat(s.mukdar) || 1,
            unitId: s.unit || undefined,
            manufacturerId: s.brand || undefined,
            description: s.desc
          }))
        })),
        documents: docs.map(d => d.id) // passing array of document IDs if the backend supports it
      });

      alert(t('tenderCreatedSuccess', 'Тендер успешно создан!'));
      if (onNavigate) onNavigate('tenders');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
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

        
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}

      {/* 2. Форма ввода данных */}
      <form id="create-tender-form" onSubmit={handleSubmit} className={`p-6 rounded-xl border shadow-xs space-y-5 ${theme.cardBg}`}>
        {/* Строка 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('tenderName', 'Tender ady')}*</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('category', 'Kategoriýa')}*</label>
            <div className="flex space-x-1.5">
              <SearchableSelect 
                t={t}
                options={categories} 
                value={formData.categoryId} 
                onChange={(val) => setFormData({ ...formData, categoryId: val })} 
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
                onChange={(val) => setFormData({ ...formData, clientId: val })} 
                placeholder={t('select', 'Saýlaň...')} 
                isDarkMode={isDarkMode} 
                theme={theme} 
              />
            </div>
          </div>
        </div>

        {/* Строка 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('type', 'Görnüşi')}*</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="YERLI">{t('typeLocal', 'Ýerli')}</option>
              <option value="HALKARA">{t('typeGlobal', 'Halkara')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('announcementDate', 'Yglan edilen senesi')}*</label>
            <input
              type="date"
              required
              value={formData.announcementDate}
              onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('deadline', 'Soňky möhleti')}*</label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Строка 3 */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>{t('description', 'Tender mazmuny')}*</label>
          </div>
          <textarea
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full p-3 rounded-lg text-xs ${theme.inputBg}`}
          />
        </div>

        {/* Строка 4 */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>{t('techSpecs', 'Tehniki şartler')}*</label>
          </div>
          <textarea
            rows={4}
            required
            value={formData.technicalSpecs}
            onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
            className={`w-full p-3 rounded-lg text-xs ${theme.inputBg}`}
          />
        </div>

        {/* Строка 5 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('status', 'Status')}*</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="ACYK">{t('visibilityPublic', 'Açyk')}</option>
              <option value="YAPYK">{t('visibilityPrivate', 'Ýapyk')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('currency', 'Walýuta')}*</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              {currencies.map(c => (<option key={c.id} value={c.code}>{c.code} - {c.name}</option>))}
            </select>
          </div>
        </div>
      </form>

      {/* 3. Лоты и Спецификации */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-lg ${theme.primaryText}`}>{lang === 'RU' ? 'Лоты и позиции' : 'Lotlar we pozisiýalar'}</h3>
          <button type="button" onClick={handleAddLot} className="px-4 py-2 text-xs rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors flex items-center gap-1.5">
            <Plus size={14} /> {lang === 'RU' ? 'Добавить лот' : 'Lot goş'}
          </button>
        </div>

        {lots.map((lot, lotIdx) => (
          <div key={lot.id} className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className={`p-4 border-b flex items-end justify-between gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-white'}`}>
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Название лота' : 'Lot ady'}*</label>
                   <input
                     type="text"
                     required
                     value={lot.name}
                     onChange={(e) => handleLotChange(lotIdx, 'name', e.target.value)}
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
               <div className="flex items-center gap-2 mt-4 md:mt-0">
                 <button type="button" onClick={() => { setActiveLotIndex(lotIdx); setShowSpecModal(true); }} className="px-3 py-2 text-xs rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                   <Plus size={14} /> {lang === 'RU' ? 'Товар' : 'Haryt'}
                 </button>
                 {lots.length > 1 && (
                   <button type="button" onClick={() => handleRemoveLot(lotIdx)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Удалить лот">
                     <Trash2 size={16} />
                   </button>
                 )}
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`font-medium text-white ${isDarkMode ? 'bg-teal-900' : 'bg-teal-600'}`}>
                    <th className="py-2.5 px-4 w-[5%] text-center">H/K</th>
                    <th className="py-2.5 px-4 w-[25%]">{t('specProduct', 'Haryt')}</th>
                    <th className="py-2.5 px-4 w-[10%] text-center">{t('specUnit', 'Ölçeg birligi')}</th>
                    <th className="py-2.5 px-4 w-[15%] text-center">{t('specBrand', 'Öndüriji')}</th>
                    <th className="py-2.5 px-4 w-[10%] text-center">{t('specQty', 'Mukdar')}</th>
                    <th className="py-2.5 px-4 w-[25%]">{t('specDesc', 'Mazmuny')}</th>
                    <th className="py-2.5 px-4 w-[10%] text-center">{t('action', 'Amal')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {lot.specs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400">
                        {lang === 'RU' ? 'В этот лот еще не добавлены товары' : 'Bu lota entek haryt goşulmady'}
                      </td>
                    </tr>
                  ) : lot.specs.map((item, idx) => (
                    <tr key={idx} className={theme.tableRowHover}>
                      <td className="py-3 px-4 font-semibold text-slate-400 text-center">{item.hk}</td>
                      <td className="py-3 px-4 font-medium">{item.haryt}</td>
                      <td className="py-3 px-4 text-center">{item.unitName}</td>
                      <td className="py-3 px-4 text-center">{item.brandName || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold">{item.mukdar}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.desc}</td>
                      <td className="py-3 px-4 text-center space-x-1">
                        <button type="button" onClick={() => handleEditSpec(lotIdx, idx)} className="p-1 hover:bg-teal-500/10 text-teal-600 rounded">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleRemoveSpec(lotIdx, idx)} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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

      <div className="flex justify-end pt-4">
        <button
          form="create-tender-form"
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Save size={18} />
          <span>{loading ? t('saving', 'Saklanýar...') : t('saveTender', 'Ýatda sakla')}</span>
        </button>
      </div>

      {/* Модальное окно для добавления спецификации */}
      {showSpecModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 animate-in zoom-in-95`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">{editSpecIndex !== null ? t('editSpec', 'Изменить позицию') : t('addSpec', 'Täze pozisiýa goş')}</h3>
              <button onClick={() => { setShowSpecModal(false); setEditSpecIndex(null); setActiveLotIndex(null); setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' }); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('specProduct', 'Haryt')}*</label>
                <input
                  type="text"
                  value={newSpec.haryt}
                  onChange={(e) => setNewSpec({ ...newSpec, haryt: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">{t('specUnit', 'Ölçeg birligi')}*</label>
                  <select
                    value={newSpec.unit}
                    onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  >
                    <option value="">{t('selectUnit', 'Выберите ед. изм.')}</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('specQty', 'Mukdary')}*</label>
                  <input
                    type="number"
                    min="1"
                    value={newSpec.mukdar}
                    onChange={(e) => setNewSpec({ ...newSpec, mukdar: Number(e.target.value) })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('specBrand', 'Öndüriji')}</label>
                <select
                  value={newSpec.brand}
                  onChange={(e) => setNewSpec({ ...newSpec, brand: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                >
                  <option value="">{t('selectBrand', 'Выберите производителя (опционально)')}</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('specDesc', 'Mazmuny')}</label>
                <input
                  type="text"
                  value={newSpec.desc}
                  onChange={(e) => setNewSpec({ ...newSpec, desc: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowSpecModal(false); setEditSpecIndex(null); setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' }); }}
                className="px-5 py-2.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                {t('cancel', 'Отмена')}
              </button>
              <button
                type="button"
                onClick={handleSaveSpec}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm"
              >
                {t('save', 'Ýatda sakla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
