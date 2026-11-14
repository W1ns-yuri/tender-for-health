import tm from '../locales/tm';
import ru from '../locales/ru';
import en from '../locales/en';

/**
 * Словари интерфейса. Сами тексты лежат в src/locales/{tm,ru,en}.js.
 * Компоненты берут перевод через useT(lang): t('ключ', 'запасной текст по-русски').
 */
export const translations = { TM: tm, RU: ru, EN: en };

export const getTranslation = (lang, key, fallback = '', params = null) => {
  const currentDict = translations[lang] || {};
  const ruDict = translations.RU || {};
  const tmDict = translations.TM || {};
  const enDict = translations.EN || {};
  let text = currentDict[key] ?? ruDict[key] ?? tmDict[key] ?? enDict[key] ?? fallback ?? key;
  if (typeof text !== 'string') text = String(text || '');
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`(\\$\\{${paramKey}\\}|\\{${paramKey}\\})`, 'g'), params[paramKey]);
    });
  }
  return text;
};
