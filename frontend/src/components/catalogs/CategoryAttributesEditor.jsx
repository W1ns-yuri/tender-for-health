import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import API from '../../services/api';
import { ATTRIBUTE_TYPES } from './attributeTypes';


/**
 * Набор характеристик категории: какие поля заполняют товары этой категории и какие из них обязательны.
 * value: [{ attributeId, isRequired }] — уходит в PUT /catalogs/categories/:id/attributes после сохранения категории.
 * Характеристики родительских категорий показываются отдельно: они наследуются сами.
 */
export default function CategoryAttributesEditor({
  categoryId,
  parentId,
  value,
  onChange,
  inputClass,
  isDarkMode,
  t = (k, f) => f,
}) {
  const [all, setAll] = useState([]);
  const [inherited, setInherited] = useState([]);
  const [picked, setPicked] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: 'TEXT', unit: '', options: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/catalogs/attributes').then((res) => setAll(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  // Свой набор существующей категории подгружаем один раз
  useEffect(() => {
    if (!categoryId || value !== undefined) return;
    API.get(`/catalogs/categories/${categoryId}/attributes`)
      .then((res) => onChange((res.data?.own || []).map((a) => ({ attributeId: a.attributeId, isRequired: a.isRequired }))))
      .catch(() => onChange([]));
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Что придёт от родителя
  useEffect(() => {
    if (!parentId) { setInherited([]); return; }
    API.get(`/catalogs/categories/${parentId}/attributes`)
      .then((res) => setInherited(res.data?.attributes || []))
      .catch(() => setInherited([]));
  }, [parentId]);

  const list = value || [];
  const byId = new Map(all.map((a) => [a.id, a]));
  const available = all.filter((a) => !list.some((x) => x.attributeId === a.id));

  const add = (attributeId) => {
    if (!attributeId) return;
    onChange([...list, { attributeId, isRequired: false }]);
    setPicked('');
  };

  const createAttribute = async () => {
    setError('');
    try {
      const res = await API.post('/catalogs/attributes', draft);
      setAll((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...list, { attributeId: res.data.id, isRequired: false }]);
      setDraft({ name: '', type: 'TEXT', unit: '', options: '' });
      setCreating(false);
    } catch (err) {
      setError(err.response?.data?.error || t('attrCreateError', 'Не удалось создать характеристику'));
    }
  };

  const subtle = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const typeName = (type) => ATTRIBUTE_TYPES.find((x) => x.id === type)?.name || type;

  return (
    <fieldset className={`border-t pt-3 space-y-3 ${subtle}`}>
      <legend className="text-xs font-bold text-slate-500 dark:text-slate-400 pr-2">
        {t('categoryAttrs', 'Характеристики товаров этой категории')}
      </legend>

      {inherited.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('inheritedAttrs', 'Наследуются от родительской:')} {inherited.map((a) => a.name).join(', ')}
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-xs text-slate-400">{t('noOwnAttrs', 'Своих характеристик нет. Добавьте, например, «Размер» или «Цвет».')}</p>
      ) : (
        <ul className={`divide-y rounded-lg border ${subtle} ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
          {list.map((item) => {
            const a = byId.get(item.attributeId);
            return (
              <li key={item.attributeId} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold block truncate">{a?.name || '…'}{a?.unit ? `, ${a.unit}` : ''}</span>
                  <span className="text-xs text-slate-400">{a ? typeName(a.type) : ''}{a?.type === 'LIST' ? `: ${a.options.join(', ')}` : ''}</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.isRequired}
                    onChange={(e) => onChange(list.map((x) => (x.attributeId === item.attributeId ? { ...x, isRequired: e.target.checked } : x)))}
                  />
                  {t('required', 'Обязательно')}
                </label>
                <button
                  type="button"
                  onClick={() => onChange(list.filter((x) => x.attributeId !== item.attributeId))}
                  title={t('remove', 'Убрать')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {available.length > 0 && (
          <select
            value={picked}
            onChange={(e) => add(e.target.value)}
            aria-label={t('addAttr', 'Добавить характеристику')}
            className={`${inputClass} flex-1 min-w-48`}
          >
            <option value="">{t('addExistingAttr', '+ Добавить готовую характеристику...')}</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.unit ? `, ${a.unit}` : ''} ({typeName(a.type)})</option>
            ))}
          </select>
        )}
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            <Plus size={14} /> {t('newAttr', 'Новая характеристика')}
          </button>
        )}
      </div>

      {creating && (
        <div className={`rounded-lg border p-3 space-y-2 ${subtle}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text" value={draft.name} maxLength={100}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t('attrNamePh', 'Название: Диагональ, Цвет...')}
              aria-label={t('attrName', 'Название характеристики')}
              className={inputClass}
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              aria-label={t('attrType', 'Тип значения')}
              className={inputClass}
            >
              {ATTRIBUTE_TYPES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            {draft.type === 'NUMBER' && (
              <input
                type="text" value={draft.unit} maxLength={30}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder={t('attrUnitPh', 'Единица: дюйм, кг, мг...')}
                aria-label={t('attrUnit', 'Единица измерения')}
                className={inputClass}
              />
            )}
            {draft.type === 'LIST' && (
              <input
                type="text" value={draft.options}
                onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                placeholder={t('attrOptionsPh', 'Варианты через запятую: белый, чёрный')}
                aria-label={t('attrOptions', 'Варианты')}
                className={`${inputClass} sm:col-span-2`}
              />
            )}
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setCreating(false); setError(''); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer">
              {t('cancel', 'Отмена')}
            </button>
            <button type="button" onClick={createAttribute} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
              {t('createAndAdd', 'Создать и добавить')}
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
