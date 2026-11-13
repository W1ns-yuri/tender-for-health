import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ListChecks, ClipboardPaste, FolderPlus, X } from 'lucide-react';
import BoqImportModal from './BoqImportModal';
import SpecRequirementsEditor from './SpecRequirementsEditor';
import { lotTypeInfo } from '../../utils/lotTypes';
import ProductSearchableSelect from './ProductSearchableSelect';
import CustomSelect from '../CustomSelect';

export default function TenderLotItemsTable({
  activeLot,
  products = [],
  units = [],
  manufacturers = [],
  handleAddSpecRow,
  handleSpecChange,
  handleRemoveSpec,
  handleImportSpecs,
  handleOpenProductModal,
  isDarkMode,
  theme,
  lang,
  t,
  role
}) {
  const [openReqs, setOpenReqs] = useState(() => new Set());
  const [importOpen, setImportOpen] = useState(false);
  const toggleReqs = (key) => setOpenReqs((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const colCount = activeLot?.lotType === 'GOODS' ? 7 : 6;

  const lotProducts = useMemo(() => {
    const allowed = lotTypeInfo(activeLot?.lotType).itemTypes;
    return products.filter(p => allowed.includes(p.itemType || 'GOODS'));
  }, [products, activeLot?.lotType]);

  const sortedUnits = useMemo(() => {
    if (!units || units.length === 0) return [];
    if (activeLot?.lotType === 'SERVICES') {
      const priority = ['усл.', 'мес.', 'выезд', 'проц.', 'компл.', 'шт', 'уп'];
      return [...units].sort((a, b) => {
        const aIdx = priority.indexOf((a.shortName || '').toLowerCase());
        const bIdx = priority.indexOf((b.shortName || '').toLowerCase());
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });
    }
    if (activeLot?.lotType === 'WORKS') {
      const priority = ['этап', 'компл.', 'усл.', 'шт', 'м2', 'м', 'уп'];
      return [...units].sort((a, b) => {
        const aIdx = priority.indexOf((a.shortName || '').toLowerCase());
        const bIdx = priority.indexOf((b.shortName || '').toLowerCase());
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });
    }
    return units;
  }, [units, activeLot?.lotType]);

  const specPlaceholder = useMemo(() => {
    if (activeLot?.lotType === 'WORKS') return t('selectWork', 'Выберите вид работ или введите свой...');
    if (activeLot?.lotType === 'SERVICES') return t('selectService', 'Выберите услугу или введите свою...');
    return t('selectProduct', 'Выберите товар / МНН или введите...');
  }, [activeLot?.lotType, t]);

  const isWorks = activeLot?.lotType === 'WORKS';

  // Новый раздел: пустая позиция с названием раздела, следующие позиции продолжат его
  const addSection = () => {
    const n = new Set((activeLot.specs || []).map((x) => x.section).filter(Boolean)).size + 1;
    handleImportSpecs?.([{ name: '', quantity: 1, unitId: sortedUnits[0]?.id || '', section: `${t('sectionWord', 'Раздел')} ${n}` }], false);
  };

  if (!activeLot) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          {t('specificationsList', 'Спецификация позиций')} ({activeLot.specs?.length || 0})
        </h3>
        <div className="flex flex-wrap items-center gap-2">
        {handleImportSpecs && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ClipboardPaste size={14} /> {t('boqImportBtn', 'Вставить из Excel')}
          </button>
        )}
        {isWorks && (
          <button
            type="button"
            onClick={addSection}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FolderPlus size={14} /> {t('addSection', 'Раздел')}
          </button>
        )}
        {/* Заметная акцентная кнопка добавления позиции */}
        <button
          type="button"
          onClick={handleAddSpecRow}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-700 shadow-2xs"
        >
          <Plus size={14} />
          <span>{t('addPosition', 'Добавить позицию')}</span>
        </button>
        </div>
      </div>
      <BoqImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportSpecs}
        units={units}
        hasSpecs={(activeLot.specs || []).length > 0}
        inputClass={`px-3 py-2 rounded-lg outline-none border ${theme.inputBg}`}
        primaryBtn={theme.primaryBtn || 'bg-emerald-600 hover:bg-emerald-700 text-white'}
        t={t}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <th className="py-2.5 px-2 w-9 text-center font-bold">#</th>
              <th className="py-2.5 px-3 min-w-50 font-bold">
                {activeLot.lotType === 'WORKS' 
                  ? t('workStages', 'Этап / вид работ')
                  : activeLot.lotType === 'SERVICES'
                  ? t('serviceName', 'Наименование услуги')
                  : t('product', 'Товар / МНН')} *
              </th>
              <th className="py-2.5 px-2 w-24 text-center font-bold whitespace-nowrap">
                {activeLot.lotType === 'WORKS' 
                  ? t('worksVolume', 'Объем работ') 
                  : activeLot.lotType === 'SERVICES' 
                  ? t('servicesVolume', 'Объем услуг') 
                  : t('quantity', 'Количество')} *
              </th>
              <th className="py-2.5 px-2 w-24 text-center font-bold whitespace-nowrap">
                {t('unit', 'Ед. изм.')} *
              </th>
              {activeLot.lotType === 'GOODS' && (
                <th className="py-2.5 px-2 w-48 min-w-47.5 max-w-47.5 text-center font-bold whitespace-nowrap">
                  {t('manufacturer', 'Производитель')}
                </th>
              )}
              <th className="py-2.5 px-3 min-w-55 font-bold">
                {t('description', 'Описание / Требования')}
              </th>
              <th className="py-2.5 px-2 w-9 text-center font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(!activeLot.specs || activeLot.specs.length === 0) ? (
              <tr>
                <td colSpan={activeLot.lotType === 'GOODS' ? 7 : 6} className="py-8 text-center text-slate-400">
                  {t('noSpecsInLot', 'В этом лоте пока нет позиций. Нажмите «+ Добавить позицию».')}
                </td>
              </tr>
            ) : (
              activeLot.specs.map((spec, sIdx) => {
                const specHaryt = (spec.haryt || spec.name || '').toLowerCase();
                const isPharmaContext =
                  activeLot?.categoryId === 'bb58fb0e-37ae-48f5-bb77-65e2372bad02' ||
                  /таблет|раствор|ампул|шприц|капсул|мазь|вакцин|syringe|med|pharma|лекарств/i.test(specHaryt);
                const isItContext =
                  activeLot?.categoryId === '3b689cff-8649-4f68-a7b1-2ebe678250ff' ||
                  activeLot?.categoryId === '5dbc63a7-c035-45a4-b383-a6aa18c8e28c' ||
                  /компьютер|ноутбук|сервер|dell|hp|it|принтер|монитор/i.test(specHaryt);

                const sortedManufacturers = [...manufacturers].sort((a, b) => {
                  const aName = (a.name || '').toLowerCase();
                  const bName = (b.name || '').toLowerCase();
                  const aIsIt = aName.includes('dell') || aName.includes('hp');
                  const bIsIt = bName.includes('dell') || bName.includes('hp');

                  if (isPharmaContext) {
                    if (!aIsIt && bIsIt) return -1;
                    if (aIsIt && !bIsIt) return 1;
                  } else if (isItContext) {
                    if (aIsIt && !bIsIt) return -1;
                    if (!aIsIt && bIsIt) return 1;
                  }
                  return aName.localeCompare(bName);
                });

                const reqKey = spec.id || sIdx;
                const reqCount = (spec.requirements || []).length;
                const reqOpen = openReqs.has(reqKey);
                return (
                <React.Fragment key={reqKey}>
                {spec.section && spec.section !== activeLot.specs[sIdx - 1]?.section && (
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td className="py-2 px-2 text-center text-slate-400"><FolderPlus size={13} className="inline" /></td>
                    <td colSpan={colCount - 2} className="py-2 px-3">
                      <input
                        type="text" value={spec.section} maxLength={200}
                        onChange={(e) => handleSpecChange(sIdx, 'sectionGroup', e.target.value)}
                        aria-label={t('sectionName', 'Название раздела')}
                        className="w-full max-w-md bg-transparent text-xs font-bold outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleSpecChange(sIdx, 'sectionGroup', activeLot.specs[sIdx - 1]?.section || '')}
                        title={t('removeSection', 'Убрать раздел (позиции останутся)')}
                        className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">
                    {sIdx + 1}
                  </td>

                  <td className="py-2.5 px-3">
                    <ProductSearchableSelect
                      products={lotProducts}
                      lotType={activeLot.lotType || 'GOODS'}
                      value={spec.haryt || spec.name}
                      generalProductId={spec.generalProductId}
                      onChange={(val, genId) => handleSpecChange(sIdx, 'productSelect', val, genId)}
                      onOpenCreateModal={(initialName) => handleOpenProductModal(initialName, sIdx)}
                      placeholder={specPlaceholder}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      lang={lang}
                    />
                    <button
                      type="button"
                      onClick={() => toggleReqs(reqKey)}
                      aria-expanded={reqOpen}
                      className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer hover:underline ${reqCount ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      <ListChecks size={13} />
                      {reqCount ? `${t('reqShort', 'Требования')}: ${reqCount}` : t('reqAddShort', '+ Требования')}
                    </button>
                  </td>

                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={spec.mukdar || 1}
                      onChange={(e) => handleSpecChange(sIdx, 'mukdar', e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-md text-xs text-center font-mono font-bold outline-none border ${theme.inputBg}`}
                    />
                  </td>

                  <td className="py-2.5 px-2">
                    <CustomSelect
                      role={role}
                      size="sm"
                      value={spec.unit || ''}
                      onChange={(val) => handleSpecChange(sIdx, 'unit', val)}
                      options={sortedUnits.map(u => ({ id: u.id, name: u.shortName || u.name }))}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      t={t}
                    />
                  </td>

                  {activeLot.lotType === 'GOODS' && (
                    <td className="py-2.5 px-2 w-48 min-w-47.5 max-w-47.5">
                      <CustomSelect
                        role={role}
                        size="sm"
                        searchable={true}
                        value={spec.brand || ''}
                        onChange={(val) => handleSpecChange(sIdx, 'brand', val)}
                        options={sortedManufacturers.map(m => ({ id: m.id, name: m.name }))}
                        placeholder={t('selectBrand', 'Производитель...')}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        t={t}
                      />
                    </td>
                  )}

                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={spec.desc || ''}
                      onChange={(e) => handleSpecChange(sIdx, 'desc', e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-md text-xs outline-none border ${theme.inputBg}`}
                      placeholder={t('specDescPlaceholder', 'Доп. требования, техническое задание, спецификация...')}
                    />
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(sIdx)}
                      className="w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title={t('delete', 'Удалить позицию')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
                {reqOpen && (
                  <tr className="bg-slate-50/60 dark:bg-slate-800/20">
                    <td></td>
                    <td colSpan={colCount - 1} className="py-3 px-3">
                      <SpecRequirementsEditor
                        value={spec.requirements || []}
                        onChange={(rows) => handleSpecChange(sIdx, 'requirements', rows)}
                        product={lotProducts.find((p) => p.id === spec.generalProductId)}
                        inputClass={`px-2 py-1.5 rounded-md text-xs outline-none border ${theme.inputBg}`}
                        t={t}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
