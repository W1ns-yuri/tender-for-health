/**
 * Утилиты для модуля оценки заявок (Evaluation):
 * маппинг международных условий поставки Incoterms и форматирование цен.
 */

export const INCOTERMS_MAP = {
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

export function formatIncoterms(deliveryTerm) {
  if (!deliveryTerm) return '';
  const dtShort = (deliveryTerm.shortName || deliveryTerm.code || '').trim();
  const dtName = (deliveryTerm.name || '').trim();
  const inferredCode = dtShort || INCOTERMS_MAP[dtName.toLowerCase()] || '';
  if (inferredCode && dtName && inferredCode.toLowerCase() !== dtName.toLowerCase()) {
    return `${inferredCode} (${dtName})`;
  }
  return inferredCode || dtName;
}
