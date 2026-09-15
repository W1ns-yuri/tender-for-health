import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, CheckCircle, ChevronDown, ChevronUp, 
  FileText, Eye, ExternalLink, CornerDownRight, Printer, 
  Clock, Building2, Layers, AlertCircle, CheckCircle2, TrendingDown,
  Download, HelpCircle, X
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import { getStatusBadge } from '../utils/statusUtils';
import { useAlert } from '../context/AlertContext';

export default function EvaluationDetailsPage({ role, isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();

  const [tenderDetails, setTenderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOffers, setExpandedOffers] = useState({});

  useEffect(() => {
    if (id) {
      fetchTenderDetails(id);
    }
  }, [id]);

  const fetchTenderDetails = async (tenderId) => {
    setLoading(true);
    try {
      const res = await API.get(`/evaluation/tenders/${tenderId}/details`);
      setTenderDetails(res.data);
    } catch (e) {
      console.error('Failed to fetch tender details', e);
      showAlert({
        title: lang === 'RU' ? 'Ошибка' : 'Ýalňyşlyk',
        message: lang === 'RU' ? 'Не удалось загрузить данные тендера для оценки' : 'Tender maglumatlary ýüklenmedi',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferDetails = (offerId) => {
    setExpandedOffers(prev => ({ ...prev, [offerId]: !prev[offerId] }));
  };

  const handleAwardLot = async (lotId, offerId, isCurrentlyAwarded = false) => {
    if (isCurrentlyAwarded) {
      const isConfirmed = await showConfirm({
        title: lang === 'RU' ? 'Снять выбор победителя' : 'Ýeňijini aýyrmak',
        message: lang === 'RU' 
          ? 'Вы уверены, что хотите снять выбор победителя по данному лоту?' 
          : 'Bu lot boýunça ýeňiji saýlawyny aýyrmakçymy?',
        type: 'warning',
        confirmText: lang === 'RU' ? 'Снять выбор' : 'Aýyr',
        cancelText: lang === 'RU' ? 'Отмена' : 'Ýatyr',
      });
      if (!isConfirmed) return;

      try {
        await API.post('/evaluation/award-lot', { tenderId: id, lotId, offerId: null });
        fetchTenderDetails(id);
        showAlert({
          title: lang === 'RU' ? 'Успешно' : 'Üstünlikli',
          message: lang === 'RU' ? 'Выбор победителя по лоту снят' : 'Ýeňiji saýlawy aýryldy',
          type: 'info'
        });
      } catch (e) {
        showAlert({
          title: lang === 'RU' ? 'Ошибка' : 'Ýalňyşlyk',
          message: lang === 'RU' ? 'Ошибка при снятии выбора' : 'Ýalňyşlyk ýüze çykdy',
          type: 'error'
        });
      }
      return;
    }

    const isConfirmed = await showConfirm({
      title: lang === 'RU' ? 'Выбор победителя' : 'Ýeňijini saýlamak',
      message: lang === 'RU' 
        ? 'Вы уверены, что хотите назначить этого поставщика победителем для данного Лота?' 
        : 'Bu lot boýunça şu üpjün edijini ýeňiji edip saýlamakçymy?',
      type: 'success',
      confirmText: lang === 'RU' ? 'Выбрать' : 'Saýla',
      cancelText: lang === 'RU' ? 'Отмена' : 'Ýatyr',
    });
    if (!isConfirmed) return;

    try {
      await API.post('/evaluation/award-lot', { tenderId: id, lotId, offerId });
      // Refresh details to show updated UI
      fetchTenderDetails(id);
      showAlert({
        title: lang === 'RU' ? 'Успешно' : 'Üstünlikli',
        message: lang === 'RU' ? 'Победитель по лоту успешно назначен' : 'Lot boýunça ýeňiji üstünlikli bellendi',
        type: 'success'
      });
    } catch (e) {
      showAlert({
        title: lang === 'RU' ? 'Ошибка' : 'Ýalňyşlyk',
        message: lang === 'RU' ? 'Ошибка при выборе победителя' : 'Ýalňyşlyk ýüze çykdy',
        type: 'error'
      });
    }
  };

  // Calculate lot awarding progress
  const lotsList = tenderDetails?.lots || [];
  const lotsWithOffers = lotsList.filter(lot => {
    const lotSpecIds = (lot.specs || []).map(s => s.id);
    return (tenderDetails?.offers || []).some(offer =>
      (offer.specs || []).some(os => lotSpecIds.includes(os.tenderSpecId))
    );
  });

  const awardedLots = lotsList.filter(lot => {
    const lotSpecIds = (lot.specs || []).map(s => s.id);
    return (tenderDetails?.offers || []).some(offer =>
      (offer.specs || []).some(os => lotSpecIds.includes(os.tenderSpecId) && os.isAwarded)
    );
  });

  const allLotsAwarded = lotsWithOffers.length > 0 && awardedLots.length >= lotsWithOffers.length;

  // Resolve status conflict: if not all lots have winners selected, status displays as evaluation in progress
  const effectiveStatus = (tenderDetails?.status === 'YENIJI_YGLAN_EDILDI' && !allLotsAwarded)
    ? 'BAHALANDYRYLDY'
    : (tenderDetails?.status || 'BAHALANDYRYLDY');

  const handleCompleteEvaluation = async () => {
    if (!allLotsAwarded) {
      const isProceed = await showConfirm({
        title: lang === 'RU' ? 'Внимание: не все лоты распределены' : 'Üns beriň: ähli lotlar paýlanmady',
        message: lang === 'RU' 
          ? `Победители выбраны только для ${awardedLots.length} из ${lotsWithOffers.length} лотов. Вы уверены, что хотите завершить оценку сейчас?`
          : `${lotsWithOffers.length} lotdan diňe ${awardedLots.length} sanysyna ýeňiji saýlandy. Baha bermegi tamamlamakçymy?`,
        type: 'warning',
        confirmText: lang === 'RU' ? 'Завершить в любом случае' : 'Barybir tamamla',
        cancelText: lang === 'RU' ? 'Вернуться к выбору' : 'Yza dön',
      });
      if (!isProceed) return;
    } else {
      const isConfirmed = await showConfirm({
        title: lang === 'RU' ? 'Завершение оценки' : 'Baha bermegi tamamlamak',
        message: lang === 'RU' 
          ? 'Вы уверены, что хотите утвердить итоговый протокол и огласить победителей? Всем поставщикам будут разосланы уведомления о результатах.' 
          : 'Baha bermegi tamamlamakçymy? Netijeler yglan ediler.',
        type: 'success',
        confirmText: lang === 'RU' ? 'Утвердить протокол' : 'Tassykla',
        cancelText: lang === 'RU' ? 'Отмена' : 'Ýatyr',
      });
      if (!isConfirmed) return;
    }

    try {
      await API.post(`/evaluation/complete/${id}`);
      await showAlert({
        title: lang === 'RU' ? 'Успешно' : 'Üstünlikli',
        message: lang === 'RU' ? 'Оценка успешно завершена! Итоги оглашены.' : 'Baha bermek tamamlandy! Ýeňijiler yglan edildi.',
        type: 'success'
      });
      fetchTenderDetails(id);
    } catch (e) {
      showAlert({
        title: lang === 'RU' ? 'Ошибка' : 'Ýalňyşlyk',
        message: lang === 'RU' ? 'Ошибка при завершении оценки' : 'Ýalňyşlyk ýüze çykdy',
        type: 'error'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {lang === 'RU' ? 'Загрузка рабочего стола оценки...' : 'Baha beriş iş stoly ýüklenýär...'}
        </p>
      </div>
    );
  }

  if (!tenderDetails) {
    return (
      <div className="p-12 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {lang === 'RU' ? 'Тендер не найден' : 'Tender tapylmady'}
        </h2>
        <Link
          to="/evaluation"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          {lang === 'RU' ? 'Вернуться к реестру оценки' : 'Sanawa dolan'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-32">
      {/* 1. Top Navigation Bar with Back button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/evaluation')}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
            title={lang === 'RU' ? 'Назад к списку тендеров' : 'Yza dolan'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/evaluation" className="hover:text-emerald-600 transition-colors">
                {lang === 'RU' ? 'Оценка заявок' : 'Baha bermek'}
              </Link>
              <span>/</span>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                {tenderDetails.tenderNumber}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'RU' ? 'Оценка предложений по закупке' : 'Satyn alyş boýunça tekliplere baha bermek'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Printer size={14} />
            <span>{lang === 'RU' ? 'Печать протокола' : 'Protokoly çap et'}</span>
          </button>

          <Link
            to={`/tenders/${tenderDetails.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 text-xs font-semibold transition-colors shadow-2xs"
          >
            <ExternalLink size={14} />
            <span>{lang === 'RU' ? 'Открыть тендер' : 'Tenderi aç'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Full-Width Tender Header Overview Card */}
      <div className={`rounded-2xl border shadow-xs p-6 ${theme.cardBg} space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {tenderDetails.tenderNumber}
              </span>
              {getStatusBadge(effectiveStatus, lang, isDarkMode)}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {lang === 'RU' ? 'Итоги по лотам' : 'Lot netijeleri'}: <strong className="text-emerald-600 dark:text-emerald-400">{awardedLots.length}</strong> / {lotsWithOffers.length}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
              {tenderDetails.title}
            </h2>
          </div>
        </div>

        {/* 4 Metadata Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              {lang === 'RU' ? 'Заказчик' : 'Sargyt ediji'}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Building2 size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{tenderDetails.client?.name || '—'}</span>
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              {lang === 'RU' ? 'Категория и тип' : 'Kategoriýa / Görnüş'}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {tenderDetails.category?.name || '—'}
              <span className="text-xs text-slate-400 font-normal ml-1.5">
                ({tenderDetails.type === 'YERLI' ? (lang === 'RU' ? 'Местный' : 'Ýerli') : (lang === 'RU' ? 'Международный' : 'Halkara')})
              </span>
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              {lang === 'RU' ? 'Крайний срок подачи' : 'Soňky möhlet'}
            </p>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Clock size={15} className="shrink-0" />
              <span>{new Date(tenderDetails.deadline).toLocaleDateString('ru-RU')}</span>
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              {lang === 'RU' ? 'Лоты и заявки' : 'Lotlar we teklipler'}
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {lotsList.length} {lang === 'RU' ? 'лот.' : 'lot'} • {(tenderDetails.offers || []).length} {lang === 'RU' ? 'заявок' : 'teklip'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. 100% Full-Width Lots Work Area */}
      <div className="space-y-8">
        {lotsList.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${theme.cardBg} text-slate-400`}>
            <AlertCircle size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold">{lang === 'RU' ? 'В данном тендере нет позиций или лотов' : 'Haryt ýok'}</p>
          </div>
        ) : (
          lotsList.map((lot, lotIndex) => {
            const lotSpecIds = (lot.specs || []).map(s => s.id);

            // Collect all offers that bid on this lot
            const competingOffers = [];
            (tenderDetails.offers || []).forEach(offer => {
              const offerSpecsForLot = (offer.specs || []).filter(os => lotSpecIds.includes(os.tenderSpecId));
              if (offerSpecsForLot.length > 0) {
                const totalLotPrice = offerSpecsForLot.reduce((sum, os) => sum + (os.quantity * os.unitPrice), 0);
                const isAwarded = offerSpecsForLot.some(os => os.isAwarded);
                const currencyCode = offer.baseCurrency?.code || offer.currency || 'TMT';

                competingOffers.push({
                  offerId: offer.id,
                  supplierId: offer.supplier?.id || offer.supplierId,
                  supplierName: offer.supplier?.name || 'Unknown',
                  totalLotPrice: totalLotPrice.toFixed(2),
                  numericTotal: totalLotPrice,
                  currencyCode,
                  isAwarded,
                  itemsCount: offerSpecsForLot.length,
                  totalItems: lot.specs.length,
                  offerSpecs: offerSpecsForLot
                });
              }
            });

            // Find lowest price among competing offers
            const minPrice = competingOffers.length > 0
              ? Math.min(...competingOffers.map(o => o.numericTotal))
              : 0;

            const hasWinner = competingOffers.some(o => o.isAwarded);

            // Incoterms display with standard code lookup
            const INCOTERMS_MAP = {
              'delivered at place': 'DAP',
              'carriage and insurance paid to': 'CIP',
              'carriage paid to': 'CPT',
              'delivered duty paid': 'DDP',
              'ex works': 'EXW',
              'free carrier': 'FCA',
              'free on board': 'FOB',
              'cost, insurance and freight': 'CIF',
              'cost and freight': 'CFR',
              'delivered at terminal': 'DAT',
              'delivered at place unloaded': 'DPU',
            };
            const dtShort = (lot.deliveryTerm?.shortName || lot.deliveryTerm?.code || '').trim();
            const dtName = (lot.deliveryTerm?.name || '').trim();
            const inferredCode = dtShort || INCOTERMS_MAP[dtName.toLowerCase()] || '';
            const incotermsDisplay = inferredCode && dtName && inferredCode.toLowerCase() !== dtName.toLowerCase()
              ? `${inferredCode} (${dtName})`
              : (inferredCode || dtName);

            return (
              <div
                key={lot.id}
                className={`rounded-2xl border shadow-xs overflow-hidden ${theme.cardBg} transition-all`}
              >
                {/* Lot Header Banner */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
                        {lang === 'RU' ? 'ЛОТ' : 'LOT'} #{lotIndex + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {lot.name}
                      </h3>
                      {hasWinner && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle size={13} />
                          {lang === 'RU' ? 'Победитель выбран' : 'Ýeňiji saýlandy'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                      <p>
                        {lang === 'RU' ? 'Позиций в спецификации:' : 'Haryt sany:'}{' '}
                        <strong className="text-slate-700 dark:text-slate-200 font-bold">{lot.specs.length}</strong>
                      </p>
                      {lot.deliveryTerm && (
                        <p className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-4">
                          <span className="uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
                            {lang === 'RU' ? 'Поставка (Incoterms):' : 'Gowşuryş:'}
                          </span>
                          <strong 
                            className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded-md font-mono font-bold text-xs"
                            title={dtName && inferredCode ? `${inferredCode} — ${dtName}` : undefined}
                          >
                            {incotermsDisplay}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">
                      {lang === 'RU' ? 'Подано предложений:' : 'Teklipler:'}{' '}
                      <strong className="text-slate-800 dark:text-slate-100 font-bold">{competingOffers.length}</strong>
                    </span>
                  </div>
                </div>

                {/* Empty State for Lot */}
                {competingOffers.length === 0 ? (
                  <div className="p-8">
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 rounded-xl p-5 flex items-center gap-3.5 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                          {lang === 'RU' ? 'Нет поданных предложений по данному лоту' : 'Bu lot boýunça teklip gowşyrylmady'}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {lang === 'RU' 
                            ? 'Ни один поставщик пока не подал заявку на спецификацию этого лота.' 
                            : 'Häzirlikçe bu lot boýunça hiç bir üpjün ediji teklip bermedi.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 100% Full-Width Comparative Section */
                  <div className="p-6 space-y-6">
                    {/* Comparative Table of Suppliers */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={theme.tableHeaderBg}>
                            <th className="py-3 px-4 font-semibold">{lang === 'RU' ? 'Поставщик' : 'Üpjün ediji'}</th>
                            <th className="py-3 px-4 font-semibold text-center w-36">{lang === 'RU' ? 'Покрытие лота' : 'Lotuň dolulygy'}</th>
                            <th className="py-3 px-4 font-semibold text-right w-48">{lang === 'RU' ? 'Итоговая сумма лота' : 'Jemi bahasy'}</th>
                            <th className="py-3 px-4 font-semibold text-center w-32">{lang === 'RU' ? 'Сравнение цен' : 'Baha tapawudy'}</th>
                            <th className="py-3 px-4 font-semibold text-center w-48">{lang === 'RU' ? 'Решение по лоту' : 'Lot boýunça çözgüt'}</th>
                            <th className="py-3 px-4 font-semibold text-right w-36">{lang === 'RU' ? 'Подробности' : 'Jikme-jik'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {competingOffers.map(co => {
                            const isLowest = minPrice > 0 && Math.abs(co.numericTotal - minPrice) < 0.01;
                            const priceDiffPercent = minPrice > 0 
                              ? (((co.numericTotal - minPrice) / minPrice) * 100).toFixed(1)
                              : 0;

                            return (
                              <React.Fragment key={co.offerId}>
                                <tr className={`${co.isAwarded ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : theme.tableRowHover} transition-colors`}>
                                  {/* Supplier */}
                                  <td className="py-3 px-4 font-medium">
                                    <div className="flex items-center gap-2">
                                      {co.isAwarded && <Trophy size={16} className="text-amber-500 shrink-0" />}
                                      <Link
                                        to={`/suppliers/${co.supplierId}`}
                                        className={`font-semibold text-sm ${
                                          co.isAwarded 
                                            ? 'text-emerald-700 dark:text-emerald-400' 
                                            : 'text-slate-800 dark:text-slate-100 hover:text-emerald-600'
                                        } transition-colors underline decoration-dotted underline-offset-4`}
                                      >
                                        {co.supplierName}
                                      </Link>
                                    </div>
                                  </td>

                                  {/* Compliance Coverage */}
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                      co.itemsCount === co.totalItems
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    }`}>
                                      {co.itemsCount} / {co.totalItems} {lang === 'RU' ? 'поз.' : 'poz.'} ({Math.round((co.itemsCount / co.totalItems) * 100)}%)
                                    </span>
                                  </td>

                                  {/* Total Price with Currency */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                      {Number(co.totalLotPrice).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {co.currencyCode}
                                    </div>
                                    {isLowest && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                        <TrendingDown size={11} />
                                        {lang === 'RU' ? 'Лучшая цена' : 'Iň arzan baha'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Price Difference */}
                                  <td className="py-3 px-4 text-center">
                                    {isLowest ? (
                                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                        {lang === 'RU' ? 'Базовая мин.' : 'Esasy min.'}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        +{priceDiffPercent}%
                                      </span>
                                    )}
                                  </td>

                                  {/* Award Button */}
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => handleAwardLot(lot.id, co.offerId, co.isAwarded)}
                                      title={co.isAwarded ? (lang === 'RU' ? 'Нажмите, чтобы снять выбор' : 'Saýlawy aýyrmak üçin basyň') : undefined}
                                      className={`group/award px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                                        co.isAwarded 
                                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-700 border border-emerald-600' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {co.isAwarded ? (
                                        <>
                                          <CheckCircle size={14} className="group-hover/award:hidden" />
                                          <X size={14} className="hidden group-hover/award:inline text-rose-600 dark:text-rose-400" />
                                          <span className="group-hover/award:hidden">{lang === 'RU' ? 'Победитель' : 'Ýeňiji'}</span>
                                          <span className="hidden group-hover/award:inline text-rose-600 dark:text-rose-400">{lang === 'RU' ? 'Снять выбор' : 'Aýyrmak'}</span>
                                        </>
                                      ) : (
                                        <span>{lang === 'RU' ? 'Выбрать победителем' : 'Ýeňiji saýla'}</span>
                                      )}
                                    </button>
                                  </td>

                                  {/* Details toggle */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Link
                                        to={`/offers/${co.offerId}`}
                                        className={theme.actionBtn}
                                        title={lang === 'RU' ? 'Открыть полную заявку' : 'Teklibi aç'}
                                      >
                                        <Eye size={15} />
                                      </Link>
                                      <button
                                        onClick={() => toggleOfferDetails(co.offerId)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        <span>{lang === 'RU' ? 'Спецификация' : 'Spesifikasiýa'}</span>
                                        {expandedOffers[co.offerId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Detailed Specification Breakdown */}
                                {expandedOffers[co.offerId] && (
                                  <tr>
                                    <td colSpan="6" className="bg-slate-50/70 dark:bg-slate-800/40 p-5 border-t border-slate-200 dark:border-slate-700/60">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                                            {lang === 'RU' ? 'Попозиционное предложение поставщика:' : 'Teklip harytlary:'}{' '}
                                            <span className="text-emerald-600 dark:text-emerald-400">{co.supplierName}</span>
                                          </h4>
                                          <span className="text-[11px] text-slate-400">
                                            {co.offerSpecs.length} {lang === 'RU' ? 'позиций заполнено' : 'haryt girizildi'}
                                          </span>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] shadow-xs">
                                          <table className="w-full text-left text-xs">
                                            <thead className="bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                              <tr>
                                                <th className="p-3 font-semibold w-10 text-center">#</th>
                                                <th className="p-3 font-semibold">{lang === 'RU' ? 'Товар / Предмет закупки' : 'Haryt / Talap'}</th>
                                                <th className="p-3 font-semibold text-center w-24">{lang === 'RU' ? 'Ед. изм.' : 'Ölçeg'}</th>
                                                <th className="p-3 font-semibold text-center w-24">{lang === 'RU' ? 'Кол-во' : 'Mukdar'}</th>
                                                <th className="p-3 font-semibold text-right w-36">{lang === 'RU' ? 'Цена за ед.' : 'Birlik bahasy'}</th>
                                                <th className="p-3 font-semibold text-right w-40">{lang === 'RU' ? 'Сумма' : 'Jemi'}</th>
                                                <th className="p-3 font-semibold w-56">{lang === 'RU' ? 'Характеристики / Производитель' : 'Häsiýetnamalar'}</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                                    {/* Запрос Заказчика */}
                                                    <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                                                      <td className="p-3 text-center font-bold text-slate-400" rowSpan="2">
                                                        {idx + 1}
                                                      </td>
                                                      <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                          <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] uppercase font-bold rounded tracking-wider">
                                                            {lang === 'RU' ? 'Запрос' : 'Talap'}
                                                          </span>
                                                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                            {requestedName}
                                                          </span>
                                                        </div>
                                                      </td>
                                                      <td className="p-3 text-center text-slate-500 font-medium">{requestedUnit}</td>
                                                      <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{os.quantity}</td>
                                                      <td className="p-3 text-right text-slate-400">—</td>
                                                      <td className="p-3 text-right text-slate-400">—</td>
                                                      <td className="p-3 text-slate-500 italic text-[11px]">{requestedDesc || '—'}</td>
                                                    </tr>

                                                    {/* Ответ / Предложение Поставщика */}
                                                    <tr className={isDifferent ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                                                      <td className="p-3 pl-0">
                                                        <div className="flex items-start gap-2">
                                                          <CornerDownRight size={16} className="text-emerald-500 ml-1.5 mt-0.5 shrink-0" />
                                                          <div>
                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] uppercase font-bold rounded-md tracking-wider mb-1 inline-flex items-center gap-1">
                                                              {lang === 'RU' 
                                                                ? (co.supplierName ? `КП: ${co.supplierName}` : 'КП поставщика') 
                                                                : (co.supplierName ? `${co.supplierName} teklibi` : 'Üpjün edijiniň teklibi')}
                                                            </span>
                                                            <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                                              {offeredName}
                                                              {isDifferent && (
                                                                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] rounded uppercase font-bold tracking-wider">
                                                                  {lang === 'RU' ? 'Замена' : 'Üýtgetme'}
                                                                </span>
                                                             )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="p-3 text-center font-medium text-slate-600 dark:text-slate-300">{offeredUnit}</td>
                                                      <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">{os.quantity}</td>
                                                      <td className="p-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                                        {os.unitPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {co.currencyCode}
                                                      </td>
                                                      <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                        {(os.quantity * os.unitPrice).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {co.currencyCode}
                                                      </td>
                                                      <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px]">
                                                        {offeredBrand && (
                                                          <div className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                                            {offeredBrand}
                                                          </div>
                                                        )}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Sticky Bottom Action Bar (Утверждение протокола & экспорт) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 shadow-2xl transition-all">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress on left */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{lang === 'RU' ? 'Итоги распределения:' : 'Netijeler:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {awardedLots.length} {lang === 'RU' ? 'из' : '/'} {lotsWithOffers.length} {lang === 'RU' ? 'лотов' : 'lot'}
                </span>
                {allLotsAwarded && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                    {lang === 'RU' ? 'Все лоты распределены' : 'Ähli lotlar taýyn'}
                  </span>
                )}
              </div>
              <div className="w-48 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${lotsWithOffers.length > 0 ? (awardedLots.length / lotsWithOffers.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Download size={14} />
              <span>{lang === 'RU' ? 'Экспорт / Печать' : 'Eksport / Çap'}</span>
            </button>

            <button
              onClick={handleCompleteEvaluation}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2 ${theme.primaryBtn}`}
            >
              <CheckCircle2 size={16} />
              <span>
                {lang === 'RU' ? 'Утвердить протокол и объявить победителей' : 'Protokoly tassyklamak we ýeňijileri yglan etmek'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
