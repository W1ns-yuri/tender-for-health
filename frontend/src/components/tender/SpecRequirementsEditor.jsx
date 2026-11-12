import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import API from '../../services/api';
import { OPERATOR_LABELS } from '../../utils/requirements';

// Справочник характеристик нужен всем строкам таблицы: грузим один раз
let attributesCache = null;
const loadAttributes = () => {
  if (!attributesCache) {
    attributesCache = API.get('/catalogs/attributes')
      .then((res) => (Array.isArray(res.data) ? res.data : []))
      .catch(() => { attributesCache = null; return []; });
  }
  return attributesCache;
};

const CUSTOM = '__custom__';

/**
 * Требования к характеристикам одной позиции лота.
 * value: [{ attributeId, customName, operator, value, isMandatory }]
 * product: выбранный товар справочника (с attributeValues) — его характеристики можно подставить одной кнопкой.
 */
export default function SpecRequirementsEditor({ value = [], onChange, product, inputClass, t = (k, f) => f }) {
  const [attributes, setAttributes] = useState([]);
  useEffect(() => { loadAttributes().then(setAttributes); }, []);
  const byId = new Map(attributes.map((a) => [a.id, a]));

  const update = (idx, patch) => onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, { attributeId: '', customName: '', operator: 'EQ', value: '', isMandatory: true }]);

  const productValues = product?.attributeValues || [];
  const fillFromProduct = () => {
    const have = new Set(value.map((r) => r.attributeId || r.customName));
    const extra = productValues
      .filter((v) => !have.has(v.attributeId || v.customName))
      .map((v) => ({ attributeId: v.attributeId || '', customName: v.attributeId ? '' : v.customName, operator: 'EQ', value: v.value, isMandatory: true }));
    onChange([...value, ...extra]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('reqHint', 'Поставщик может предложить аналог. Обязательные требования аналог должен выполнить, иначе его нельзя выбрать победителем. Желательные только подсвечиваются при оценке.')}
      </p>
      {value.map((r, idx) => {
        const attr = byId.get(r.attributeId);
        const isCustom = !r.attributeId;
        const numeric = isCustom || attr?.type === 'NUMBER';
        return (
          <div key={idx} className="flex flex-wrap items-center gap-2">
            <select
              value={isCustom ? CUSTOM : r.attributeId}
              onChange={(e) => update(idx, e.target.value === CUSTOM
                ? { attributeId: '', operator: 'EQ', value: '' }
                : { attributeId: e.target.value, customName: '', operator: 'EQ', value: '' })}
              aria-label={t('reqAttr', 'Характеристика')}
              className={`${inputClass} w-44`}
            >
              <option value={CUSTOM}>{t('reqCustom', 'Своё требование...')}</option>
              {attributes.map((a) => <option key={a.id} value={a.id}>{a.name}{a.unit ? `, ${a.unit}` : ''}</option>)}
            </select>
            {isCustom && (
              <input
                type="text" value={r.customName} maxLength={100}
                onChange={(e) => update(idx, { customName: e.target.value })}
                placeholder={t('reqCustomPh', 'Например: Гарантия')}
                aria-label={t('reqCustomName', 'Что требуется')}
                className={`${inputClass} w-40`}
              />
            )}
            <select
              value={r.operator}
              onChange={(e) => update(idx, { operator: e.target.value })}
              disabled={!numeric}
              aria-label={t('reqOperator', 'Условие')}
              className={`${inputClass} w-32 disabled:opacity-60`}
            >
              {Object.entries(OPERATOR_LABELS).filter(([k]) => numeric || k === 'EQ').map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            {attr?.type === 'LIST' || attr?.type === 'BOOLEAN' ? (
              <select
                value={r.value}
                onChange={(e) => update(idx, { value: e.target.value })}
                aria-label={t('reqValue', 'Значение')}
                className={`${inputClass} w-40`}
              >
                <option value="">{t('selectPrompt', 'Выберите...')}</option>
                {attr.type === 'BOOLEAN'
                  ? [<option key="t" value="true">да</option>, <option key="f" value="false">нет</option>]
                  : attr.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text" value={r.value} maxLength={500}
                inputMode={attr?.type === 'NUMBER' ? 'decimal' : 'text'}
                onChange={(e) => update(idx, { value: e.target.value })}
                placeholder={attr?.type === 'NUMBER' ? '23' : t('reqValuePh', 'Значение')}
                aria-label={t('reqValue', 'Значение')}
                className={`${inputClass} w-32`}
              />
            )}
            {attr?.unit && <span className="text-xs text-slate-500">{attr.unit}</span>}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={r.isMandatory} onChange={(e) => update(idx, { isMandatory: e.target.checked })} />
              {t('reqMandatory', 'Обязательно')}
            </label>
            <button type="button" onClick={() => remove(idx)} title={t('remove', 'Убрать')} className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer">
          <Plus size={14} /> {t('reqAdd', 'Добавить требование')}
        </button>
        {productValues.length > 0 && (
          <button type="button" onClick={fillFromProduct} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer">
            <Wand2 size={14} /> {t('reqFromProduct', 'Взять характеристики выбранного товара')}
          </button>
        )}
      </div>
    </div>
  );
}
