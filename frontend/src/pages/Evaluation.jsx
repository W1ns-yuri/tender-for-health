import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, ChevronDown, ChevronUp, Award, AlertCircle, FileText, Eye, ExternalLink, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { getStatusBadge } from '../utils/statusUtils';

export default function Evaluation({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [tenderDetails, setTenderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedOffers, setExpandedOffers] = useState({});

  const toggleOfferDetails = (offerId) => {
    setExpandedOffers(prev => ({ ...prev, [offerId]: !prev[offerId] }));
  };

  // Fetch list of tenders available for evaluation
  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const res = await API.get('/evaluation/tenders');
      setTenders(res.data);
    } catch (e) {
      console.error('Failed to fetch evaluation tenders', e);
    }
  };

  // Fetch details when a tender is selected
  useEffect(() => {
    if (selectedTenderId) {
      fetchTenderDetails(selectedTenderId);
    } else {
      setTenderDetails(null);
    }
  }, [selectedTenderId]);

  const fetchTenderDetails = async (id) => {
    setLoading(true);
    try {
      const res = await API.get(`/evaluation/tenders/${id}/details`);
      setTenderDetails(res.data);
    } catch (e) {
      console.error('Failed to fetch tender details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAwardLot = async (lotId, offerId) => {
    if (!window.confirm(lang === 'RU' ? 'Вы уверены, что хотите выбрать этого поставщика победителем для данного Лота?' : 'Bu lot boýunça şu üpjün edijini ýeňiji edip saýlamakçymy?')) {
      return;
    }
    try {
      await API.post('/evaluation/award-lot', { tenderId: selectedTenderId, lotId, offerId });
      // Refresh details to show updated UI
      fetchTenderDetails(selectedTenderId);
    } catch (e) {
      alert(lang === 'RU' ? 'Ошибка при выборе победителя' : 'Ýalňyşlyk ýüze çykdy');
    }
  };

  const handleCompleteEvaluation = async () => {
    if (!window.confirm(lang === 'RU' ? 'Вы уверены, что хотите завершить оценку? Всем поставщикам будут разосланы уведомления о результатах.' : 'Baha bermegi tamamlamakçymy? Netijeler yglan ediler.')) {
      return;
    }
    try {
      await API.post(`/evaluation/complete/${selectedTenderId}`);
      alert(lang === 'RU' ? 'Оценка успешно завершена! Победители объявлены.' : 'Baha bermek tamamlandy! Ýeňijiler yglan edildi.');
      fetchTenders();
      setSelectedTenderId('');
    } catch (e) {
      alert(lang === 'RU' ? 'Ошибка при завершении оценки' : 'Ýalňyşlyk ýüze çykdy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('winners', 'Оценка заявок')}</h2>
          <p className="text-xs text-slate-400 font-medium">
            {lang === 'RU' ? 'Процедура выбора победителей по каждой позиции (лоту)' : 'Harytlar boýunça ýeňijileri saýlamak'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Tender Selection */}
        <div className={`lg:col-span-1 rounded-xl border shadow-xs ${theme.cardBg} flex flex-col`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="font-bold text-sm">{lang === 'RU' ? 'Тендеры на оценку' : 'Baha berilmeli tenderler'}</h3>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto max-h-[600px]">
            {tenders.length === 0 ? (
              <p className="text-center text-sm text-slate-400 p-4">{lang === 'RU' ? 'Нет тендеров' : 'Tender ýok'}</p>
            ) : (
              tenders.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenderId(t.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    selectedTenderId === t.id 
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium border border-teal-200 dark:border-teal-800' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="font-bold mb-1 truncate">{t.tenderNumber}</div>
                  <div className="text-xs truncate opacity-80">{t.title}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {t._count.offers} {lang === 'RU' ? 'заявок' : 'teklip'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Content: Evaluation Board */}
        <div className="lg:col-span-3">
          {!selectedTenderId ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400">
              <Trophy size={48} className="mb-4 opacity-20" />
              <p>{lang === 'RU' ? 'Выберите тендер из списка слева для начала оценки' : 'Baha bermek üçin çepden tender saýlaň'}</p>
            </div>
          ) : loading ? (
            <div className="h-full min-h-[400px] flex items-center justify-center border rounded-xl bg-white dark:bg-[#0f172a]">
              <div className="text-slate-400 animate-pulse">{lang === 'RU' ? 'Загрузка данных...' : 'Ýüklenýär...'}</div>
            </div>
          ) : tenderDetails ? (
            <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
              <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-teal-700 dark:text-teal-400">{tenderDetails.tenderNumber}</h2>
                    <p className="text-sm font-medium mt-1">{tenderDetails.title}</p>
                  </div>
                  <div>
                    <Link
                      to={`/tenders/${tenderDetails.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium transition-colors"
                    >
                      <ExternalLink size={14} />
                      {lang === 'RU' ? 'Открыть тендер' : 'Tenderi aç'}
                    </Link>
                  </div>
                  <div>
                    {getStatusBadge(tenderDetails.status, lang, isDarkMode)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Заказчик' : 'Sargyt ediji'}</p>
                    <p className="text-sm font-semibold">{tenderDetails.client?.name || 'Н/Д'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Категория' : 'Kategoriýa'}</p>
                    <p className="text-sm font-semibold">{tenderDetails.category?.name || 'Н/Д'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Тип тендера' : 'Tenderiň görnüşi'}</p>
                    <p className="text-sm font-semibold">
                      {tenderDetails.type === 'YERLI' ? (lang === 'RU' ? 'Местный' : 'Ýerli') : (lang === 'RU' ? 'Международный' : 'Halkara')}
                      {' / '}
                      {tenderDetails.visibility === 'ACYK' ? (lang === 'RU' ? 'Открытый' : 'Açyk') : (lang === 'RU' ? 'Закрытый' : 'Ýapyk')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{lang === 'RU' ? 'Крайний срок' : 'Soňky möhlet'}</p>
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{new Date(tenderDetails.deadline).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>

              <div className="p-0">
                {(!tenderDetails.lots || tenderDetails.lots.length === 0) && tenderDetails.specs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">{lang === 'RU' ? 'В этом тендере нет позиций/лотов' : 'Haryt ýok'}</div>
                ) : (
                  <div className="divide-y dark:divide-slate-800">
                    {tenderDetails.lots && tenderDetails.lots.map((lot, index) => {
                      // Collect all offers that have bid on this lot
                      const lotSpecIds = lot.specs.map(s => s.id);
                      
                      const competingOffers = [];
                      tenderDetails.offers.forEach(offer => {
                        const offerSpecsForLot = offer.specs.filter(os => lotSpecIds.includes(os.tenderSpecId));
                        if (offerSpecsForLot.length > 0) {
                          // Calculate total lot price for this offer
                          const totalLotPrice = offerSpecsForLot.reduce((sum, os) => sum + (os.quantity * os.unitPrice), 0);
                          const isAwarded = offerSpecsForLot.some(os => os.isAwarded);
                          
                          competingOffers.push({
                            offerId: offer.id,
                            supplierId: offer.supplier?.id || offer.supplierId,
                            supplierName: offer.supplier?.name || 'Unknown',
                            totalLotPrice: totalLotPrice.toFixed(2),
                            isAwarded: isAwarded,
                            itemsCount: offerSpecsForLot.length,
                            totalItems: lot.specs.length,
                            offerSpecs: offerSpecsForLot
                          });
                        }
                      });

                      // Check if a winner is selected for this lot
                      const hasWinner = competingOffers.some(o => o.isAwarded);

                      return (
                        <div key={lot.id} className="p-5">
                          <div className="mb-4">
                            <h4 className="font-bold text-base flex items-center gap-2">
                              <span className="text-slate-400">{lang === 'RU' ? 'Лот' : 'Lot'} #{index + 1}:</span> 
                              {lot.name}
                              {hasWinner && <CheckCircle size={16} className="text-teal-500 ml-2" />}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <p>
                                {lang === 'RU' ? 'Кол-во товаров в лоте' : 'Harytlaryň sany'}: <strong className="text-slate-700 dark:text-slate-300">{lot.specs.length}</strong>
                              </p>
                              {lot.deliveryTerm && (
                                <p className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-4">
                                  <span className="uppercase text-[10px] tracking-wider">{lang === 'RU' ? 'Условия поставки:' : 'Gowşuryş şertleri:'}</span>
                                  <strong className="text-[#1e3a8a] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{lot.deliveryTerm.name || lot.deliveryTerm.code}</strong>
                                </p>
                              )}
                            </div>
                          </div>

                          {competingOffers.length === 0 ? (
                            <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg flex items-center gap-2">
                              <AlertCircle size={14} />
                              {lang === 'RU' ? 'Нет предложений по этому лоту' : 'Bu lot üçin teklip ýok'}
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className={theme.tableHeaderBg}>
                                    <th className="py-2.5 px-3 font-semibold">{lang === 'RU' ? 'Поставщик' : 'Üpjün ediji'}</th>
                                    <th className="py-2.5 px-3 font-semibold text-center">{lang === 'RU' ? 'Покрытие лота' : 'Lotuň dolulygy'}</th>
                                    <th className="py-2.5 px-3 font-semibold text-right">{lang === 'RU' ? 'Общая стоимость лота' : 'Lotuň jemi bahasy'}</th>
                                    <th className="py-2.5 px-3 font-semibold w-24 text-center">{lang === 'RU' ? 'Победитель' : 'Ýeňiji'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {competingOffers.map(co => (
                                    <React.Fragment key={co.offerId}>
                                      <tr className={`${co.isAwarded ? 'bg-teal-50/50 dark:bg-teal-900/20' : theme.tableRowHover}`}>
                                        <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                                          <button onClick={() => toggleOfferDetails(co.offerId)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
                                            {expandedOffers[co.offerId] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                          </button>
                                          {co.isAwarded && <Trophy size={14} className="text-amber-500" />}
                                          <Link 
                                            to={`/suppliers/${co.supplierId}`} 
                                            className={`${co.isAwarded ? 'font-bold text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'} hover:text-teal-600 dark:hover:text-teal-300 transition-colors underline decoration-dotted underline-offset-4`}
                                          >
                                            {co.supplierName}
                                          </Link>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${co.itemsCount === co.totalItems ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                            {co.itemsCount} / {co.totalItems} {lang === 'RU' ? 'поз.' : 'poz.'}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{co.totalLotPrice}</td>
                                        <td className="py-2.5 px-3 text-center w-40">
                                          <div className="flex items-center justify-end gap-2">
                                            <Link
                                              to={`/offers/${co.offerId}`}
                                              className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded transition-colors"
                                              title={lang === 'RU' ? 'Посмотреть полную заявку' : 'Doly teklibi gör'}
                                            >
                                              <Eye size={16} />
                                            </Link>
                                            <button
                                              onClick={() => handleAwardLot(lot.id, co.offerId)}
                                              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex-1 ${
                                                co.isAwarded 
                                                  ? 'bg-teal-500 text-white shadow-sm hover:bg-teal-600' 
                                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                              }`}
                                            >
                                              {co.isAwarded ? (lang === 'RU' ? 'Выбран' : 'Saýlandy') : (lang === 'RU' ? 'Выбрать' : 'Saýla')}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                      
                                      {/* EXPANDABLE DETAILS ROW */}
                                      {expandedOffers[co.offerId] && (
                                        <tr>
                                          <td colSpan="4" className="bg-slate-50/80 dark:bg-slate-800/40 p-4 border-t border-slate-200 dark:border-slate-700/50">
                                             <div className="text-xs space-y-3">
                                               <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                 <FileText size={14} className="text-teal-600 dark:text-teal-400" />
                                                 {lang === 'RU' ? 'Спецификация предложения от' : 'Teklibiň spesifikasiýasy:'} {co.supplierName}
                                               </h5>
                                               <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                                 <table className="w-full text-left bg-white dark:bg-[#0f172a] text-xs">
                                                   <thead className="bg-teal-600 dark:bg-teal-700 text-white">
                                                     <tr>
                                                       <th className="p-2.5 font-medium w-8 text-center">#</th>
                                                       <th className="p-2.5 font-medium">{lang === 'RU' ? 'Товар / Предложение' : 'Haryt / Teklip'}</th>
                                                       <th className="p-2.5 font-medium text-center w-20">{lang === 'RU' ? 'Ед. изм.' : 'Ölçeg'}</th>
                                                       <th className="p-2.5 font-medium text-center w-20">{lang === 'RU' ? 'Кол-во' : 'Mukdar'}</th>
                                                       <th className="p-2.5 font-medium text-right w-28">{lang === 'RU' ? 'Цена за ед.' : 'Birlik bahasy'}</th>
                                                       <th className="p-2.5 font-medium text-right w-32">{lang === 'RU' ? 'Сумма' : 'Jemi'}</th>
                                                       <th className="p-2.5 font-medium w-48">{lang === 'RU' ? 'Характеристики / Производитель' : 'Häsiýetnamalar'}</th>
                                                     </tr>
                                                   </thead>
                                                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                     {co.offerSpecs.map((os, idx) => {
                                                       const originalSpec = lot.specs.find(s => s.id === os.tenderSpecId);
                                                       const requestedName = originalSpec ? (originalSpec.generalProduct?.name || originalSpec.name) : 'Н/Д';
                                                       const requestedUnit = originalSpec?.unit?.name || 'шт';
                                                       const requestedDesc = originalSpec ? originalSpec.description : '';
                                                       
                                                       const offeredName = os.generalProduct?.name || os.name || 'Н/Д';
                                                       const offeredUnit = os.unit?.name || 'шт';
                                                       const offeredBrand = os.manufacturer?.name || os.brand || '';
                                                       const isDifferent = (requestedName !== offeredName) && (offeredName !== 'Н/Д');
                                                       
                                                       return (
                                                         <React.Fragment key={os.id}>
                                                           {/* Запрос */}
                                                           <tr className="bg-slate-50 dark:bg-slate-800/40">
                                                             <td className="p-2.5 text-center font-bold text-slate-400" rowSpan="2">{idx + 1}</td>
                                                             <td className="p-2.5">
                                                               <div className="flex items-center gap-2">
                                                                 <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] uppercase font-bold rounded tracking-wider">{lang === 'RU' ? 'Запрос' : 'Talap'}</span>
                                                                 <span className="font-semibold text-slate-700 dark:text-slate-300">{requestedName}</span>
                                                               </div>
                                                             </td>
                                                             <td className="p-2.5 text-center text-slate-500">{requestedUnit}</td>
                                                             <td className="p-2.5 text-center font-bold">{os.quantity}</td>
                                                             <td className="p-2.5 text-right text-slate-400">—</td>
                                                             <td className="p-2.5 text-right text-slate-400">—</td>
                                                             <td className="p-2.5 text-slate-500 italic">{requestedDesc || '—'}</td>
                                                           </tr>
                                                           {/* Предложение */}
                                                           <tr className={isDifferent ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                                                             <td className="p-2.5 pl-0">
                                                               <div className="flex items-start gap-2">
                                                                 <CornerDownRight size={16} className="text-teal-500 ml-1 mt-0.5" />
                                                                 <div>
                                                                   <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 text-[9px] uppercase font-bold rounded tracking-wider mb-1 inline-block">{lang === 'RU' ? 'Ваше КП' : 'Teklibiňiz'}</span>
                                                                   <div className="font-medium">
                                                                     {offeredName}
                                                                     {isDifferent && <span className="ml-2 px-1 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded uppercase font-bold tracking-wider">{lang === 'RU' ? 'Замена' : 'Üýtgetme'}</span>}
                                                                   </div>
                                                                 </div>
                                                               </div>
                                                             </td>
                                                             <td className="p-2.5 text-center font-medium">{offeredUnit}</td>
                                                             <td className="p-2.5 text-center font-bold text-teal-700 dark:text-teal-400">{os.quantity}</td>
                                                             <td className="p-2.5 text-right font-mono font-medium">{os.unitPrice.toLocaleString('ru-RU', {minimumFractionDigits: 2})}</td>
                                                             <td className="p-2.5 text-right font-mono font-bold text-teal-700 dark:text-teal-400">{(os.quantity * os.unitPrice).toLocaleString('ru-RU', {minimumFractionDigits: 2})}</td>
                                                             <td className="p-2.5 text-slate-600 dark:text-slate-300">
                                                               {offeredBrand && <div className="font-medium text-[10px] uppercase text-slate-400 mb-0.5">{offeredBrand}</div>}
                                                               {os.description ? <span>{os.description}</span> : <span className="text-slate-400 italic">{'—'}</span>}
                                                             </td>
                                                           </tr>
                                                         </React.Fragment>
                                                       );
                                                     })}
                                                   </tbody>
                                                 </table>
                                               </div>
                                             </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              {tenderDetails.specs.length > 0 && tenderDetails.status !== 'YENIJI_YGLAN_EDILDI' && (
                <div className={`p-5 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex justify-end`}>
                  <button
                    onClick={handleCompleteEvaluation}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 ${theme.primaryBtn}`}
                  >
                    {lang === 'RU' ? 'Завершить оценку и огласить результаты' : 'Baha bermegi tamamla we yglan et'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
