import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = {
  RU: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ],
  TM: [
    'Ýanwar', 'Fewral', 'Mart', 'Aprel', 'Maý', 'Iýun',
    'Iýul', 'Awgust', 'Sentýabr', 'Oktýabr', 'Noýabr', 'Dekabr'
  ],
  EN: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
};

const DAY_NAMES = {
  RU: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  TM: ['Du', 'Si', 'Ça', 'Pe', 'An', 'Şe', 'Ýe'],
  EN: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
};

/**
 * Format Date object to YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse string (YYYY-MM-DD or ISO) to Date object safely
 */
export const parseDateString = (str) => {
  if (!str) return null;
  if (typeof str === 'string') {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format YYYY-MM-DD string to user-friendly DD.MM.YYYY
 */
export const formatDisplayDate = (str) => {
  if (!str) return '';
  const d = parseDateString(str);
  if (!d) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'ДД.ММ.ГГГГ',
  min,
  max,
  isDarkMode = false,
  lang = 'RU',
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  displayFormat = 'iso', // 'iso' (2026-09-15) or 'display' (15.09.2026)
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  const parsedValue = parseDateString(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Viewed year & month in calendar
  const [viewYear, setViewYear] = useState(() => (parsedValue ? parsedValue.getFullYear() : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (parsedValue ? parsedValue.getMonth() : today.getMonth()));

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync viewed year/month when value changes externally
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [value]);

  // Synchronous calculation of portal coordinates
  const calcCoords = () => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const popupWidth = 300;
    const popupHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < popupHeight && rect.top > popupHeight;

    let left = rect.left;
    if (left + popupWidth > window.innerWidth - 12) {
      left = window.innerWidth - popupWidth - 12;
    }
    left = Math.max(12, left);

    return {
      top: Math.round(openUpwards ? rect.top - popupHeight - 6 : rect.bottom + 6),
      left: Math.round(left),
      width: popupWidth,
    };
  };

  const updateCoords = () => {
    const nextCoords = calcCoords();
    if (nextCoords) {
      setCoords(nextCoords);
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      const nextCoords = calcCoords();
      if (nextCoords) {
        setCoords(nextCoords);
      }
      setIsOpen(true);
      setIsMonthSelectOpen(false);
    } else {
      setIsOpen(false);
      setIsMonthSelectOpen(false);
    }
  };

  // Ensure coords are freshly computed before browser paint if opened
  useLayoutEffect(() => {
    if (isOpen) {
      const nextCoords = calcCoords();
      if (nextCoords) {
        setCoords(nextCoords);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setIsMonthSelectOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsMonthSelectOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday is 0, Sunday is 6
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const minDate = min ? parseDateString(min) : null;
  const maxDate = max ? parseDateString(max) : null;

  const isDayDisabled = (d) => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const isSelected = (day) => {
    if (!parsedValue) return false;
    return (
      parsedValue.getFullYear() === viewYear &&
      parsedValue.getMonth() === viewMonth &&
      parsedValue.getDate() === day
    );
  };

  const isToday = (day) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const handleSelectDay = (day) => {
    const selected = new Date(viewYear, viewMonth, day);
    if (isDayDisabled(selected)) return;
    const isoString = formatDateToISO(selected);
    onChange(isoString);
    setIsOpen(false);
    setIsMonthSelectOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    if (isDayDisabled(today)) return;
    onChange(formatDateToISO(today));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setIsMonthSelectOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setIsMonthSelectOpen(false);
  };

  const currentLang = MONTH_NAMES[lang] ? lang : 'RU';
  const monthLabel = MONTH_NAMES[currentLang][viewMonth];
  const dayLabels = DAY_NAMES[currentLang];

  // Display text in input
  const formattedDisplay = value 
    ? (displayFormat === 'display' ? formatDisplayDate(value) : value)
    : '';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Trigger with unified design-system borders, hover and focus transitions */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleOpen();
          }
        }}
        className={`group w-full cursor-pointer flex justify-between items-center transition-all duration-150 rounded-lg text-xs select-none border ${
          size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } ${
          isDarkMode 
            ? 'bg-[#1f2937] text-slate-100 placeholder:text-slate-500 border-slate-700' 
            : 'bg-slate-50 text-slate-800 placeholder:text-slate-400 border-slate-200'
        } ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'hover:border-emerald-400 dark:hover:border-emerald-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <span className={`truncate font-medium ${!formattedDisplay ? 'opacity-50 text-slate-400' : 'text-slate-800 dark:text-slate-100 font-semibold'}`}>
          {formattedDisplay || placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {value && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title={getTranslation(lang, 'clearBtn', 'Очистить')}
            >
              <X size={13} />
            </span>
          )}
          <CalendarIcon
            size={14}
            className={`transition-colors ${
              isOpen 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
            }`}
          />
        </div>
      </div>

      {/* Popover Calendar with design system styling */}
      {isOpen && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className={`rounded-2xl border shadow-2xl p-3.5 select-none animate-in fade-in-50 zoom-in-95 duration-150 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700/90 shadow-black/70 text-slate-100' 
              : 'bg-white border-slate-200 shadow-slate-400/30 text-slate-800'
          }`}
        >
          {/* Calendar Header: Navigation & Month/Year selector */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="Предыдущий месяц"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{monthLabel} {viewYear}</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="Следующий месяц"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Month / Year Picker Mode */}
          {isMonthSelectOpen ? (
            <div className="py-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <button
                  type="button"
                  onClick={() => setViewYear(v => v - 1)}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  &laquo; {viewYear - 1}
                </button>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{viewYear}</span>
                <button
                  type="button"
                  onClick={() => setViewYear(v => v + 1)}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {viewYear + 1} &raquo;
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES[currentLang].map((mName, mIdx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(mIdx);
                      setIsMonthSelectOpen(false);
                    }}
                    className={`px-2 py-2 text-xs rounded-lg font-medium transition-all text-center cursor-pointer ${
                      viewMonth === mIdx
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {mName.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Day of week headers (Пн, Вт...) */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {dayLabels.map((dl, idx) => (
                  <div 
                    key={dl} 
                    className={`text-[11px] font-semibold py-1 ${
                      idx >= 5 ? 'text-rose-500/70 dark:text-rose-400/70' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {dl}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Padded previous month days */}
                {Array.from({ length: startingDayOfWeek }).map((_, idx) => {
                  const dayNum = daysInPrevMonth - startingDayOfWeek + idx + 1;
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="h-8 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 select-none pointer-events-none"
                    >
                      {dayNum}
                    </div>
                  );
                })}

                {/* Days in current month */}
                {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const daySelected = isSelected(dayNum);
                  const dayIsToday = isToday(dayNum);
                  const dayDisabled = isDayDisabled(new Date(viewYear, viewMonth, dayNum));

                  return (
                    <button
                      key={`curr-${dayNum}`}
                      type="button"
                      disabled={dayDisabled}
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 w-full rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                        daySelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 scale-102'
                          : dayIsToday
                            ? 'ring-1.5 ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300'
                      } ${dayDisabled ? 'opacity-25 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Footer: Quick actions */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer py-1 px-1.5 rounded"
                >
                  {getTranslation(lang, 'clearBtn', 'Очистить')}
                </button>
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition-colors cursor-pointer py-1 px-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  {getTranslation(lang, 'todayBtn', 'Сегодня')}
                </button>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
