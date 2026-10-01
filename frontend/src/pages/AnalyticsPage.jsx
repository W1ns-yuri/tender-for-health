import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';

import {
  AnalyticsHeader,
  AnalyticsKpiCards,
  AnalyticsVolumeChart,
  AnalyticsDonutChart,
  AnalyticsCategoryDistribution,
  AnalyticsRegionalDistribution,
  AnalyticsTopSuppliersTable,
  AnalyticsTopClientsCards,
  getCurrencySymbol,
  getFallbackData,
  getDemoShowcaseData,
  exportAnalyticsReport,
} from '../components/analytics';

/**
 * Аналитический центр платформы (AnalyticsPage)
 * Декомпозирован на модульные компоненты в src/components/analytics/
 */
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

  // Валютный символ
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  // Загрузка данных аналитики из API
  const fetchAnalytics = useCallback(async () => {
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
  }, [period, currency]);

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

  useEffect(() => {
    if (dataSource === 'demo') {
      setData(getDemoShowcaseData(period, currency));
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [period, currency, dataSource, fetchAnalytics]);

  // Обработчик экспорта
  const handleExport = (format) => {
    exportAnalyticsReport(format, data, period, currency, currencySymbol, t, showAlert);
  };

  return (
    <div
      className={`space-y-6 pb-12 transition-colors duration-200 ${
        isDarkMode ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* 1. ШАПКА И ФИЛЬТРЫ */}
      <AnalyticsHeader
        dataSource={dataSource}
        onToggleDataSource={handleToggleDataSource}
        period={period}
        onPeriodChange={setPeriod}
        currency={currency}
        onCurrencyChange={setCurrency}
        loading={loading}
        onRefresh={fetchAnalytics}
        onExport={handleExport}
        isDarkMode={isDarkMode}
        t={t}
      />

      {/* 2. РЯД 1: 5 КЛЮЧЕВЫХ KPI-МЕТРИК */}
      <AnalyticsKpiCards
        kpi={data?.kpi}
        meta={data?.meta}
        currencySymbol={currencySymbol}
        isDarkMode={isDarkMode}
        t={t}
      />

      {/* 3. РЯД 2: ДИНАМИКА ОБЪЕМОВ (AREA CHART 65%) + СТАТУСЫ ЗАКУПОК (DONUT 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AnalyticsVolumeChart
            timeline={data?.timeline || []}
            currencySymbol={currencySymbol}
            isDarkMode={isDarkMode}
            t={t}
          />
        </div>
        <div className="lg:col-span-4">
          <AnalyticsDonutChart
            statusDistribution={data?.statusDistribution || []}
            totalProcedures={data?.kpi?.totalProcedures || 0}
            isDarkMode={isDarkMode}
            t={t}
          />
        </div>
      </div>

      {/* 4. РЯД 3: ОТРАСЛЕВОЙ И ГЕОГРАФИЧЕСКИЙ АНАЛИЗ (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCategoryDistribution
          categories={data?.categories || []}
          currencySymbol={currencySymbol}
          isDarkMode={isDarkMode}
          t={t}
        />
        <AnalyticsRegionalDistribution
          regions={data?.regions || []}
          currencySymbol={currencySymbol}
          isDarkMode={isDarkMode}
          t={t}
        />
      </div>

      {/* 5. РЯД 4: ЛИДЕРБОРДЫ — ТОП ПОСТАВЩИКОВ И КЛЮЧЕВЫЕ ЗАКАЗЧИКИ (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AnalyticsTopSuppliersTable
            topSuppliers={data?.topSuppliers || []}
            currencySymbol={currencySymbol}
            isDarkMode={isDarkMode}
            t={t}
          />
        </div>
        <div className="lg:col-span-4">
          <AnalyticsTopClientsCards
            topClients={data?.topClients || []}
            currencySymbol={currencySymbol}
            isDarkMode={isDarkMode}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
