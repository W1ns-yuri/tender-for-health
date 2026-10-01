import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X, Check, Plus, Pill, Search } from 'lucide-react';
import API from '../services/api';

/**
 * MnnCombobox - Интерактивный комбобокс для выбора Международного непатентованного наименования (МНН).
 * Позволяет:
 * 1. Выбрать существующее МНН из архива/каталога (с отображением связанных препаратов и торговых названий).
 * 2. Ввести и создать совершенно новое МНН, если нужного вещества еще нет в базе.
 * 3. Искать как по названию МНН (кислота), так и по торговым наименованиям (аспирин).
 */
export default function MnnCombobox({
  value = '',
  onChange,
  existingProducts = [],
  isDarkMode = false,
  role = 'ADMIN',
  theme,
  t,
  required = true,
  placeholder = 'Выберите МНН из архива или введите новое...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [mnnList, setMnnList] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Синхронизация внешнего value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Загрузка уникальных МНН
  useEffect(() => {
    let isMounted = true;

    // Если переданы existingProducts, можем сразу построить список
    if (existingProducts && existingProducts.length > 0) {
      const map = new Map();
      existingProducts.forEach(p => {
        const name = (p.name || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name,
            count: 0,
            tradeNames: [],
            categoryId: p.categoryId,
            categoryName: p.category?.name
          });
        }
        const item = map.get(key);
        item.count += 1;
        if (p.tradeName && !item.tradeNames.includes(p.tradeName.trim())) {
          item.tradeNames.push(p.tradeName.trim());
        }
        if (!item.categoryId && p.categoryId) {
          item.categoryId = p.categoryId;
          item.categoryName = p.category?.name;
        }
      });
      setMnnList(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      // Иначе запрашиваем эндпоинт /catalogs/mnn
      setLoading(true);
      API.get('/catalogs/mnn')
        .then(res => {
          if (isMounted && Array.isArray(res.data)) {
            setMnnList(res.data);
          }
        })
        .catch(err => {
          console.error('Ошибка загрузки списка МНН:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [existingProducts]);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация вариантов по поисковому запросу
  const filteredMnn = useMemo(() => {
    const q = (inputValue || '').toLowerCase().trim();
    if (!q) return mnnList;

    return mnnList.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchTrade = item.tradeNames?.some(tn => tn.toLowerCase().includes(q));
      return matchName || matchTrade;
    });
  }, [mnnList, inputValue]);

  // Проверка, есть ли точное совпадение
  const exactMatch = useMemo(() => {
    const q = (inputValue || '').toLowerCase().trim();
    if (!q) return null;
    return mnnList.find(item => item.name.toLowerCase() === q);
  }, [mnnList, inputValue]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectMnn = (item) => {
    setInputValue(item.name);
    onChange(item.name, item.categoryId);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  const inputBg = isDarkMode 
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
    : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  const dropdownBg = isDarkMode
    ? 'bg-slate-900 border-slate-700 shadow-slate-950/60 text-slate-200'
    : 'bg-white border-slate-200 shadow-xl text-slate-800';

  const isSupplier = role === 'SUPPLIER';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required={required}
          placeholder={placeholder}
          className={`w-full pl-3 pr-16 py-2 text-sm border rounded-lg outline-none transition-all ${
            isSupplier
              ? 'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
              : 'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
          } ${inputBg}`}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              title={t ? t('clear', 'Очистить') : 'Очистить'}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className={`p-1.5 rounded-md text-slate-400 transition-colors ${
              isSupplier ? 'hover:text-blue-600 dark:hover:text-blue-400' : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            title={t ? t('showAllMNN', 'Показать все МНН') : 'Показать все МНН'}
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? (isSupplier ? 'rotate-180 text-blue-600' : 'rotate-180 text-emerald-600') : ''}`} />
          </button>
        </div>
      </div>

      {/* Выпадающий список архивных МНН */}
      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border shadow-xl ${dropdownBg} animate-in fade-in-50 zoom-in-95 duration-150`}>
          {/* Заголовок выпадающего списка */}
          <div className="sticky top-0 z-10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Pill size={12} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />
              <span>{t ? t('archiveMNN', 'Архив веществ (МНН)') : 'Архив веществ (МНН)'} ({mnnList.length})</span>
            </span>
            {loading && <span className={`text-[10px] animate-pulse ${isSupplier ? 'text-blue-500' : 'text-emerald-500'}`}>{t ? t('loading', 'Загрузка...') : 'Загрузка...'}</span>}
          </div>

          <div className="p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMnn.length > 0 ? (
              filteredMnn.map((item, idx) => {
                const isSelected = item.name.toLowerCase() === (inputValue || '').toLowerCase().trim();
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectMnn(item)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors text-xs flex flex-col gap-0.5 ${
                      isSelected 
                        ? (isSupplier
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold')
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm leading-tight">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.count > 0 && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                            isSupplier
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {item.count} {item.count === 1 ? 'препарат' : 'препаратов'}
                          </span>
                        )}
                        {isSelected && <Check size={14} className={`${isSupplier ? 'text-blue-600' : 'text-emerald-600'} shrink-0 ml-1`} />}
                      </div>
                    </div>

                    {/* Связанные торговые названия */}
                    {item.tradeNames && item.tradeNames.length > 0 && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="font-medium text-slate-400 dark:text-slate-500 mr-1">Торговые:</span>
                        {item.tradeNames.join(', ')}
                      </div>
                    )}

                    {/* Категория если есть */}
                    {item.categoryName && (
                      <div className={`text-[10px] truncate ${isSupplier ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                        {item.categoryName}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                {t ? t('noMNNMatches', 'Совпадений в архиве МНН не найдено') : 'Совпадений в архиве МНН не найдено'}
              </div>
            )}

            {/* Возможность создать новое МНН */}
            {inputValue.trim().length > 0 && !exactMatch && (
              <div
                onClick={() => {
                  onChange(inputValue.trim());
                  setIsOpen(false);
                }}
                className={`p-2.5 mt-1 rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-2 border border-dashed transition-colors ${
                  isSupplier
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                }`}
              >
                <Plus size={14} className={`shrink-0 ${isSupplier ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span className="truncate">
                  {t ? t('useNewMNN', `Использовать новое МНН: "${inputValue.trim()}"`) : `Использовать новое МНН: "${inputValue.trim()}"`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
