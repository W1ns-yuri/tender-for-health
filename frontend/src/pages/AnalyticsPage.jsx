import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Building2,
  Download,
  Layers,
  ShieldCheck,
  Award,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  MapPin,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  FileCode,
  Database
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import { CustomSelect } from '../components/ui';

export default function AnalyticsPage({ role: _role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const { showAlert } = useAlert();
  const t = (key, fallback, params) => getTranslation(lang, key, fallback, params);

  // Режим данных: 'demo' (демо-показ Bloomberg) или 'real' (реальная БД)
  const [dataSource, setDataSource] = useState(() => {
    return localStorage.getItem('tender_analytics_source') || 'demo';
  });

  // Состояния фильтров
  const [period, setPeriod] = useState('30d');
  const [currency, setCurrency] = useState('TMT');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [hoveredTimelineIdx, setHoveredTimelineIdx] = useState(null);
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Переключение источника данных (Демо vs Реальная БД)
  const handleToggleDataSource = (mode) => {
    setDataSource(mode);
    localStorage.setItem('tender_analytics_source', mode);
    if (mode === 'demo') {
      setData(getDemoShowcaseData(period, currency));
    } else {
      fetchAnalytics();
    }
  };

  // Валютный символ
  const currencySymbol = useMemo(() => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return 'TMT';
    }
  }, [currency]);

  // Загрузка данных аналитики
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dashboard/analytics?period=${period}&currency=${currency}`);
      setData(res.data);
    } catch (err) {
      console.warn('Analytics API error or offline, fallback to calibrated enterprise dataset', err);
      setData(getFallbackData(period, currency));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataSource === 'demo') {
      setData(getDemoShowcaseData(period, currency));
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [period, currency, dataSource]);

  // Закрытие меню экспорта по клику вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#export-dropdown-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Форматирование чисел и денег
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('ru-RU');
  };

  const formatCurrency = (num) => {
    return `${formatNumber(num)} ${currencySymbol}`;
  };

  // Экспорт данных
  const handleExport = (format) => {
    setShowExportMenu(false);
    if (format === 'PDF') {
      window.print();
    } else if (format === 'CSV') {
      const rows = [
        ['Показатель', 'Значение'],
        ['Период', period],
        ['Валюта', currency],
        ['Общий объем закупок', `${data?.kpi?.totalVolume || 0} ${currencySymbol}`],
        ['Экономия бюджета', `${data?.kpi?.savingsAmount || 0} ${currencySymbol} (${data?.kpi?.savingsPercent || 0}%)`],
        ['Проведено процедур', data?.kpi?.totalProcedures || 0],
        ['Подано предложений', data?.kpi?.totalOffers || 0],
        ['Активные поставщики', data?.kpi?.activeSuppliers || 0],
      ];
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(';')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `analytics_report_${period}_${currency}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert(t('successTitle', 'Успешно'), 'CSV-отчет сформирован и загружен', 'success');
    } else if (format === 'JSON') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `analytics_data_${period}_${currency}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showAlert(t('successTitle', 'Успешно'), 'JSON-выгрузка сохранена', 'success');
    }
  };

  // Вычисления для интерактивного Area Chart (SVG)
  const timeline = useMemo(() => data?.timeline || [], [data?.timeline]);
  const isTimelineEmpty = useMemo(() => {
    if (!timeline.length) return true;
    return timeline.every(p => Number(p.published || 0) === 0 && Number(p.awarded || 0) === 0);
  }, [timeline]);

  const maxVolume = useMemo(() => {
    if (!timeline.length) return 100;
    const computedMax = Math.max(...timeline.map(p => Math.max(Number(p.published || 0), Number(p.awarded || 0))));
    return computedMax > 0 ? computedMax * 1.15 : 100;
  }, [timeline]);

  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const pointsPublished = useMemo(() => {
    if (!timeline.length) return [];
    const stepX = (svgWidth - paddingX * 2) / Math.max(timeline.length - 1, 1);
    return timeline.map((p, i) => {
      const x = paddingX + i * stepX;
      const y = svgHeight - paddingY - (Number(p.published || 0) / maxVolume) * (svgHeight - paddingY * 2);
      return { x, y, data: p };
    });
  }, [timeline, maxVolume]);

  const pointsAwarded = useMemo(() => {
    if (!timeline.length) return [];
    const stepX = (svgWidth - paddingX * 2) / Math.max(timeline.length - 1, 1);
    return timeline.map((p, i) => {
      const x = paddingX + i * stepX;
      const y = svgHeight - paddingY - (Number(p.awarded || 0) / maxVolume) * (svgHeight - paddingY * 2);
      return { x, y, data: p };
    });
  }, [timeline, maxVolume]);

  // Генерация плавных кривых Bezier
  const createSmoothPath = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cpX = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${cpX},${pts[i].y} ${cpX},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
  };

  const linePathPublished = createSmoothPath(pointsPublished);
  const linePathAwarded = createSmoothPath(pointsAwarded);

  // Заливка принадлежит разыгранному объему (Факт)
  const areaPathAwarded = pointsAwarded.length > 0
    ? `${linePathAwarded} L ${pointsAwarded[pointsAwarded.length - 1].x},${svgHeight - paddingY} L ${pointsAwarded[0].x},${svgHeight - paddingY} Z`
    : '';

  // Вычисления для Donut Chart с защитой от деления на 0
  const statusDistribution = data?.statusDistribution || [];
  const totalStatusCount = statusDistribution.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  let cumulativeAngle = 0;
  const donutSegments = totalStatusCount > 0 ? statusDistribution.map((item, idx) => {
    const fraction = (Number(item.count) || 0) / totalStatusCount;
    if (fraction <= 0) return { ...item, path: '', fraction: 0, idx };

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + fraction * 360;
    cumulativeAngle = endAngle;

    const rOuter = 85;
    const rInner = 56;
    const cx = 110;
    const cy = 110;

    const radStart = ((startAngle - 90) * Math.PI) / 180;
    const radEnd = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + rOuter * Math.cos(radStart);
    const y1 = cy + rOuter * Math.sin(radStart);
    const x2 = cx + rOuter * Math.cos(radEnd);
    const y2 = cy + rOuter * Math.sin(radEnd);

    const x3 = cx + rInner * Math.cos(radEnd);
    const y3 = cy + rInner * Math.sin(radEnd);
    const x4 = cx + rInner * Math.cos(radStart);
    const y4 = cy + rInner * Math.sin(radStart);

    const largeArc = fraction > 0.5 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return { ...item, path, startAngle, endAngle, fraction, idx };
  }) : [];

  const activeTimelineItem = hoveredTimelineIdx !== null ? timeline[hoveredTimelineIdx] : null;

  return (
    <div className={`space-y-6 pb-12 transition-colors duration-200 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* 1. ШАПКА И ФИЛЬТРЫ */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDarkMode 
          ? 'bg-[#111827] border-slate-800 shadow-md' 
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Левый блок: Заголовок */}
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <BarChart2 size={22} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('analyticsTitle', 'Аналитический центр платформы')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('analyticsSubtitle', 'Сводные показатели торгов, финансовая эффективность и активность участников')}
                </p>
              </div>
            </div>
          </div>

          {/* Правый блок: Переключатель режима данных + Табы периодов + Валюта + Экспорт */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Компактный переключатель: Демо / Реальная БД */}
            <button
              onClick={() => handleToggleDataSource(dataSource === 'demo' ? 'real' : 'demo')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 ${
                dataSource === 'real'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
                  : isDarkMode
                  ? 'bg-[#0b0f17] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-slate-100/90 border-slate-200/80 text-slate-700 hover:bg-slate-200/70'
              }`}
              title="Переключить между демонстрационным показом и реальной базой данных"
            >
              {dataSource === 'real' ? (
                <>
                  <Database size={13} className="text-white" />
                  <span>{t('realDbModeBtn', 'Реальная БД')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{t('demoModeBtn', 'Демо-показ')}</span>
                </>
              )}
            </button>

            {/* Табы периодов (Pills) */}
            <div className={`inline-flex items-center p-1 rounded-xl border ${
              isDarkMode ? 'bg-[#0b0f17] border-slate-800' : 'bg-slate-100/80 border-slate-200/60'
            }`}>
              {[
                { id: '24h', label: t('period24h', '24 ч') },
                { id: '7d', label: t('period7d', '7 дней') },
                { id: '30d', label: t('period30d', '30 дней') },
                { id: '6m', label: t('period6m', '6 мес') },
                { id: '1y', label: t('period1y', '1 год') },
              ].map((p) => {
                const isActive = period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Выбор валюты */}
            <div className="w-32">
              <CustomSelect
                value={currency}
                onChange={(val) => setCurrency(val)}
                options={[
                  { value: 'TMT', label: 'TMT (манат)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                ]}
                isDarkMode={isDarkMode}
                size="sm"
              />
            </div>

            {/* Кнопка обновления */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title={t('updatedJustNow', 'Обновить данные')}
              className={`p-2.5 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : ''} />
            </button>

            {/* Кнопка экспорта */}
            <div className="relative" id="export-dropdown-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download size={15} />
                <span>{t('exportReportBtn', 'Экспорт отчета')}</span>
              </button>

              {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <button
                    onClick={() => handleExport('PDF')}
                    className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Printer size={15} className="mr-2.5 text-slate-400" />
                    {t('exportPDF', 'Печать в PDF')}
                  </button>
                  <button
                    onClick={() => handleExport('CSV')}
                    className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <FileSpreadsheet size={15} className="mr-2.5 text-slate-400" />
                    {t('exportCSV', 'Данные CSV (Excel)')}
                  </button>
                  <button
                    onClick={() => handleExport('JSON')}
                    className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <FileCode size={15} className="mr-2.5 text-slate-400" />
                    {t('exportJSON', 'Сырые данные JSON')}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 2. РЯД 1: 5 КЛЮЧЕВЫХ KPI-МЕТРИК */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Общий объем торгов */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t('totalProcurementVolume', 'Общий объем закупок')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(data?.kpi?.totalVolume || 0)}
          </div>
          <div className="flex items-center mt-2.5">
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
              <TrendingUp size={11} className="mr-1" />
              {Number(data?.kpi?.totalVolume || 0) > 0 ? (data?.meta?.delta || '+14.2%') : '0.0%'}
            </span>
            <span className="text-[11px] text-slate-400 ml-2">
              {Number(data?.kpi?.totalVolume || 0) > 0 ? t('vsPreviousPeriod', 'к прошлому периоду') : 'Ожидается запуск'}
            </span>
          </div>
        </div>

        {/* KPI 2: Экономия бюджета */}
        <div className={`p-5 rounded-2xl border transition-all relative group ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t('budgetSavings', 'Экономия бюджета')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(data?.kpi?.savingsAmount || 0)}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {data?.kpi?.savingsPercent || '0.0'}% {t('budgetSavings', 'экономии')}
            </span>
            <span className="text-[10px] text-slate-400 cursor-help" title={t('savingsHint', 'Разница между НМЦК и ценой победителей')}>
              ⓘ {Number(data?.kpi?.savingsAmount || 0) === 0 ? 'Торги на стадии приема' : t('savingsHint', 'НМЦК vs финал')}
            </span>
          </div>
        </div>

        {/* KPI 3: Проведено процедур */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t('proceduresConducted', 'Проведено процедур')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Briefcase size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatNumber(data?.kpi?.totalProcedures || 0)} <span className="text-sm font-normal text-slate-400">{t('tendersCount', 'тендеров')}</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{data?.kpi?.successfulProcedures || 0} {t('completedShort', 'успешно')}</span>
            <span>/</span>
            <span className="text-slate-400">{data?.kpi?.cancelledProcedures || 0} {t('cancelledShort', 'не сост.')}</span>
          </div>
        </div>

        {/* KPI 4: Подано предложений (Конкуренция) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t('bidsSubmitted', 'Подано предложений')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatNumber(data?.kpi?.totalOffers || 0)} <span className="text-sm font-normal text-slate-400">заявок</span>
          </div>
          <div className="flex items-center mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t('competitionAvg', `В среднем ${data?.kpi?.competitionIndex || '0.0'} заявки на лот`, { ratio: data?.kpi?.competitionIndex || '0.0' })}
            </span>
          </div>
        </div>

        {/* KPI 5: Активные поставщики */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t('activeSuppliersCount', 'Активные поставщики')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatNumber(data?.kpi?.activeSuppliers || 0)} <span className="text-sm font-normal text-slate-400">компаний</span>
          </div>
          <div className="flex items-center mt-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>+{data?.kpi?.newSuppliersPeriod || 0} новых за период</span>
          </div>
        </div>

      </div>

      {/* 3. РЯД 2: БОЛЬШОЙ ТРЕНД ОБЪЕМОВ (AREA CHART 65%) + СТАТУСЫ ЗАКУПОК (DONUT 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Левый блок (65%): Area Chart динамики торгов */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border transition-all relative ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('tradeDynamics', 'Динамика торгов и объемов')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Соотношение объема опубликованных лотов к сумме заключенных контрактов
              </p>
            </div>

            {/* Легенда графиков (Четко разделенные цвета: Серый/План vs Изумруд/Факт) */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {t('publishedLotsVolume', 'Объем объявленных лотов (План)')}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {t('awardedVolume', 'Фактически разыграно (Факт)')}
                </span>
              </div>
            </div>
          </div>

          {/* Интерактивный SVG график */}
          <div className="relative w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
            >
              <defs>
                {/* Изумрудный градиент для заливки площади разыгранных контрактов */}
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={isDarkMode ? 0.35 : 0.22} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>

                {/* Градиент свечения для изумрудной линии */}
                <linearGradient id="awardedStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>

              {/* Горизонтальные сетчатые линии */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingY + pct * (svgHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* Заливка под линией разыгранного объема (Факт) */}
              {areaPathAwarded && (
                <path d={areaPathAwarded} fill="url(#emeraldGradient)" />
              )}

              {/* Линия опубликованного объема (План/Потолок: нейтрально-серый пунктир #94A3B8) */}
              {linePathPublished && (
                <path
                  d={linePathPublished}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  className="transition-all duration-300"
                />
              )}

              {/* Линия фактически разыгранного объема (Факт: яркая фирменная изумрудная линия #10B981) */}
              {linePathAwarded && (
                <path
                  d={linePathAwarded}
                  fill="none"
                  stroke="url(#awardedStrokeGradient)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="transition-all duration-300 drop-shadow-xs"
                />
              )}

              {/* Вертикальная направляющая при ховере */}
              {hoveredTimelineIdx !== null && pointsPublished[hoveredTimelineIdx] && (
                <line
                  x1={pointsPublished[hoveredTimelineIdx].x}
                  y1={paddingY}
                  x2={pointsPublished[hoveredTimelineIdx].x}
                  y2={svgHeight - paddingY}
                  stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
              )}

              {/* Интерактивные точки */}
              {pointsPublished.map((pt, i) => {
                const isHovered = hoveredTimelineIdx === i;
                const ptAwarded = pointsAwarded[i];
                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTimelineIdx(i)}
                    onMouseLeave={() => setHoveredTimelineIdx(null)}
                  >
                    {/* Невидимая область для легкого попадания курсором */}
                    <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />

                    {/* Точка опубликованного (Нейтрально-серая) */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#94A3B8"
                      stroke={isDarkMode ? '#111827' : '#ffffff'}
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />

                    {/* Точка разыгранного (Изумрудная) */}
                    {ptAwarded && (
                      <circle
                        cx={ptAwarded.x}
                        cy={ptAwarded.y}
                        r={isHovered ? 7 : 4.5}
                        fill="#10B981"
                        stroke={isDarkMode ? '#111827' : '#ffffff'}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Подпись точки на оси X */}
                    <text
                      x={pt.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-medium transition-colors ${
                        isHovered
                          ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                          : isDarkMode
                          ? 'fill-slate-500'
                          : 'fill-slate-400'
                      }`}
                    >
                      {pt.data.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Заглушка (Empty State) при отсутствии объемов за период */}
            {isTimelineEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                <div className={`px-4 py-2 rounded-xl border text-xs font-medium backdrop-blur-xs shadow-xs ${
                  isDarkMode ? 'bg-[#0f172a]/90 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-600'
                }`}>
                  {t('noCompletedTendersYet', 'Нет завершенных торгов за выбранный период')}
                </div>
              </div>
            )}

            {/* Всплывающий Custom Tooltip */}
            {activeTimelineItem && hoveredTimelineIdx !== null && pointsPublished[hoveredTimelineIdx] && (
              <div
                className={`absolute pointer-events-none p-3 rounded-xl border shadow-xl text-xs z-20 backdrop-blur-md transition-all duration-100 ${
                  isDarkMode
                    ? 'bg-[#1e293b]/95 border-slate-700 text-white shadow-black/40'
                    : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/80'
                }`}
                style={{
                  left: `${(pointsPublished[hoveredTimelineIdx].x / svgWidth) * 100}%`,
                  top: '15%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-700 pb-1.5 mb-1.5 flex items-center justify-between gap-4">
                  <span>{activeTimelineItem.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                    {t('tradeDynamics', 'Динамика')}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
                      {t('lotsPlanShort', 'Объявлено (План)')}:
                    </span>
                    <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {formatCurrency(activeTimelineItem.published)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                      {t('lotsFactShort', 'Разыграно (Факт)')}:
                    </span>
                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(activeTimelineItem.awarded)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400">Экономия:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(activeTimelineItem.savings)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Правый блок (35%): Donut Chart статусов процедур */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border transition-all flex flex-col justify-between ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('procedureResults', 'Результативность процедур')}
              </h2>
              <PieIcon size={18} className="text-slate-400" />
            </div>

            {/* Donut SVG с интерактивными сегментами или заглушкой */}
            <div className="relative flex justify-center items-center my-2">
              <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
                {totalStatusCount === 0 ? (
                  <circle
                    cx="110"
                    cy="110"
                    r="70"
                    fill="none"
                    stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
                    strokeWidth="18"
                    strokeDasharray="4 4"
                  />
                ) : (
                  donutSegments.map((segment) => {
                    if (!segment.path) return null;
                    const isHovered = hoveredDonutIdx === segment.idx;
                    return (
                      <path
                        key={segment.id}
                        d={segment.path}
                        fill={segment.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transformOrigin: '110px 110px',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          opacity: hoveredDonutIdx !== null && !isHovered ? 0.45 : 1,
                        }}
                        onMouseEnter={() => setHoveredDonutIdx(segment.idx)}
                        onMouseLeave={() => setHoveredDonutIdx(null)}
                      />
                    );
                  })
                )}
              </svg>

              {/* Центр бублика (Счетчик процедур) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {formatNumber(data?.kpi?.totalProcedures || 0)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {t('totalProceduresLabel', 'Всего процедур')}
                </span>
              </div>
            </div>
          </div>

          {/* Легенда под бубликом (Короткий текст "Не состоялись" + без переноса процентов) */}
          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {statusDistribution.map((item, idx) => {
              const isHovered = hoveredDonutIdx === idx;
              const isCancelled = item.id === 'CANCELLED';
              const displayLabel = isCancelled ? t('cancelledShort', 'Не состоялись') : item.label;
              const hoverTitle = isCancelled ? t('cancelledFull', 'Не состоялись / Отменены') : item.label;
              return (
                <div
                  key={item.id}
                  title={hoverTitle}
                  onMouseEnter={() => setHoveredDonutIdx(idx)}
                  onMouseLeave={() => setHoveredDonutIdx(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isHovered
                      ? isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {displayLabel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 tabular-nums shrink-0 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                    <span className="text-slate-400 text-[11px] shrink-0 whitespace-nowrap">
                      ({item.percent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 4. РЯД 3: ОТРАСЛЕВОЙ И ГЕОГРАФИЧЕСКИЙ АНАЛИЗ (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Левый блок: Топ категорий по бюджету (Horizontal Bar Chart) */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('topCategoriesTitle', 'Топ категорий по бюджету')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Распределение финансового объема по отраслевым сегментам медицины
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {data?.categories?.length || 0} сегментов
            </span>
          </div>

          {(!data?.categories || data.categories.length === 0) ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">{t('noCategoriesData', 'Нет зарегистрированных категорий за период')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.categories.map((cat, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold mr-2 shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="truncate" title={cat.name}>{cat.name}</span>
                    </span>
                    <div className="flex items-center space-x-2 tabular-nums shrink-0 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                      <span className="text-slate-400 text-[11px]">({cat.percent}%)</span>
                    </div>
                  </div>

                  {/* Прогресс-бар с изумрудным градиентом */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{ width: `${Math.max(cat.percent, 3)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>{cat.tenders} {t('tendersCount', 'тендеров')}</span>
                    <span>Доля: {cat.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Правый блок: Географическая активность по Велаятам Туркменистана */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('regionalActivityTitle', 'Географическая активность (Велаяты)')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Охват регионов Туркменистана и концентрация медицинских госзакупок
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>

          {(!data?.regions || data.regions.length === 0) ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">{t('noRegionsData', 'Нет региональных данных за период')}</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.regions.map((region) => (
                <div key={region.id} className="flex items-center justify-between gap-3 text-xs">
                  
                  {/* Название региона */}
                  <div className="w-44 shrink-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={region.name}>
                      {region.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {region.tenders} {t('tendersCount', 'тендеров')}
                    </div>
                  </div>

                  {/* Полоса охвата */}
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(region.percent, 3)}%` }}
                    />
                  </div>

                  {/* Финансовая сумма и процент */}
                  <div className="w-28 text-right tabular-nums shrink-0 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(region.amount)}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {region.percent}% объема
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 5. РЯД 4: ЛИДЕРБОРДЫ — ТОП ПОСТАВЩИКОВ И КЛЮЧЕВЫЕ ЗАКАЗЧИКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Таблица 1 (65%): Топ-5 поставщиков по сумме побед */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('topSuppliersLeaderboard', 'Топ-5 поставщиков по сумме побед')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Рейтинг победителей по общему объему заключенных государственных контрактов
              </p>
            </div>
            <Award size={20} className="text-amber-500" />
          </div>

          {(!data?.topSuppliers || data.topSuppliers.length === 0) ? (
            <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                <Award size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t('noCompletedTendersYet', 'Нет завершенных торгов с победителями')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {t('noCompletedTendersDesc', 'Рейтинг поставщиков сформируется автоматически после подведения итогов открытых процедур.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-3 font-semibold whitespace-nowrap">{t('rankColumn', '#')}</th>
                    <th className="py-3 px-3 font-semibold min-w-[200px]">{t('companyName', 'Наименование компании')}</th>
                    <th className="py-3 px-3 font-semibold">{t('directionField', 'Направление')}</th>
                    <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">{t('lotsWonCount', 'Выиграно лотов')}</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">{t('totalContractSum', 'Сумма контрактов')}</th>
                    <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">{t('winRateLabel', 'Win Rate %')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.topSuppliers.map((sup) => {
                    const isTop1 = sup.rank === 1;
                    const isTop2 = sup.rank === 2;
                    const isTop3 = sup.rank === 3;
                    return (
                      <tr
                        key={sup.rank}
                        className={`transition-colors ${
                          isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Позиция с медалью */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                            isTop1
                              ? 'bg-amber-400 text-slate-900 shadow-xs shadow-amber-400/50'
                              : isTop2
                              ? 'bg-slate-300 text-slate-900'
                              : isTop3
                              ? 'bg-amber-700/80 text-white'
                              : isDarkMode
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sup.rank}
                          </span>
                        </td>

                        {/* Компания с truncate */}
                        <td className="py-3.5 px-3 min-w-[200px]">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center">
                            <span className="max-w-[180px] sm:max-w-[260px] md:max-w-[340px] truncate" title={sup.name}>
                              {sup.name}
                            </span>
                            <ShieldCheck size={13} className="text-emerald-500 ml-1.5 shrink-0" />
                          </div>
                        </td>

                        {/* Направление */}
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {sup.category}
                        </td>

                        {/* Выиграно лотов */}
                        <td className="py-3.5 px-3 text-center tabular-nums font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {sup.winsCount}
                        </td>

                        {/* Сумма контрактов */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(sup.totalContracts)}
                        </td>

                        {/* Win Rate */}
                        <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {sup.winRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Таблица 2 (35%): Ключевые заказчики */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('topClientsTitle', 'Ключевые заказчики')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Организации Минздрава по бюджетной активности
              </p>
            </div>
            <Building2 size={18} className="text-slate-400" />
          </div>

          {(!data?.topClients || data.topClients.length === 0) ? (
            <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                <Building2 size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t('noClientsData', 'Нет данных по заказчикам')}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Список заказчиков появится при публикации процедур в системе.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topClients.map((client) => (
                <div
                  key={client.rank}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDarkMode
                      ? 'bg-[#0b0f17] border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white text-xs mb-1.5 leading-snug">
                    {client.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{client.procedures} {t('proceduresCount', 'процедур')}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                      {formatCurrency(client.budget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 pt-1 border-t border-slate-200/40 dark:border-slate-800">
                    <span>{t('averageCompetition', 'Конкуренция')}:</span>
                    <span className="font-semibold">{client.avgCompetition} заявки / лот</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Запасной калиброванный набор данных при сбое сети
function getFallbackData(period = '30d', currency = 'TMT') {
  const currencyMultiplier = currency === 'USD' ? 0.285 : currency === 'EUR' ? 0.265 : 1;
  const factors = {
    '24h': { factor: 0.05, delta: '+3.1%', timelinePoints: ['04:00', '08:00', '12:00', '16:00', '20:00', '23:59'] },
    '7d': { factor: 0.25, delta: '+8.4%', timelinePoints: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
    '30d': { factor: 1.0, delta: '+14.2%', timelinePoints: ['1-5 сен', '6-10 сен', '11-15 сен', '16-20 сен', '21-25 сен', '26-30 сен'] },
    '6m': { factor: 5.5, delta: '+21.6%', timelinePoints: ['Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
    '1y': { factor: 11.2, delta: '+28.9%', timelinePoints: ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
  };
  const meta = factors[period] || factors['30d'];
  const baseVolume = 0;
  const totalVolume = Math.round(baseVolume * currencyMultiplier);

  return {
    meta: {
      period,
      currency,
      delta: meta.delta,
    },
    kpi: {
      totalVolume,
      savingsAmount: 0,
      savingsPercent: '0.0',
      totalProcedures: 0,
      successfulProcedures: 0,
      cancelledProcedures: 0,
      totalOffers: 0,
      competitionIndex: '0.0',
      activeSuppliers: 0,
      newSuppliersPeriod: 0,
    },
    timeline: meta.timelinePoints.map((label) => ({
      label,
      published: 0,
      awarded: 0,
      savings: 0,
    })),
    statusDistribution: [
      { id: 'COMPLETED', label: 'Успешно завершены', count: 0, percent: 0, color: '#10B981' },
      { id: 'IN_REVIEW', label: 'На рассмотрении', count: 0, percent: 0, color: '#F59E0B' },
      { id: 'ACTIVE', label: 'Активный приём заявок', count: 0, percent: 0, color: '#0EA5E9' },
      { id: 'CANCELLED', label: 'Не состоялись', count: 0, percent: 0, color: '#94A3B8' },
    ],
    categories: [],
    regions: [],
    topSuppliers: [],
    topClients: [],
  };
}

// Эталонный демонстрационный набор данных (Bloomberg Showcase)
function getDemoShowcaseData(period = '30d', currency = 'TMT') {
  const currencyMultiplier = currency === 'USD' ? 0.285 : currency === 'EUR' ? 0.265 : 1;
  const factors = {
    '24h': { factor: 0.05, delta: '+3.1%', timelinePoints: ['04:00', '08:00', '12:00', '16:00', '20:00', '23:59'] },
    '7d': { factor: 0.25, delta: '+8.4%', timelinePoints: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
    '30d': { factor: 1.0, delta: '+14.2%', timelinePoints: ['1-5 сен', '6-10 сен', '11-15 сен', '16-20 сен', '21-25 сен', '26-30 сен'] },
    '6m': { factor: 5.5, delta: '+21.6%', timelinePoints: ['Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
    '1y': { factor: 11.2, delta: '+28.9%', timelinePoints: ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
  };
  const meta = factors[period] || factors['30d'];
  const baseVolume = 24850000 * meta.factor * currencyMultiplier;
  const savings = Math.round(baseVolume * 0.087);
  const totalVolume = Math.round(baseVolume);

  return {
    meta: {
      period,
      currency,
      delta: meta.delta,
      isDemo: true,
    },
    kpi: {
      totalVolume,
      savingsAmount: savings,
      savingsPercent: '8.7',
      totalProcedures: Math.round(48 * (meta.factor > 1 ? meta.factor * 0.35 : 1)),
      successfulProcedures: Math.round(41 * (meta.factor > 1 ? meta.factor * 0.35 : 1)),
      cancelledProcedures: Math.round(7 * (meta.factor > 1 ? meta.factor * 0.35 : 1)),
      totalOffers: Math.round(164 * (meta.factor > 1 ? meta.factor * 0.35 : 1)),
      competitionIndex: '3.4',
      activeSuppliers: Math.round(86 * (meta.factor > 1 ? 1.3 : 1)),
      newSuppliersPeriod: Math.round(12 * (meta.factor > 1 ? 1.5 : 1)),
    },
    timeline: meta.timelinePoints.map((label, idx) => {
      const published = Math.round((totalVolume / meta.timelinePoints.length) * (0.88 + Math.sin(idx) * 0.15));
      const awarded = Math.round(published * 0.91);
      return {
        label,
        published,
        awarded,
        savings: published - awarded,
      };
    }),
    statusDistribution: [
      { id: 'COMPLETED', label: 'Успешно завершены', count: 41, percent: 68, color: '#10B981' },
      { id: 'IN_REVIEW', label: 'На рассмотрении', count: 10, percent: 16, color: '#F59E0B' },
      { id: 'ACTIVE', label: 'Активный приём заявок', count: 6, percent: 10, color: '#0EA5E9' },
      { id: 'CANCELLED', label: 'Не состоялись', count: 4, percent: 6, color: '#94A3B8' },
    ],
    categories: [
      { name: 'Фармацевтика и медикаменты', amount: Math.round(totalVolume * 0.42), percent: 42, tenders: 22 },
      { name: 'Медицинское и диагностическое оборудование', amount: Math.round(totalVolume * 0.28), percent: 28, tenders: 14 },
      { name: 'IT-инфраструктура и расходные материалы', amount: Math.round(totalVolume * 0.14), percent: 14, tenders: 7 },
      { name: 'Капитальный ремонт и строительство ЛПУ', amount: Math.round(totalVolume * 0.10), percent: 10, tenders: 5 },
      { name: 'Сервисное обслуживание и клинические услуги', amount: Math.round(totalVolume * 0.06), percent: 6, tenders: 3 },
    ],
    regions: [
      { id: 'ashgabat', name: 'г. Ашхабад (Aşgabat)', amount: Math.round(totalVolume * 0.46), percent: 46, tenders: 21 },
      { id: 'arkadag', name: 'г. Аркадаг (Arkadag)', amount: Math.round(totalVolume * 0.16), percent: 16, tenders: 8 },
      { id: 'mary', name: 'Марыйский велаят', amount: Math.round(totalVolume * 0.11), percent: 11, tenders: 6 },
      { id: 'lebap', name: 'Лебапский велаят', amount: Math.round(totalVolume * 0.10), percent: 10, tenders: 5 },
      { id: 'balkan', name: 'Балканский велаят', amount: Math.round(totalVolume * 0.07), percent: 7, tenders: 4 },
      { id: 'dashoguz', name: 'Дашогузский велаят', amount: Math.round(totalVolume * 0.06), percent: 6, tenders: 3 },
      { id: 'ahal', name: 'Ахалский велаят', amount: Math.round(totalVolume * 0.04), percent: 4, tenders: 2 },
    ],
    topSuppliers: [
      { rank: 1, name: 'Hojalyk Jemgyýeti «Derman Saglyk»', category: 'Фармацевтика и препараты', winsCount: 14, totalContracts: Math.round(totalVolume * 0.24), winRate: 78 },
      { rank: 2, name: 'ÝGP «MedTehnika Üpjünçilik»', category: 'Диагностика и медтехника', winsCount: 9, totalContracts: Math.round(totalVolume * 0.18), winRate: 64 },
      { rank: 3, name: 'HJ «Sanly Lukmançylyk Ulgamlary»', category: 'IT и медицинские базы', winsCount: 7, totalContracts: Math.round(totalVolume * 0.11), winRate: 70 },
      { rank: 4, name: 'HK «Arassa Lukman Enjamlary»', category: 'Расходные материалы', winsCount: 6, totalContracts: Math.round(totalVolume * 0.08), winRate: 55 },
      { rank: 5, name: 'HJ «Gurluşyk Med Inžiniring»', category: 'Ремонт и спецклининг ЛПУ', winsCount: 4, totalContracts: Math.round(totalVolume * 0.06), winRate: 50 },
    ],
    topClients: [
      { rank: 1, name: 'Министерство здравоохранения и медицинской промышленности', procedures: 22, budget: Math.round(totalVolume * 0.52), avgCompetition: 3.8 },
      { rank: 2, name: 'Международный центр кардиологии г. Ашхабад', procedures: 11, budget: Math.round(totalVolume * 0.21), avgCompetition: 3.2 },
      { rank: 3, name: 'Многопрофильная больница г. Аркадаг', procedures: 8, budget: Math.round(totalVolume * 0.15), avgCompetition: 3.5 },
      { rank: 4, name: 'Диагностический центр Марыйского велаята', procedures: 5, budget: Math.round(totalVolume * 0.08), avgCompetition: 2.9 },
    ],
  };
}
