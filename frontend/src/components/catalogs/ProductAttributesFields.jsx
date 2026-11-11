import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';
import API from '../../services/api';
import { resolveFileUrl } from '../../utils/themeUtils';

/**
 * Характеристики товара в форме справочника.
 * Поля берутся из категории (вместе с унаследованными от родительских),
 * плюс свои характеристики товара и необязательное фото.
 *
 * value: [{ attributeId, value }] и [{ customName, value }] — в таком виде их ждёт сервер.
 */
export default function ProductAttributesFields({
  categoryId,
  value = [],
  onChange,
  imageFileName,
  onImageChange,
  inputClass,
  isDarkMode,
  t = (k, f) => f,
}) {
  const [catAttrs, setCatAttrs] = useState([]);
  const [photoEnabled, setPhotoEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!categoryId) {
      setCatAttrs([]);
      setPhotoEnabled(true);
      return;
    }
    let cancelled = false;
    API.get(`/catalogs/categories/${categoryId}/attributes`)
      .then((res) => {
        if (cancelled) return;
        setCatAttrs(res.data?.attributes || []);
        setPhotoEnabled(res.data?.photoEnabled !== false);
      })
      .catch(() => !cancelled && setCatAttrs([]));
    return () => { cancelled = true; };
  }, [categoryId]);

  const valueOf = (attributeId) => value.find((v) => v.attributeId === attributeId)?.value ?? '';
  const custom = value.filter((v) => !v.attributeId);

  const setAttr = (attributeId, val) => {
    const rest = value.filter((v) => v.attributeId !== attributeId);
    onChange([...rest, { attributeId, value: val }]);
  };
  const setCustom = (idx, patch) => {
    let n = -1;
    onChange(value.map((v) => (!v.attributeId && ++n === idx ? { ...v, ...patch } : v)));
  };
  const removeCustom = (idx) => {
    let n = -1;
    onChange(value.filter((v) => v.attributeId || ++n !== idx));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setUploadError(t('photoTypeError', 'Нужна картинка JPG, PNG или WEBP'));
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onImageChange(res.data?.fileName || '');
    } catch (err) {
      setUploadError(err.response?.data?.error || t('photoUploadError', 'Не удалось загрузить фото'));
    } finally {
      setUploading(false);
    }
  };

  const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300';
  const subtle = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className="space-y-4">
      {catAttrs.length > 0 && (
        <fieldset className={`border-t pt-3 space-y-3 ${subtle}`}>
          <legend className="text-xs font-bold text-slate-500 dark:text-slate-400 pr-2">
            {t('attrsOfCategory', 'Характеристики категории')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catAttrs.map((a) => (
              <div key={a.attributeId} className="space-y-1">
                <label className={labelCls} htmlFor={`attr-${a.attributeId}`}>
                  {a.name}{a.unit ? `, ${a.unit}` : ''} {a.isRequired && <span className="text-rose-500">*</span>}
                </label>
                {a.type === 'LIST' || a.type === 'BOOLEAN' ? (
                  <select
                    id={`attr-${a.attributeId}`}
                    value={valueOf(a.attributeId)}
                    onChange={(e) => setAttr(a.attributeId, e.target.value)}
                    required={a.isRequired}
                    className={inputClass}
                  >
                    <option value="">{t('notSpecified', 'Не указано')}</option>
                    {a.type === 'BOOLEAN' ? (
                      <>
                        <option value="true">{t('yes', 'Да')}</option>
                        <option value="false">{t('no', 'Нет')}</option>
                      </>
                    ) : (
                      a.options.map((o) => <option key={o} value={o}>{o}</option>)
                    )}
                  </select>
                ) : (
                  <input
                    id={`attr-${a.attributeId}`}
                    type="text"
                    inputMode={a.type === 'NUMBER' ? 'decimal' : 'text'}
                    value={valueOf(a.attributeId)}
                    onChange={(e) => setAttr(a.attributeId, e.target.value)}
                    required={a.isRequired}
                    maxLength={500}
                    placeholder={a.type === 'NUMBER' ? t('numberPlaceholder', 'Число, например 23') : ''}
                    className={inputClass}
                  />
                )}
                {a.inheritedFrom && (
                  <p className="text-xs text-slate-400">{t('inheritedFrom', 'из категории')} «{a.inheritedFrom}»</p>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-2">
        <span className={labelCls}>{t('customAttrs', 'Свои характеристики')}</span>
        {custom.map((c, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={c.customName || ''}
              onChange={(e) => setCustom(idx, { customName: e.target.value })}
              placeholder={t('customAttrName', 'Название, например «Гарантия»')}
              maxLength={100}
              aria-label={t('customAttrNameLabel', 'Название характеристики')}
              className={`${inputClass} flex-1 min-w-0`}
            />
            <input
              type="text"
              value={c.value || ''}
              onChange={(e) => setCustom(idx, { value: e.target.value })}
              placeholder={t('customAttrValue', 'Значение, например «3 года»')}
              maxLength={500}
              aria-label={t('customAttrValueLabel', 'Значение характеристики')}
              className={`${inputClass} flex-1 min-w-0`}
            />
            <button
              type="button"
              onClick={() => removeCustom(idx)}
              title={t('remove', 'Убрать')}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { customName: '', value: '' }])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
        >
          <Plus size={14} /> {t('addCustomAttr', 'Добавить характеристику')}
        </button>
        {catAttrs.length === 0 && (
          <p className="text-xs text-slate-400">
            {categoryId
              ? t('noCategoryAttrs', 'У этой категории нет готовых характеристик. Опишите товар своими.')
              : t('pickCategoryForAttrs', 'Выберите категорию: у неё могут быть готовые поля (размер, цвет и т.д.).')}
          </p>
        )}
      </div>

      {photoEnabled && (
        <div className="space-y-1">
          <span className={labelCls}>{t('productPhoto', 'Фото товара')} <span className="font-normal text-slate-400">({t('optional', 'необязательно')})</span></span>
          {imageFileName ? (
            <div className="flex items-center gap-3">
              <img
                src={resolveFileUrl(imageFileName)}
                alt={t('productPhoto', 'Фото товара')}
                className={`w-20 h-20 object-contain rounded-lg border ${subtle} bg-white`}
              />
              <button
                type="button"
                onClick={() => onImageChange('')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                <X size={14} /> {t('removePhoto', 'Убрать фото')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-60 ${subtle}`}
            >
              <ImagePlus size={16} />
              {uploading ? t('uploading', 'Загрузка...') : t('uploadPhoto', 'Загрузить фото (JPG, PNG, WEBP)')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}
