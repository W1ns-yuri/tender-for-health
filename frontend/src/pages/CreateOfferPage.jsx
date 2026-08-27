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
      if (tenderRes.data?.lots) {
        const initialSelectedLots = {};
        const initialOfferItems = {};
        
        tenderRes.data.lots.forEach(lot => {
          initialSelectedLots[lot.id] = true; // Select all lots by default
          initialOfferItems[lot.id] = lot.specs.map(spec => ({
            tenderSpecId: spec.id,
            lotId: lot.id,
            haryt: spec.generalProduct?.name || spec.name,
            unit: spec.unit?.name || spec.unit?.shortName || '',
            brand: spec.manufacturer?.name || '',
            mukdar: spec.quantity,
            price: 0,
            desc: ''
          }));
        });
        
        setSelectedLots(initialSelectedLots);
        setOfferItemsByLot(initialOfferItems);
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
  // Позиции предложения сгруппированы по лотам: { lotId: [offerItem1, offerItem2] }
  const [offerItemsByLot, setOfferItemsByLot] = useState({});
  const [selectedLots, setSelectedLots] = useState({}); // { lotId: boolean }
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

  const [activeLotIdForModal, setActiveLotIdForModal] = useState(null);

  const handleSaveItem = () => {
    if (!activeLotIdForModal) return;
    const lotItems = [...(offerItemsByLot[activeLotIdForModal] || [])];
    
    if (editIndex !== null) {
      lotItems[editIndex] = newItem;
    } else {
      lotItems.push({ ...newItem, id: Date.now().toString() });
    }
    
    setOfferItemsByLot({
      ...offerItemsByLot,
      [activeLotIdForModal]: lotItems
    });
    
    setShowItemModal(false);
  };

  const handleEditItem = (lotId, index) => {
    const itemToEdit = offerItemsByLot[lotId][index];
    setNewItem(itemToEdit);
    setEditIndex(index);
    setActiveLotIdForModal(lotId);
    
    const lot = tender?.lots?.find(l => l.id === lotId);
    const originalSpec = lot?.specs?.find(s => s.id === itemToEdit.tenderSpecId);
    setSelectedSpecForModal(originalSpec || null);
    setShowItemModal(true);
  };

  const handleRemoveItem = (lotId, index) => {
    const lotItems = [...(offerItemsByLot[lotId] || [])];
    lotItems.splice(index, 1);
    setOfferItemsByLot({
      ...offerItemsByLot,
      [lotId]: lotItems
    });
  };

  const toggleLotSelection = (lotId) => {
    setSelectedLots(prev => ({ ...prev, [lotId]: !prev[lotId] }));
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
        specs: Object.keys(selectedLots)
          .filter(lotId => selectedLots[lotId])
          .flatMap(lotId => (offerItemsByLot[lotId] || []).map(item => ({
            tenderSpecId: item.tenderSpecId,
            quantity: item.mukdar,
            unitPrice: item.price,
            description: item.desc
          })))
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
          <h3 className="text-2xl font-bold text-[#1e3a8a]">{safeString(tender?.tenderNumber)}</h3>
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

      {/* Лоты и позиции */}
      <div className="space-y-6 pt-4">
        {tender?.lots?.map((lot, lotIdx) => (
          <div key={lot.id} className={`border rounded bg-white overflow-hidden shadow-sm flex flex-col ${!selectedLots[lot.id] ? 'opacity-50 grayscale transition-all' : ''}`}>
            <div className="px-4 py-3 border-b border-slate-300 font-bold text-slate-800 flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={!!selectedLots[lot.id]} 
                onChange={() => toggleLotSelection(lot.id)}
                className="w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                 <span className="text-base">{lot.name}</span>
                 {lot.deliveryTerm && <span className="ml-4 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{t('deliveryTerm', 'Условие поставки')}: {lot.deliveryTerm.shortName}</span>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-slate-200">
               {/* Левая часть: Запрос заказчика */}
               <div className="border-r border-slate-200">
                  <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                     {t('customerRequest', 'Запрос заказчика')}
                  </div>
                  <table className="w-full text-left text-xs border-collapse min-w-max">
                    <tbody className="divide-y divide-slate-100">
                      {lot.specs.map((spec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 w-[5%] text-center text-slate-500">{spec.positionNumber || idx + 1}</td>
                          <td className="py-2 px-3 w-[45%] font-medium text-slate-700 truncate max-w-[120px]" title={spec.generalProduct?.name || spec.name}>{spec.generalProduct?.name || spec.name}</td>
                          <td className="py-2 px-3 w-[20%] text-center text-slate-600">{spec.unit?.shortName || spec.unit?.name || '-'}</td>
                          <td className="py-2 px-3 w-[15%] text-center text-slate-600">{spec.quantity}</td>
                          <td className="py-2 px-3 w-[15%] text-center">
                            <button 
                              disabled={!selectedLots[lot.id]}
                              onClick={() => {
                                setEditIndex(null);
                                setActiveLotIdForModal(lot.id);
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
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                            >
                              <ArrowLeft className="rotate-[135deg]" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               
               {/* Правая часть: Ваше предложение */}
               <div>
                  <div className="px-3 py-2 bg-blue-50 text-xs font-semibold text-blue-800 border-b border-slate-200">
                     {t('yourOffer', 'Ваше предложение по лоту')}
                  </div>
                  <table className="w-full text-left text-xs border-collapse min-w-max">
                    <tbody className="divide-y divide-slate-100">
                      {(offerItemsByLot[lot.id] || []).length > 0 ? (
                        (offerItemsByLot[lot.id] || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="py-2 px-3 font-medium text-slate-700 truncate max-w-[120px]">{item.haryt}</td>
                            <td className="py-2 px-3 text-center text-slate-600">{item.mukdar} {item.unit}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">{item.price} {currency ? (currencies.find(c => c.id === currency)?.code) : ''}</td>
                            <td className="py-2 px-3 text-center space-x-1">
                              <button disabled={!selectedLots[lot.id]} onClick={() => handleEditItem(lot.id, idx)} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><Edit2 size={13}/></button>
                              <button disabled={!selectedLots[lot.id]} onClick={() => handleRemoveItem(lot.id, idx)} className="p-1 text-rose-400 hover:text-rose-600 disabled:opacity-30"><Trash2 size={13}/></button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-slate-400">
                            {lang === 'RU' ? 'Вы еще не предложили товары' : 'Haryt hödürlemediňiz'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        ))}
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
