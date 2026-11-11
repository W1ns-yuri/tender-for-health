import { useCallback } from 'react';
import { getTranslation } from './translations';

/**
 * Переводчик для компонента. Функция стабильна, пока не сменился язык.
 * Раньше в каждом компоненте писали `const t = (key, fb) => getTranslation(...)` — новая функция
 * на каждый рендер. Если такую t положить в зависимости useEffect, эффект перезапускается
 * бесконечно (страница тендера у поставщика слала сотни запросов в секунду).
 */
export default function useT(lang) {
  return useCallback((key, fallback, params) => getTranslation(lang, key, fallback, params), [lang]);
}
