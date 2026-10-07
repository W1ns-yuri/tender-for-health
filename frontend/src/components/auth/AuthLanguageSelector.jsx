import React, { useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

export default function AuthLanguageSelector({
  lang,
  setLang,
  isOpen,
  setIsOpen,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const languages = [
    { code: 'RU', label: 'Русский' },
    { code: 'TM', label: 'Türkmençe' },
    { code: 'EN', label: 'English' },
  ];

  const currentLabel = languages.find((l) => l.code === lang)?.label || 'Русский';

  return (
    <div ref={containerRef} className="absolute top-6 right-6 sm:top-8 sm:right-12 z-40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 shadow-xs cursor-pointer"
        aria-expanded={isOpen}
      >
        <Globe size={16} className="text-blue-500" />
        <span>{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-38 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                lang === l.code
                  ? 'text-blue-600 bg-blue-50/70 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
