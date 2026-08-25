import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Check, ArrowLeft, Download } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString } from '../utils/themeUtils';

export default function CreateOfferPage({ role, isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  // Справочники, загруженные с API
  const [currencies, setCurrencies] = useState([]);
  const [deliveryTerms, setDeliveryTermsList] = useState([]);

  const [currency, setCurrency] = useState(''); // UUID валюты
  const [deliveryTerm, setDeliveryTerm] = useState(''); // UUID условия поставки
  const [paymentTerms, setPaymentTerms] = useState('');
  const [comment, setComment] = useState('');

  // Выбранное модальное окно добавления позиций (Слайд 6)
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    haryt: '',
    unit: '',
    mukdar: '',
    price: '',
    brand: '',
    desc: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpecForModal, setSelectedSpecForModal] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    // Загружаем тендер + справочники параллельно
    Promise.all([
      API.get(`/tenders/${id}`),
      API.get('/catalogs/currencies').catch(() => ({ data: [] })),
      API.get('/catalogs/delivery-terms').catch(() => ({ data: [] })),
    ]).then(([tenderRes, currRes, dtRes]) => {
      setTender(tenderRes.data);
      if (tenderRes.data?.specs) {
        setOfferItems(tenderRes.data.specs.map(spec => ({
          tenderSpecId: spec.id,
          haryt: spec.generalProduct?.name || spec.name,
          unit: spec.unit?.name || spec.unit?.shortName || '',
          brand: spec.manufacturer?.name || '',
          mukdar: spec.quantity,
          price: 0,
          desc: ''
        })));
      }

      // Устанавливаем справочники
      const loadedCurrencies = Array.isArray(currRes.data) ? currRes.data.filter(c => c.isActive) : [];
      setCurrencies(loadedCurrencies);
      if (loadedCurrencies.length > 0) {
        setCurrency(loadedCurrencies[0].id); // UUID первой валюты
      }

      const loadedDT = Array.isArray(dtRes.data) ? dtRes.data.filter(c => c.isActive) : [];
      setDeliveryTermsList(loadedDT);
      if (loadedDT.length > 0) {
        setDeliveryTerm(loadedDT[0].id); // UUID первого условия поставки
      }
    })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  // Позиции предложения
  const [offerItems, setOfferItems] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

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
      alert('Ошибка загрузки файла');
    }
    
    e.target.value = ''; // сброс инпута
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSaveItem = () => {
    if (editIndex !== null) {
      const updated = [...offerItems];
      updated[editIndex] = newItem;
      setOfferItems(updated);
    } else {
      setOfferItems([...offerItems, { ...newItem, id: Date.now().toString() }]);
    }
    setShowItemModal(false);
  };

  const handleEditItem = (index) => {
    const itemToEdit = offerItems[index];
    setNewItem(itemToEdit);
    setEditIndex(index);
    const originalSpec = tender?.specs?.find(s => s.id === itemToEdit.tenderSpecId);
    setSelectedSpecForModal(originalSpec || null);
    setShowItemModal(true);
  };

  const handleRemoveItem = (index) => {
    setOfferItems(offerItems.filter((_, i) => i !== index));
  };

  const handleSubmitOffer = async () => {
    setIsSubmitting(true);
    try {
      await API.post('/offers', {
        tenderId: id,
        deliveryTermId: deliveryTerm || null, // UUID условия поставки
        baseCurrencyId: currency || null, // UUID валюты
        paymentTerms,
        comment,
        attachedDocumentIds: uploadedFiles.map(f => f.id),
        specs: offerItems.map(item => ({
          tenderSpecId: item.tenderSpecId,
          quantity: item.mukdar,
          unitPrice: item.price,
          description: item.desc
        }))
      });
      alert(`✅ ${t('successOffer', 'Kommerçiýa teklibi üstünlikli iberildi!')}`);
      navigate('/offers');
    } catch (err) {
      alert(`❌ ${t('errorOffer', 'Ýalňyşlyk: Teklip iberilmedi! ')}` + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">{t('loading', 'Загрузка...')}</div>;

  return (
    <div className="space-y-6 pb-12 text-sm">
      {/* Шапка формы */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
        <h2 className="text-[28px] font-bold text-[#1e3a8a]">{t('createOfferTitle', 'Teklip döretmek')}</h2>

        <div className="flex items-center space-x-3 text-sm">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded transition-colors"
          >
            {t('cancelBtn', 'Ret etmek')}
          </button>
          <button
            onClick={handleSubmitOffer}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#254b8a] hover:bg-blue-900 text-white font-medium rounded transition-colors"
          >
            {t('saveBtn', 'Ýatda sakla')}
          </button>
        </div>
      </div>

      {/* Основная карточка с деталями лота и инпутами */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
        {/* Lot Details */}
        <div className="pb-5 mb-5 border-b border-slate-100">
          <h3 className="text-2xl font-bold text-[#1e3a8a]">{safeString(tender?.lotNumber)}</h3>
          <p className="text-sm text-slate-500 mt-1">{safeString(tender?.title)}</p>
        </div>

        {/* Основные поля ввода */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="block text-slate-700 mb-1.5 font-medium">{t('currency', 'Walýuta')}*</label>
            <div className="flex items-center space-x-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{t('selectCurrency', 'Выберите валюту')}</option>
                {currencies.map(c => (
                  <option key={c.id} value={c.id}>{c.flag || ''} {c.code} — {c.name}</option>
                ))}
              </select>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300"><Plus size={16} /></button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-medium">{t('deliveryTerm', 'Eltip beriş şerti')}*</label>
            <div className="flex items-center space-x-2">
              <select
                value={deliveryTerm}
                onChange={(e) => setDeliveryTerm(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{t('selectDeliveryTerm', 'Выберите условие')}</option>
                {deliveryTerms.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.shortName} — {dt.name}</option>
                ))}
              </select>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300"><Plus size={16} /></button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-medium">{t('paymentTerms', 'Töleg şerti')}*</label>
            <textarea
              placeholder="..."
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-medium">{t('comment', 'Bellik')}</label>
            <textarea
              placeholder="..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Двухколоночный блок таблиц спецификаций */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Левая таблица: Tender spesifikasiýasy */}
        <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-4 py-3 border-b border-slate-300 font-bold text-slate-800">
            {t('tenderSpecs', 'Tender spesifikasiýa')}
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse min-w-max">
              <thead>
                <tr className="bg-[#254b8a] text-white">
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">H/K</th>
                  <th className="py-2 px-3 border-r border-blue-800/30">{t('product', 'Haryt')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('unit', 'Ölçeg birligi')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30">{t('manufacturer', 'Öndüriji')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('quantity', 'Mukdary')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('description', 'Mazmuny')}</th>
                  <th className="py-2 px-3 text-center">{t('action', 'Amal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tender?.specs?.length > 0 ? tender.specs.map((spec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">{spec.positionNumber || idx + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-700 truncate max-w-[100px]" title={spec.generalProduct?.name || spec.name}>{spec.generalProduct?.name || spec.name}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-600">{spec.unit?.name || spec.unit?.shortName || '-'}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 truncate max-w-[80px]" title={spec.manufacturer?.name || '-'}>{spec.manufacturer?.name || '-'}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">{spec.quantity}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-500 truncate max-w-[120px]" title={spec.description || ''}>{spec.description || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        onClick={() => {
                          setEditIndex(null);
                          setSelectedSpecForModal(spec);
                          setNewItem({
                            tenderSpecId: spec.id,
                            haryt: spec.generalProduct?.name || spec.name,
                            unit: spec.unit?.name || spec.unit?.shortName || '',
                            brand: spec.manufacturer?.name || '',
                            mukdar: spec.quantity,
                            price: 0,
                            desc: ''
                          });
                          setShowItemModal(true);
                        }} 
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <ArrowLeft className="rotate-[135deg]" size={15} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-400">
                      {lang === 'RU' ? 'Нет спецификаций' : 'Spesifikasiýa ýok'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Правая таблица: Saýlananlar */}
        <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-4 py-3 border-b border-slate-300 font-bold text-slate-800">
            {t('selectedItems', 'Saýlananlar')}
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse min-w-max">
              <thead>
                <tr className="bg-[#254b8a] text-white">
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">H/K</th>
                  <th className="py-2 px-3 border-r border-blue-800/30">{t('product', 'Haryt')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('unit', 'Ölçeg birligi')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30">{t('manufacturer', 'Öndüriji')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('quantity', 'Mukdary')}</th>
                  <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('description', 'Mazmuny')}</th>
                  <th className="py-2 px-3 text-center">{t('action', 'Amal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {offerItems.length > 0 ? offerItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-700">{item.haryt}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">{item.brand}</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">{item.mukdar}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="truncate max-w-[120px] text-slate-500 block" title={item.desc}>{item.desc || '-'}</span>
                    </td>
                    <td className="py-2.5 px-3 flex items-center justify-center space-x-1">
                      <button onClick={() => handleEditItem(idx)} className="p-1 text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                      </button>
                      <button onClick={() => handleRemoveItem(idx)} className="p-1 text-rose-400 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-400">
                      {lang === 'RU' ? 'Ничего не выбрано' : 'Hiç zat saýlanmady'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Таблицы документов */}
      <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm mt-6">
        <div className="px-4 py-3 border-b border-slate-300 font-bold text-slate-800 flex justify-between items-center">
          <span>{t('documents', 'Документы тендера')}</span>
          {/* Убрали плюсик отсюда, так как это документы тендера */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#254b8a] text-white">
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">#</th>
                <th className="py-2 px-3 border-r border-blue-800/30">{t('fileName', 'Faýl ady')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('description', 'Mazmuny')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('size', 'Ölçegi')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{lang === 'RU' ? 'Дата загрузки' : 'Ýüklenen senesi'}</th>
                <th className="py-2 px-3 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tender?.files?.length > 0 ? (
                tender.files.map((fileObj, idx) => {
                  const doc = fileObj.document;
                  if (!doc) return null;
                  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : '-';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-3 px-3 border-r border-slate-200 font-medium text-slate-700">{safeString(doc.fileName || doc.name)}</td>
                      <td className="py-3 px-3 border-r border-slate-200 text-slate-600 text-center">{safeString(doc.description)}</td>
                      <td className={`py-3 px-3 border-r border-slate-200 font-bold text-center ${doc.fileType === 'PDF' ? 'text-rose-600' : 'text-blue-600'}`}>
                        {safeString(doc.fileType || doc.type)}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-slate-500 text-center">{safeString(doc.size, '-')}</td>
                      <td className="py-3 px-3 border-r border-slate-200 text-slate-500 text-center">{dateStr}</td>
                      <td className="py-3 px-3 text-center space-x-2">
                        <button className="text-[#1e3a8a] hover:text-blue-900"><Download size={15} /></button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {lang === 'RU' ? 'Документы отсутствуют' : 'Resminama ýok'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm mt-6">
        <div className="px-4 py-3 border-b border-slate-300 font-bold text-slate-800 flex justify-between items-center">
          <span>{lang === 'RU' ? 'Ваши документы (Сертификаты и др.)' : 'Siziň resminamalaryňyz'}</span>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="p-1 text-slate-500 hover:bg-slate-100 rounded-full border border-transparent hover:border-slate-300"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#254b8a] text-white">
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">#</th>
                <th className="py-2 px-3 border-r border-blue-800/30">{t('fileName', 'Faýl ady')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-2 px-3 border-r border-blue-800/30 text-center">{lang === 'RU' ? 'Дата загрузки' : 'Ýüklenen senesi'}</th>
                <th className="py-2 px-3 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((doc, idx) => {
                  const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : '-';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-3 px-3 border-r border-slate-200 font-medium text-slate-700">{safeString(doc.fileName || doc.name)}</td>
                      <td className={`py-3 px-3 border-r border-slate-200 font-bold text-center ${doc.fileType?.includes('pdf') ? 'text-rose-600' : 'text-blue-600'}`}>
                        {safeString(doc.fileType)}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-slate-500 text-center">{dateStr}</td>
                      <td className="py-3 px-3 text-center space-x-2">
                        <button onClick={() => handleRemoveFile(idx)} className="text-rose-500 hover:text-rose-700">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    {lang === 'RU' ? 'Вы еще не прикрепили файлы' : 'Siz entek faýl goşmadyňyz'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 МОДАЛЬНОЕ ОКНО "Goşulýan haryt" из Слайда 6 */}
      {showItemModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 animate-in zoom-in-95`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${theme.primaryText}`}>{t('offerForItem', 'Предложение по позиции')}</h3>
              <button onClick={() => setShowItemModal(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                <X size={18} />
              </button>
            </div>

            {selectedSpecForModal && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 mb-4 shadow-inner">
                <div className="font-semibold text-slate-700 mb-1.5 pb-1.5 border-b border-slate-200">{t('customerRequest', 'Запрос заказчика:')}</div>
                <div className="space-y-1">
                  <div><span className="font-medium text-slate-800">Товар:</span> {selectedSpecForModal.generalProduct?.name || selectedSpecForModal.name}</div>
                  <div><span className="font-medium text-slate-800">Ед. изм:</span> {selectedSpecForModal.unit?.name || selectedSpecForModal.unit?.shortName || '-'}</div>
                  <div><span className="font-medium text-slate-800">Количество:</span> {selectedSpecForModal.quantity}</div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('offeredProduct', 'Предлагаемый товар (Аналог)')}*</label>
                <input
                  type="text"
                  value={newItem.haryt}
                  onChange={(e) => setNewItem({ ...newItem, haryt: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('unit', 'Ölçeg birligi')}*</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('qty', 'Mukdary')}*</label>
                  <input
                    type="number"
                    value={newItem.mukdar}
                    onChange={(e) => setNewItem({ ...newItem, mukdar: Number(e.target.value) })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block font-semibold mb-1 ${theme.subText}`}>
                    {t('price', 'Цена за ед.')} {currency ? `(${currencies?.find(c => c.id === currency)?.code || ''})` : ''}*
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('manufacturer', 'Öndüriji')}*</label>
                  <input
                    type="text"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('description', 'Mazmuny')}*</label>
                <input
                  type="text"
                  value={newItem.desc}
                  onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveItem}
                className="px-5 py-2 bg-[#254b8a] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {t('saveBtn', 'Ýatda sakla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
