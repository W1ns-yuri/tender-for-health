import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Lock, Search, Plus, X, Users, Check, Building2, Sparkles, AlertCircle } from 'lucide-react';
import API from '../../services/api';

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

  // Загружаем список поставщиков при монтировании
  useEffect(() => {
    let isMounted = true;
    setLoadingSuppliers(true);
    API.get('/suppliers')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          // Показываем активных/верифицированных поставщиков в первую очередь
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
    }).slice(0, 8); // Ограничиваем топ-8 для скорости и аккуратности
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

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className={`block text-xs font-bold mb-2 ${theme?.subText || 'text-slate-600 dark:text-slate-300'}`}>
          {t('tenderVisibilityLabel', 'Режим доступа и конфиденциальности')} *
        </label>

        {/* Карточки-переключатели: Открытый vs Закрытый */}
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
              <div className={`p-2.5 rounded-xl shrink-0 ${
                !isClosed 
                  ? 'bg-emerald-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <Globe size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${!isClosed ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t('openTender', 'Открытый тендер')}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Açyk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('openTenderDesc', 'Публичная закупка. Видна всем аккредитованным поставщикам в общем реестре.')}
                </p>
              </div>
              {!isClosed && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
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
                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isClosed 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <Lock size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isClosed ? 'text-amber-950 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t('closedTender', 'Закрытый тендер')}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    Ýapyk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('closedTenderDesc', 'Скрыт из общего каталога. Доступ только по персональному приглашению.')}
                </p>
              </div>
              {isClosed && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Блок выбора поставщиков (плавно открывается, только если выбран закрытый тендер) */}
      {isClosed && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t('invitedSuppliersTitle', 'Приглашенные поставщики')}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('invitedSuppliersSubtitle', 'Только выбранные компании смогут увидеть ТЗ и подать заявку')}
                </p>
              </div>
            </div>

            {/* Быстрая кнопка подтягивания поставщиков из категории тендера */}
            {categoryMatchedSuppliers.length > 0 && (
              <button
                type="button"
                onClick={handleAddAllFromCategory}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-amber-300/60 dark:border-amber-700/60"
                title={t('addAllFromCategoryTooltip', 'Добавить всех проверенных поставщиков из выбранной категории тендера')}
              >
                <Sparkles size={13} />
                <span>{t('addAllFromCategory', 'Пригласить из категории')} ({categoryMatchedSuppliers.length})</span>
              </button>
            )}
          </div>

          {/* Поле поиска с автодополнением */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={t('searchSuppliersPlaceholder', 'Введите название компании, ИНН / STŞK или город...')}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
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
                      return (
                        <div
                          key={supplier.id}
                          onClick={() => {
                            if (!isAlreadyAdded) handleAddSupplier(supplier.id);
                          }}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            isAlreadyAdded 
                              ? 'opacity-50 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed' 
                              : 'hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {supplier.name}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {supplier.taxId && <span>ИНН: {supplier.taxId}</span>}
                                {supplier.legalAddress && <span className="truncate">· {supplier.legalAddress}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyAdded ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check size={13} /> {t('invitedBadge', 'Приглашен')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center gap-1">
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

          {/* Список уже выбранных поставщиков */}
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
              <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-white/60 dark:bg-slate-900/40 text-center">
                <AlertCircle size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {t('noSuppliersInvitedWarn', 'В закрытом тендере пока не выбрано ни одного поставщика')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('noSuppliersInvitedHint', 'Воспользуйтесь поиском выше или нажмите «Пригласить из категории»')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Building2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={supplier.name}>
                          {supplier.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {supplier.taxId ? `ИНН: ${supplier.taxId}` : (supplier.legalAddress || '—')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSupplier(supplier.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title={t('removeSupplier', 'Удалить из списка')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
