import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Paperclip } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme, safeString } from '../utils/themeUtils';

export default function OfferModal({ tender, onClose, onSuccess, role, isDarkMode, lang = 'RU' }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);
  
  const [currency, setCurrency] = useState('TMT');
  const [deliveryTerm, setDeliveryTerm] = useState('CIP');
  const [paymentTerms, setPaymentTerms] = useState('Umumy mukdarynyň 50% geçirildi');
  const [comment, setComment] = useState('');
  
  // Позиции предложения
  const [offerItems, setOfferItems] = useState(
    tender?.specs?.map(spec => ({
      tenderSpecId: spec.id,
      haryt: spec.generalProduct?.name || spec.name,
      unit: spec.unit?.name || spec.unit?.shortName || '',
      brand: spec.manufacturer?.name || '',
      mukdar: spec.quantity,
      price: 0,
      desc: ''
    })) || []
  );

  // Выбранное модальное окно добавления позиций (Слайд 6)
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    haryt: 'Parasetamol 500mg',
    unit: 'уп',
    mukdar: 500,
    price: 20,
    brand: 'A kompaniýa',
    desc: 'Высокое качество'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setOfferItems([...offerItems, { ...newItem, id: Date.now().toString() }]);
    setShowItemModal(false);
  };

  const handleRemoveItem = (index) => {
    setOfferItems(offerItems.filter((_, i) => i !== index));
  };

  const handleSubmitOffer = async () => {
    setIsSubmitting(true);
    try {
      await API.post('/offers', {
        tenderId: tender?.id,
        deliveryTermId: null,
        baseCurrencyId: currency,
        paymentTerms,
        comment,
        specs: offerItems.map(item => ({
          tenderSpecId: item.tenderSpecId,
          quantity: item.mukdar,
          unitPrice: item.price,
          description: item.desc
        }))
      });
      alert(`✅ ${t('successOffer', 'Kommerçiýa teklibi üstünlikli iberildi!')}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(`❌ ${t('errorOffer', 'Ýalňyşlyk: Teklip iberilmedi! ')}` + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* Шапка формы из Слайда 5 */}
        <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <div>
            <h2 className={`text-lg font-bold ${theme.primaryText}`}>{t('createOfferTitle', 'Teklip döretmek')}</h2>
            <p className="text-xs font-semibold text-teal-600">{tender?.tenderNumber || 'Lot № 325'}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {t('cancelBtn', 'Ret etmek')}
            </button>
            <button
              onClick={handleSubmitOffer}
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Check size={15} />
              <span>{t('saveBtn', 'Ýatda sakla')}</span>
            </button>
          </div>
        </div>

        {/* Тело формы из Слайда 5 */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('currency', 'Walýuta')}*</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`w-full p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500/20 border ${theme.inputBg}`}
              >
                <option value="TMT">TMT</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('deliveryTerm', 'Eltip beriş şerti')}*</label>
              <select
                value={deliveryTerm}
                onChange={(e) => setDeliveryTerm(e.target.value)}
                className={`w-full p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500/20 border ${theme.inputBg}`}
              >
                <option value="CIP">CIP</option>
                <option value="DAP">DAP</option>
                <option value="DDP">DDP</option>
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('paymentTerms', 'Töleg şerti')}*</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className={`w-full p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500/20 border ${theme.inputBg}`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('comment', 'Bellik')}</label>
              <input
                type="text"
                placeholder="..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`w-full p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500/20 border ${theme.inputBg}`}
              />
            </div>
          </div>

          {/* Двухколоночный список позиций из Слайда 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Левая таблица: Tender spesifikasiýasy */}
            <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="bg-[#1e3a8a] text-white px-3 py-2 text-xs font-semibold flex justify-between items-center">
                <span>{t('tenderSpecs', 'Tender spesifikasiýasy')}</span>
              </div>
              <div className="p-2 space-y-2 max-h-48 overflow-y-auto text-xs">
                {tender?.specs?.map((spec, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 rounded border ${isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <p className={`font-semibold ${theme.primaryText}`}>{spec.positionNumber} {spec.generalProduct?.name || spec.name}</p>
                      <p className={`text-[11px] ${theme.subText}`}>Mukdar: {spec.quantity} {spec.unit?.name || spec.unit?.shortName || ''} | {spec.manufacturer?.name || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая таблица: Saýlananlar (Выбранные товары) */}
            <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`px-3 py-2 text-xs font-semibold flex justify-between items-center ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                <span>{t('selectedItems', 'Saýlananlar')}</span>
                <button onClick={() => setShowItemModal(true)} className="text-teal-600 hover:underline text-xs flex items-center">
                  <Plus size={14} className="mr-0.5" /> {t('addBtn', 'Goşmak')}
                </button>
              </div>
              <div className="p-2 space-y-2 max-h-48 overflow-y-auto text-xs">
                {offerItems.map((item, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 rounded border ${isDarkMode ? 'bg-teal-900/20 border-teal-800/30' : 'bg-teal-50/50 border-teal-100'}`}>
                    <div>
                      <p className={`font-semibold ${theme.primaryText}`}>{item.haryt}</p>
                      <p className={`text-[11px] ${theme.subText}`}>
                        {item.mukdar} {item.unit} × <span className="font-bold text-teal-600">{item.price} {currency}</span>
                      </p>
                    </div>
                    <button onClick={() => handleRemoveItem(idx)} className="p-1 text-rose-500 hover:bg-rose-500/20 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 МОДАЛЬНОЕ ОКНО "Goşulýan haryt" из Слайда 6 */}
        {showItemModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 animate-in zoom-in-95`}>
              <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`font-bold text-base ${theme.primaryText}`}>{t('addItemTitle', 'Goşulýan haryt')}</h3>
                <button onClick={() => setShowItemModal(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('product', 'Haryt')}*</label>
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
                    <label className={`block font-semibold mb-1 ${theme.subText}`}>{t('price', 'Bahasy')} ({currency})*</label>
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
                  onClick={handleAddItem}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {t('saveBtn', 'Ýatda sakla')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
