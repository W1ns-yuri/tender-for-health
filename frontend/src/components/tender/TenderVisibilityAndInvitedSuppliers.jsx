import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Lock, Search, Plus, X, Users, Check, Building2, Sparkles, AlertCircle } from 'lucide-react';
import API from '../../services/api';

/**
 * Утилита для аккуратного форматирования названий компаний:
 * отделяет ОПФ (HK, HJ, ÝGP, IP, AÝG и т.д.) от основного названия,
 * исключая задвоенные кавычки и склейки.
 */
const parseSupplierName = (rawName = '') => {
  if (!rawName) return { opf: '', name: '—' };
  const str = rawName.trim();
  const match = str.match(/^([a-zA-Zа-яА-ЯýÝňŇşŞžŽçÇ]{2,4})\s+[«"“']?(.*?)[»"”']?$/);
  const knownOpfs = ['HK', 'HJ', 'ÝGP', 'YGP', 'IP', 'AÝG', 'AYG', 'AO', 'PAO', 'OOO', 'ЗАО', 'ОАО', 'ИП', 'ХО', 'ХК'];
  if (match && knownOpfs.includes(match[1].toUpperCase())) {
    const opf = match[1].toUpperCase();
    const cleanName = match[2].replace(/^[«"“']+|[»"”']+$/g, '').trim();
    return { opf, name: cleanName || match[2].trim() };
  }
  const clean = str.replace(/^[«"“']+|[»"”']+$/g, '').trim();
  return { opf: '', name: clean };
};

/**
 * Компонент управления видимостью тендера (Открытый / Закрытый)
 * и выбора приглашенных поставщиков для закрытых тендеров.
 */
export default function TenderVisibilityAndInvitedSuppliers({
  visibility = 'ACYK',
  onChangeVisibility,
  invitedSupplierIds = [],
  onChangeInvitedSuppliers,
  tenderCategoryId = null,
  isDarkMode = false,
  theme = {},
  t = (k, f) => f
}) {
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Закрытие выпадающего списка при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Загружаем список поставщиков при монтировании
  useEffect(() => {
    let isMounted = true;
    setLoadingSuppliers(true);
    API.get('/suppliers')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setAllSuppliers(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to load suppliers:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSuppliers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Фильтрация поставщиков для выпадающего поиска
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allSuppliers.filter(s => {
      const name = (s.name || '').toLowerCase();
      const taxId = (s.taxId || '').toLowerCase();
      const address = (s.legalAddress || s.address || '').toLowerCase();
      const userPhone = (s.user?.phone || '').toLowerCase();
      return name.includes(q) || taxId.includes(q) || address.includes(q) || userPhone.includes(q);
    }).slice(0, 8);
  }, [allSuppliers, searchQuery]);

  // Список уже выбранных объектов-поставщиков
  const selectedSuppliers = useMemo(() => {
    const idSet = new Set(invitedSupplierIds);
    return allSuppliers.filter(s => idSet.has(s.id));
  }, [allSuppliers, invitedSupplierIds]);

  // Поставщики, подходящие под категорию тендера
  const categoryMatchedSuppliers = useMemo(() => {
    if (!tenderCategoryId) return [];
    return allSuppliers.filter(s => {
      const cats = s.categories || [];
      return cats.some(c => c.categoryId === tenderCategoryId || c.category?.id === tenderCategoryId);
    });
  }, [allSuppliers, tenderCategoryId]);

  // Добавить одного поставщика
  const handleAddSupplier = (supplierId) => {
    if (!supplierId || invitedSupplierIds.includes(supplierId)) return;
    onChangeInvitedSuppliers([...invitedSupplierIds, supplierId]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Удалить поставщика из списка
  const handleRemoveSupplier = (supplierId) => {
    onChangeInvitedSuppliers(invitedSupplierIds.filter(id => id !== supplierId));
  };

  // Быстрое действие: пригласить всех поставщиков по выбранной категории тендера
  const handleAddAllFromCategory = () => {
    if (categoryMatchedSuppliers.length === 0) return;
    const newIds = categoryMatchedSuppliers.map(s => s.id);
    const combined = Array.from(new Set([...invitedSupplierIds, ...newIds]));
    onChangeInvitedSuppliers(combined);
  };

  const isClosed = visibility === 'YAPYK';
  const hasMinSuppliers = invitedSupplierIds.length >= 2;

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className={`block text-xs font-bold mb-2 ${theme?.subText || 'text-slate-600 dark:text-slate-300'}`}>
          {t('tenderVisibilityLabel', 'Режим доступа и конфиденциальности')} *
        </label>

        {/* Карточки-переключатели: Открытый vs Закрытый (Полная визуальная симметрия по дизайн-системе) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. Открытый тендер */}
          <button
            type="button"
            onClick={() => onChangeVisibility('ACYK')}
            className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
              !isClosed
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                !isClosed 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <Globe size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${!isClosed ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t('openTender', 'Открытый тендер')}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded transition-colors ${
                    !isClosed
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    Açyk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('openTenderDesc', 'Публичная закупка. Видна всем аккредитованным поставщикам в общем реестре.')}
                </p>
              </div>
              {!isClosed && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
          </button>

          {/* 2. Закрытый тендер */}
          <button
            type="button"
            onClick={() => onChangeVisibility('YAPYK')}
            className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
              isClosed
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                isClosed 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <Lock size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isClosed ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t('closedTender', 'Закрытый тендер')}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded transition-colors ${
                    isClosed
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    Ýapyk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('closedTenderDesc', 'Скрыт из общего каталога. Доступ только по персональному приглашению организатора.')}
                </p>
              </div>
              {isClosed && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Функциональная рабочая зона выбора участников (Data Picker) */}
      {isClosed && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 animate-in fade-in duration-300 shadow-2xs">
          {/* Верхняя панель заголовка селектора участников */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {t('invitedSuppliersTitle', 'Приглашенные поставщики')}
                  </h4>
                  {/* Индикатор соблюдения минимального пула участников (конкурентность) */}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                    hasMinSuppliers
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
                  }`}>
                    {hasMinSuppliers ? <Check size={11} strokeWidth={3} /> : <AlertCircle size={11} />}
                    <span>{invitedSupplierIds.length} / 2 {t('minRequired', 'мин.')}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('invitedSuppliersSubtitle', 'Только выбранные компании смогут увидеть ТЗ и подать коммерческое предложение')}
                </p>
              </div>
            </div>

            {/* Кнопка быстрого добавления из категории тендера (показывается только при наличии подходящих поставщиков) */}
            {categoryMatchedSuppliers.length > 0 && (
              <button
                type="button"
                onClick={handleAddAllFromCategory}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={t('addAllFromCategoryTooltip', 'Добавить всех проверенных поставщиков из выбранной категории тендера')}
              >
                <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('addAllFromCategory', 'Пригласить из категории')} ({categoryMatchedSuppliers.length})</span>
              </button>
            )}
          </div>

          {/* Информационная подсказка о требовании конкурентности */}
          {!hasMinSuppliers && (
            <div className="p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                {t('minTwoSuppliersNotice', 'По закону о закупках для закрытого тендера необходимо пригласить не менее 2 поставщиков для обеспечения конкурентной среды.')} ({invitedSupplierIds.length} {t('outOf', 'из')} 2)
              </span>
            </div>
          )}

          {/* Поле поиска поставщиков с автодополнением */}
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={t('searchSuppliersPlaceholder', 'Введите название компании, STŞK или город...')}
                className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Выпадающий список результатов поиска */}
            {isDropdownOpen && searchQuery.trim() && (
              <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {loadingSuppliers ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('loading', 'Загрузка поставщиков...')}
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('noSuppliersFound', 'По вашему запросу поставщиков не найдено')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSuppliers.map(supplier => {
                      const isAlreadyAdded = invitedSupplierIds.includes(supplier.id);
                      const parsed = parseSupplierName(supplier.name);
                      return (
                        <div
                          key={supplier.id}
                          onClick={() => {
                            if (!isAlreadyAdded) handleAddSupplier(supplier.id);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            isAlreadyAdded 
                              ? 'opacity-50 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                {parsed.opf && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shrink-0">
                                    {parsed.opf}
                                  </span>
                                )}
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {parsed.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>STŞK: {supplier.taxId || '—'}</span>
                                {supplier.legalAddress && <span className="font-sans truncate">· {supplier.legalAddress}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyAdded ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check size={13} /> {t('invitedBadge', 'Приглашен')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors">
                                <Plus size={13} /> {t('inviteAction', 'Пригласить')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Список выбранных поставщиков */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('selectedParticipants', 'Выбранные участники')} ({invitedSupplierIds.length})
              </span>
              {invitedSupplierIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeInvitedSuppliers([])}
                  className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                >
                  {t('clearAll', 'Очистить всех')}
                </button>
              )}
            </div>

            {invitedSupplierIds.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 text-center">
                <Users size={22} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t('noSuppliersInvitedTitle', 'Список участников закрытого тендера пуст')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {categoryMatchedSuppliers.length > 0
                    ? t('noSuppliersWithCatHint', 'Воспользуйтесь поиском выше по названию или коду STŞK, либо пригласите поставщиков из категории тендера.')
                    : t('noSuppliersNoCatHint', 'Найдите и добавьте минимум 2 поставщиков через строку поиска выше.')
                  }
                </p>
                {categoryMatchedSuppliers.length > 0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleAddAllFromCategory}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>{t('addAllFromCategoryAction', 'Пригласить всех из категории')} ({categoryMatchedSuppliers.length})</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedSuppliers.map(supplier => {
                  const parsed = parseSupplierName(supplier.name);
                  return (
                    <div
                      key={supplier.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs flex items-center gap-1 truncate" title={supplier.name}>
                            {parsed.opf && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-600 shrink-0">
                                {parsed.opf}
                              </span>
                            )}
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {parsed.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
                            STŞK: {supplier.taxId || '—'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSupplier(supplier.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                        title={t('removeSupplier', 'Удалить из списка')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
