import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Universal CustomSelect component with Portal rendering (won't get clipped by overflow-hidden).
 * Supports:
 * - Admin (Emerald) and Supplier (Blue) role-based accent themes
 * - Light and Dark modes
 * - Searchable filtering
 * - Array of objects ({ id, name }, { value, label }, etc.) or plain strings
 * - Children `<option>` auto-extraction for drop-in replacement
 * - Dropdown auto-positioning (flips up if near bottom)
 * - Clearable selection reset with X icon and Not Selected option
 */
export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  isDarkMode,
  theme,
  role = 'ADMIN', // 'ADMIN' | 'SUPPLIER'
  searchable = false,
  clearable = true,
  t,
  size = 'md', // 'md' | 'sm' | 'xs'
  className = '',
  disabled = false,
  children,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  const isDark = isDarkMode !== undefined 
    ? isDarkMode 
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  
  const isSupplier = role === 'SUPPLIER';

  // If children <option> elements are passed, parse them
  let resolvedOptions = options;
  if ((!resolvedOptions || resolvedOptions.length === 0) && children) {
    resolvedOptions = React.Children.toArray(children)
      .filter(child => React.isValidElement(child) && (child.type === 'option' || child.props?.value !== undefined))
      .map(child => ({
        id: child.props.value !== undefined ? child.props.value : child.props.children,
        name: child.props.children || child.props.label || String(child.props.value)
      }));
  }

  const normalizedOptions = (resolvedOptions || []).map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      const id = opt.id !== undefined ? opt.id : (opt.value !== undefined ? opt.value : opt.code);
      const name = opt.name !== undefined ? opt.name : (opt.label !== undefined ? opt.label : (opt.title ?? opt.code ?? String(id)));
      return { id, name };
    }
    return { id: opt, name: String(opt) };
  });

  const isSearchEnabled = Boolean(searchable || normalizedOptions.length > 5);

  const updateCoords = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(280, Math.max(80, normalizedOptions.length * 36 + (isSearchEnabled ? 48 : 0)));
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 210 && rect.top > 210;

      const minW = Math.max(rect.width, 220);
      let left = rect.left;
      if (left + minW > window.innerWidth - 10) {
        left = window.innerWidth - minW - 10;
      }
      left = Math.max(10, left);

      setCoords({
        top: openUpwards ? (rect.top - dropdownHeight - 4) : (rect.bottom + 4),
        left,
        width: Math.max(rect.width, minW),
        maxHeight: dropdownHeight,
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = (e) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
        updateCoords();
      };
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter(opt =>
    (opt.name || '').toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedOption = normalizedOptions.find(opt => String(opt.id) === String(value));

  const handleSelect = (optId) => {
    if (disabled) return;
    setIsOpen(false);
    setSearch('');
    if (onChange) {
      const syntheticEvent = {
        target: { value: optId, name },
        currentTarget: { value: optId, name },
        value: optId
      };
      onChange(optId, syntheticEvent);
    }
  };

  // Base background and border styling
  const defaultInputBg = isDark
    ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 hover:border-slate-600'
    : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs';

  const triggerInputStyle = theme?.inputBg || defaultInputBg;

  const activeFocusStyle = isSupplier
    ? '!border-blue-500 !ring-2 !ring-blue-500/25 shadow-xs'
    : '!border-emerald-500 !ring-2 !ring-emerald-500/25 shadow-xs';

  const sizePadding = size === 'xs'
    ? 'px-2 py-1 text-[11px]'
    : size === 'sm'
    ? 'px-2.5 py-1.5 text-xs'
    : 'px-3 py-2 text-xs sm:text-sm';

  return (
    <div ref={wrapperRef} className={`relative inline-block w-full ${className}`}>
      <div
        onClick={() => {
          if (disabled) return;
          const next = !isOpen;
          if (next) {
            setSearch('');
            updateCoords();
          }
          setIsOpen(next);
        }}
        className={`w-full cursor-pointer flex justify-between items-center transition-all duration-150 rounded-xl ${size === 'md' ? 'h-10 min-h-[40px]' : ''} ${sizePadding} ${triggerInputStyle} ${
          isOpen ? activeFocusStyle : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50' : ''}`}
      >
        <span className={`truncate mr-1.5 ${!selectedOption ? 'opacity-50 text-slate-400' : 'font-medium'}`}>
          {selectedOption ? selectedOption.name : (placeholder || (t ? t('selectPrompt', 'Выберите...') : '—'))}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('');
              }}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              title={t ? t('clearSelection', 'Сбросить выбор') : 'Сбросить выбор'}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown 
            size={size === 'xs' ? 12 : 14} 
            className={`opacity-50 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {isOpen && coords.width > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight || 260}px`,
            zIndex: 999999,
          }}
          className={`rounded-xl border shadow-2xl ${
            isDark 
              ? 'border-slate-700 bg-slate-900 shadow-black/70 text-slate-100' 
              : 'border-slate-200 bg-white shadow-slate-400/40 text-slate-800'
          } flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100`}
        >
          {isSearchEnabled && (
            <div className={`p-2 border-b flex items-center gap-1.5 ${isDark ? 'border-slate-800 bg-slate-800/60' : 'border-slate-100 bg-slate-50/70'}`}>
              <Search size={13} className="text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                className={`w-full px-2 py-1 rounded-md text-xs bg-transparent border-0 focus:outline-none ${
                  isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
                }`}
                placeholder={t ? t('search', 'Поиск...') : 'Поиск...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto overscroll-contain flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 select-none">
            {clearable && value && (
              <div
                className="px-3 py-2 text-xs cursor-pointer flex items-center justify-between text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 italic border-b border-dashed border-slate-200 dark:border-slate-800"
                onClick={() => handleSelect('')}
              >
                <span>— {t ? t('notSelected', 'Не выбрано (сбросить)') : 'Не выбрано (сбросить)'} —</span>
                <X size={12} className="opacity-60" />
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = String(value) === String(opt.id);
                const selectedClass = isSelected
                  ? (isSupplier 
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold' 
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold')
                  : (isSupplier
                      ? 'hover:bg-blue-500/10 text-slate-700 dark:text-slate-200'
                      : 'hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200');
                
                return (
                  <div
                    key={String(opt.id)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${selectedClass}`}
                    onClick={() => handleSelect(opt.id)}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && (
                      <Check 
                        size={13} 
                        className={`font-bold ml-1.5 shrink-0 ${
                          isSupplier ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`} 
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-3 text-xs text-center opacity-50">
                {t ? t('noResults', 'Нет совпадений') : 'Нет совпадений'}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
