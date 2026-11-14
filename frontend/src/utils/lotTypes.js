/**
 * Типы лотов. Один тендер может состоять из лотов разных типов:
 * снос здания (работы), материалы (товары), аренда экскаватора, ремонт, оборудование, лицензии.
 * itemTypes — какие позиции справочника подходят для лота, categoryType — какие категории (null — любые).
 */
export const LOT_TYPES = [
  { id: 'GOODS', name: 'Товары', itemTypes: ['GOODS'], categoryType: 'GOODS' },
  { id: 'WORKS', name: 'Работы', itemTypes: ['WORKS'], categoryType: 'WORKS' },
  { id: 'SERVICES', name: 'Услуги', itemTypes: ['SERVICES'], categoryType: 'SERVICES' },
  { id: 'RENTAL', name: 'Аренда техники', itemTypes: ['GOODS', 'SERVICES'], categoryType: null },
  { id: 'LICENSES', name: 'Лицензии и поддержка', itemTypes: ['GOODS', 'SERVICES'], categoryType: null },
];

export const lotTypeInfo = (id) => LOT_TYPES.find((x) => x.id === id) || LOT_TYPES[0];
export const isNewLotType = (id) => id === 'RENTAL' || id === 'LICENSES';
