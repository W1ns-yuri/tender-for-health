import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

export default function ProductSearchableSelect({
  products = [],
  value,
  generalProductId,
  onChange,
  onOpenCreateModal,
  placeholder,
  isDarkMode,
  theme,
  lang = 'RU',
  isDuplicate
}) {
  const t = (key, fallback, params) => getTranslation(lang, key, fallback, params);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: openUpwards ? (rect.top - dropdownHeight - 4) : (rect.bottom + 4),
        left: Math.max(10, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 320) - 10)),
        width: Math.max(rect.width, 320),
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.tradeName && p.tradeName.toLowerCase().includes(search.toLowerCase())) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedProduct = products.find(p => p.id === generalProductId) || 
    products.find(p => p.name === value || (p.tradeName && `${p.name} (${p.tradeName})` === value));

  const handleSelect = (product) => {
    const displayName = product.tradeName ? `${product.name} (${product.tradeName})` : product.name;
    onChange(displayName, product.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleOpenModalAndCloseDropdown = (initialName = '') => {
    setIsOpen(false);
    setSearch('');
    onOpenCreateModal(initialName);
  };

  const displaySelectedText = () => {
    if (selectedProduct) {
      return selectedProduct.tradeName 
        ? `${selectedProduct.name} (${selectedProduct.tradeName})` 
        : selectedProduct.name;
    }
    return value || placeholder;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-1">
        <div 
          onClick={() => {
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (nextState) {
              setSearch('');
              updateCoords();
            }
          }}
          className={`flex-1 px-2.5 py-1.5 rounded-md text-xs cursor-pointer flex justify-between items-center transition-all duration-150 font-medium ${
            isDuplicate
              ? 'border border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30'
              : `${theme?.inputBg || ''} ${isOpen ? '!border-emerald-500 !ring-2 !ring-emerald-500/25 shadow-xs' : ''}`
          }`}
        >
          <span className={`truncate ${!value && !selectedProduct ? 'opacity-50' : 'text-slate-800 dark:text-slate-100 font-semibold'}`}>
            {displaySelectedText()}
          </span>
          <ChevronDown size={14} className="opacity-50 shrink-0 ml-1" />
        </div>

        <button
          type="button"
          onClick={() => handleOpenModalAndCloseDropdown(search || '')}
          className="w-7 h-7 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title={t('createNewCatalogProduct', 'Создать новый товар в справочнике')}
        >
          <Plus size={13} />
        </button>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999,
          }}
          className={`rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-60 ${
            isDarkMode ? 'bg-[#151c28] border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              autoFocus
              className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${theme?.inputBg || ''}`}
              placeholder={t('searchProductPlaceholder', 'Поиск товара...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div
                  key={p.id}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-emerald-500/10 flex items-center justify-between gap-2 transition-colors ${
                    (generalProductId === p.id || value === p.name) ? 'bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-semibold text-xs leading-tight truncate">{p.name}</span>
                    {p.tradeName && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        {p.tradeName}
                      </span>
                    )}
                    {p.category?.name && (
                      <span className="text-[10px] text-slate-400 truncate">{p.category.name}</span>
                    )}
                  </div>
                  {p.code && <span className="text-[10px] text-slate-400 font-mono shrink-0">{p.code}</span>}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                {t('productNotFoundInCatalog', 'Товар не найден в справочнике')}
              </div>
            )}

            {search.trim().length > 0 && !filteredProducts.some(p => p.name.toLowerCase() === search.trim().toLowerCase()) && (
              <div
                className="p-2.5 text-xs bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 cursor-pointer font-bold flex items-center gap-2 border-t border-emerald-200/50 dark:border-emerald-800/50 transition-colors"
                onClick={() => handleOpenModalAndCloseDropdown(search.trim())}
              >
                <Plus size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">
                  {t('addToCatalogPrompt', `Добавить в справочник: "${search.trim()}"`, { query: search.trim() })}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
