import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Lock, Search, Plus, X, Users, Check, Building2, Sparkles, Trash2 } from 'lucide-react';
import API from '../../services/api';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableEmptyState
} from '../ui/Table';

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

  // Фильтрация поставщиков для выпадающего поиска с разделением по категориям закупки
  const { matchedSuppliers, unmatchedSuppliers } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matchedSuppliers: [], unmatchedSuppliers: [] };

    const searchResults = allSuppliers.filter(s => {
      const name = (s.name || '').toLowerCase();
      const taxId = (s.taxId || '').toLowerCase();
      const address = (s.legalAddress || s.address || '').toLowerCase();
      const userPhone = (s.user?.phone || '').toLowerCase();
      const catNames = (s.categories || []).map(c => (c.category?.name || '').toLowerCase()).join(' ');
      return name.includes(q) || taxId.includes(q) || address.includes(q) || userPhone.includes(q) || catNames.includes(q);
    });

    if (!tenderCategoryId) {
      return { matchedSuppliers: searchResults.slice(0, 10), unmatchedSuppliers: [] };
    }

    const matched = [];
    const unmatched = [];
    searchResults.forEach(s => {
      const hasCat = (s.categories || []).some(c => c.categoryId === tenderCategoryId || c.category?.id === tenderCategoryId);
      if (hasCat) {
        matched.push(s);
      } else {
        unmatched.push(s);
      }
    });

    return {
      matchedSuppliers: matched.slice(0, 8),
      unmatchedSuppliers: unmatched.slice(0, 8)
    };
  }, [allSuppliers, searchQuery, tenderCategoryId]);

  const totalFilteredCount = matchedSuppliers.length + unmatchedSuppliers.length;

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
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('invitedSuppliersTitle', 'Приглашенные поставщики')}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('invitedSuppliersSubtitle', 'Только выбранные компании смогут увидеть ТЗ и подать заявку')}
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
              <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                {loadingSuppliers ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('loading', 'Загрузка поставщиков...')}
                  </div>
                ) : totalFilteredCount === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('noSuppliersFound', 'По вашему запросу поставщиков не найдено')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* 1. Поставщики, подходящие по категории */}
                    {matchedSuppliers.map(supplier => {
                      const isAlreadyAdded = invitedSupplierIds.includes(supplier.id);
                      const parsed = parseSupplierName(supplier.name);
                      const cats = supplier.categories || [];
                      return (
                        <div
                          key={supplier.id}
                          onClick={() => {
                            if (!isAlreadyAdded) handleAddSupplier(supplier.id);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            isAlreadyAdded 
                              ? 'opacity-50 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed' 
                              : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60 dark:border-emerald-800/50">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {parsed.opf && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shrink-0">
                                    {parsed.opf}
                                  </span>
                                )}
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {parsed.name}
                                </span>
                                {tenderCategoryId && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0 flex items-center gap-1">
                                    <Sparkles size={10} /> {t('categoryMatchBadge', 'Подходит по категории')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>STŞK: {supplier.taxId || '—'}</span>
                                {supplier.legalAddress && <span className="font-sans truncate">· {supplier.legalAddress}</span>}
                              </div>
                              {cats.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {cats.slice(0, 3).map((c, cIdx) => (
                                    <span key={c.categoryId || c.id || cIdx} className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      {c.category?.name || c.name}
                                    </span>
                                  ))}
                                  {cats.length > 3 && (
                                    <span className="text-[9px] text-slate-400 font-mono">+{cats.length - 3}</span>
                                  )}
                                </div>
                              )}
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

                    {/* Разделитель между подходящими и другими поставщиками */}
                    {matchedSuppliers.length > 0 && unmatchedSuppliers.length > 0 && (
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/90 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span>{t('otherSuppliersOutOfCategory', 'Другие поставщики (вне выбранной категории)')}</span>
                        <span className="font-mono text-[9px] lowercase font-normal">{unmatchedSuppliers.length}</span>
                      </div>
                    )}

                    {/* 2. Поставщики вне выбранной категории (более приглушенные) */}
                    {unmatchedSuppliers.map(supplier => {
                      const isAlreadyAdded = invitedSupplierIds.includes(supplier.id);
                      const parsed = parseSupplierName(supplier.name);
                      const cats = supplier.categories || [];
                      return (
                        <div
                          key={supplier.id}
                          onClick={() => {
                            if (!isAlreadyAdded) handleAddSupplier(supplier.id);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            isAlreadyAdded 
                              ? 'opacity-40 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed' 
                              : 'opacity-85 hover:opacity-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 cursor-pointer bg-slate-50/40 dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {parsed.opf && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/70 dark:border-slate-700 shrink-0">
                                    {parsed.opf}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {parsed.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>STŞK: {supplier.taxId || '—'}</span>
                                {supplier.legalAddress && <span className="font-sans truncate">· {supplier.legalAddress}</span>}
                              </div>
                              {cats.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {cats.slice(0, 3).map((c, cIdx) => (
                                    <span key={c.categoryId || c.id || cIdx} className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                      {c.category?.name || c.name}
                                    </span>
                                  ))}
                                  {cats.length > 3 && (
                                    <span className="text-[9px] text-slate-400 font-mono">+{cats.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyAdded ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check size={13} /> {t('invitedBadge', 'Приглашен')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors">
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

          {/* Список выбранных поставщиков в виде стандартной таблицы UI Kit */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('selectedParticipants', 'Выбранные участники')} ({invitedSupplierIds.length})
              </span>
              {invitedSupplierIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeInvitedSuppliers([])}
                  className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium hover:underline cursor-pointer"
                >
                  {t('clearAll', 'Очистить всех')}
                </button>
              )}
            </div>

            <TableContainer className="border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell align="center" className="w-12">
                      №
                    </TableHeaderCell>
                    <TableHeaderCell className="min-w-48">
                      {t('companyName', 'Наименование компании')}
                    </TableHeaderCell>
                    <TableHeaderCell className="w-32">
                      {t('taxId', 'STŞK')}
                    </TableHeaderCell>
                    <TableHeaderCell className="min-w-44">
                      {t('categories', 'Категории')}
                    </TableHeaderCell>
                    <TableHeaderCell className="min-w-40">
                      {t('legalAddress', 'Город / Юр. адрес')}
                    </TableHeaderCell>
                    <TableHeaderCell align="center" className="w-20">
                      {t('action', 'Действие')}
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitedSupplierIds.length === 0 ? (
                    <TableEmptyState
                      colSpan={6}
                      title={t('noSuppliersInvitedTitle', 'Список участников закрытого тендера пуст')}
                      description={t('noSuppliersInvitedHint', 'Воспользуйтесь поиском выше для выбора поставщиков.')}
                      icon={<Users size={24} />}
                      action={categoryMatchedSuppliers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAddAllFromCategory}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} />
                          <span>{t('addAllFromCategoryAction', 'Пригласить всех из категории')} ({categoryMatchedSuppliers.length})</span>
                        </button>
                      )}
                    />
                  ) : (
                    selectedSuppliers.map((supplier, idx) => {
                      const parsed = parseSupplierName(supplier.name);
                      const cats = supplier.categories || [];
                      return (
                        <TableRow key={supplier.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          {/* № */}
                          <TableCell align="center" className="font-mono text-xs font-bold text-slate-400">
                            {idx + 1}
                          </TableCell>

                          {/* Наименование компании */}
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                                <Building2 size={14} />
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                {parsed.opf && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shrink-0 uppercase tracking-wide">
                                    {parsed.opf}
                                  </span>
                                )}
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate" title={supplier.name}>
                                  {parsed.name}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* STŞK */}
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {supplier.taxId || '—'}
                          </TableCell>

                          {/* Категории участника */}
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-60">
                              {cats.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">—</span>
                              ) : (
                                <>
                                  {cats.slice(0, 2).map((sc, scIdx) => {
                                    const catName = sc.category?.name || sc.name;
                                    const isMatch = tenderCategoryId && (sc.categoryId === tenderCategoryId || sc.category?.id === tenderCategoryId);
                                    return (
                                      <span
                                        key={sc.categoryId || sc.id || scIdx}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-32.5 ${
                                          isMatch
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                        }`}
                                        title={catName}
                                      >
                                        {catName}
                                      </span>
                                    );
                                  })}
                                  {cats.length > 2 && (
                                    <span 
                                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                                      title={cats.slice(2).map(sc => sc.category?.name || sc.name).join(', ')}
                                    >
                                      +{cats.length - 2}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* Город / Юр. адрес */}
                          <TableCell className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" title={supplier.legalAddress || supplier.address || ''}>
                            {supplier.legalAddress || supplier.address || '—'}
                          </TableCell>

                          {/* Действие: Удалить */}
                          <TableCell align="center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSupplier(supplier.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center justify-center"
                              title={t('removeSupplier', 'Удалить из списка')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      )}
    </div>
  );
}
