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
