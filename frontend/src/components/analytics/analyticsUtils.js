/**
 * Utility functions and data generators for the Analytics module
 */

export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return 'TMT';
  }
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('ru-RU');
};

export const formatCurrency = (num, currencySymbol = 'TMT') => {
  return `${formatNumber(num)} ${currencySymbol}`;
};

/**
 * Export analytics report to PDF, CSV, or JSON
 */
export const exportAnalyticsReport = (format, data, period, currency, currencySymbol, t, showAlert) => {
  if (format === 'PDF') {
    window.print();
    return;
  }

  if (format === 'CSV') {
    const rows = [
      ['Показатель', 'Значение'],
      ['Период', period],
      ['Валюта', currency],
      ['Общий объем закупок', `${data?.kpi?.totalVolume || 0} ${currencySymbol}`],
      [
        'Экономия бюджета',
        `${data?.kpi?.savingsAmount || 0} ${currencySymbol} (${data?.kpi?.savingsPercent || 0}%)`,
      ],
      ['Проведено процедур', data?.kpi?.totalProcedures || 0],
      ['Подано предложений', data?.kpi?.totalOffers || 0],
      ['Активные поставщики', data?.kpi?.activeSuppliers || 0],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_report_${period}_${currency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showAlert) {
      showAlert(t('successTitle', 'Успешно'), 'CSV-отчет сформирован и загружен', 'success');
    }
    return;
  }

  if (format === 'JSON') {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `analytics_data_${period}_${currency}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (showAlert) {
      showAlert(t('successTitle', 'Успешно'), 'JSON-выгрузка сохранена', 'success');
    }
  }
};

/**
 * Fallback dataset if API is offline or returns an empty state
 */
export function getFallbackData(period = '30d', currency = 'TMT') {
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

/**
 * Bloomberg-grade Showcase dataset for demonstrations
 */
export function getDemoShowcaseData(period = '30d', currency = 'TMT') {
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
      const published = Math.round(
        (totalVolume / meta.timelinePoints.length) * (0.88 + Math.sin(idx) * 0.15)
      );
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
