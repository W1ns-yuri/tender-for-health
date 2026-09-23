// Запрещенные спецсимволы (<, >, {, }, |, ^, ~, `, \)
export const FORBIDDEN_CHARS_REGEX = /[<>{}|^~`\\]/g;

export const sanitizeInputText = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(FORBIDDEN_CHARS_REGEX, '');
};

export const TENDER_TYPES = [
  { id: 'LOCAL', key: 'tenderTypeLocal', defaultName: 'Местный' },
  { id: 'INTERNATIONAL', key: 'tenderTypeInternational', defaultName: 'Международный' },
];

export const PROCUREMENT_TYPES = [
  { id: 'GOODS', key: 'procurementTypeGoods', defaultName: 'Товары' },
  { id: 'WORKS', key: 'procurementTypeWorks', defaultName: 'Работы' },
  { id: 'SERVICES', key: 'procurementTypeServices', defaultName: 'Услуги' },
];

export const CURRENCY_OPTIONS = [
  { id: 'USD', name: 'USD ($)' },
  { id: 'EUR', name: 'EUR (€)' },
  { id: 'TMT', name: 'TMT (m)' },
  { id: 'RUB', name: 'RUB (₽)' },
];
