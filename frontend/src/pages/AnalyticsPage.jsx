import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../services/api';
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
  exportAnalyticsReport,
} from '../components/analytics';
import useT from '../utils/useT';

/**
 * Аналитический центр платформы (AnalyticsPage)
 * Декомпозирован на модульные компоненты в src/components/analytics/
 */
export default function AnalyticsPage({ role: _role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const { showAlert } = useAlert();
  const t = useT(lang);

  // Состояния фильтров
  const [period, setPeriod] = useState('30d');
  const [currency, setCurrency] = useState('TMT');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Валюта ответа: если курса нет в справочнике, бэкенд вернёт суммы в TMT
  const currencySymbol = useMemo(() => getCurrencySymbol(data?.meta?.currency || currency), [data, currency]);

  // Загрузка данных аналитики из API
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dashboard/analytics?period=${period}&currency=${currency}`);
      setData(res.data);
    } catch (err) {
      // Никаких подставных «демо-цифр»: админ должен видеть, что данных нет, а не красивую выдумку
      setData(null);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err.response?.data?.error || t('analyticsLoadError', 'Не удалось загрузить аналитику'),
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [period, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.removeItem('tender_analytics_source'); } catch { /* старый переключатель демо-режима */ }
    fetchAnalytics();
  }, [fetchAnalytics]);

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

      {/* 4. РЯД 3: ОТРАСЛЕВОЙ И ГЕОГРАФИЧЕСКИЙ АНАЛИЗ. Регионы — только когда они реально есть в данных */}
      <div className={`grid grid-cols-1 gap-6 ${data?.regions?.length ? 'lg:grid-cols-2' : ''}`}>
        <AnalyticsCategoryDistribution
          categories={data?.categories || []}
          currencySymbol={currencySymbol}
          isDarkMode={isDarkMode}
          t={t}
        />
        {data?.regions?.length > 0 && (
          <AnalyticsRegionalDistribution
            regions={data.regions}
            currencySymbol={currencySymbol}
            isDarkMode={isDarkMode}
            t={t}
          />
        )}
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
