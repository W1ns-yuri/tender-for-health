import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuthShowcase({
  illustrations,
  activeIndex,
  onSelectIndex,
  t,
}) {
  const currentIll = illustrations[activeIndex] || illustrations[0];

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + illustrations.length) % illustrations.length;
    onSelectIndex(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % illustrations.length;
    onSelectIndex(nextIdx);
  };

  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50/50 flex-col items-center justify-center p-8 xl:p-12 overflow-hidden select-none">
      {/* Логотип платформы в верхнем левом углу */}
      <div className="absolute top-8 left-8 sm:top-8 sm:left-12 flex items-center gap-3 z-30">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
          TU
        </div>
        <span className="font-extrabold text-slate-800 text-xl tracking-tight">Tender Ulgam</span>
      </div>

      {/* Фоновый декоративный градиент */}
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-blue-100/40 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-125 mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 mt-8">
        {/* Интерактивный постер иллюстрации */}
        <div className="w-full bg-white p-3 rounded-4xl shadow-xl shadow-slate-200/60 border border-white mb-8 relative overflow-hidden flex flex-col items-center justify-center group">
          <div className="w-full relative overflow-hidden rounded-3xl bg-slate-50">
            <img
              src={currentIll.src}
              alt={t(currentIll.titleKey, currentIll.defaultTitle)}
              className="w-full h-auto object-cover rounded-3xl relative z-0 transition-all duration-300"
            />

            {/* Кнопка: Предыдущая иллюстрация */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 rounded-full shadow-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-105 cursor-pointer z-20"
              title={t('prevVariantBtn', 'Предыдущий вариант')}
              aria-label={t('prevVariantBtn', 'Предыдущий вариант')}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Кнопка: Следующая иллюстрация */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 rounded-full shadow-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-105 cursor-pointer z-20"
              title={t('nextVariantBtn', 'Следующий вариант')}
              aria-label={t('nextVariantBtn', 'Следующий вариант')}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Индикатор вариантов */}
          <div className="w-full pt-2.5 pb-0.5 px-2 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 text-[11px] truncate max-w-70">
              {t(currentIll.tagKey, currentIll.defaultTag)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {illustrations.map((ill, i) => (
                <button
                  key={ill.id}
                  type="button"
                  onClick={() => onSelectIndex(i)}
                  title={t(ill.titleKey, ill.defaultTitle)}
                  aria-label={t(ill.titleKey, ill.defaultTitle)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeIndex === i
                      ? 'w-6 bg-blue-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Заголовок и презентационный текст */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            {t('loginHeadline1', 'Упростите взаимодействие')}<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-emerald-500">
              {t('loginHeadline2', 'в сфере закупок')}
            </span>
          </h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-base xl:text-lg leading-relaxed">
            {t('loginTagline', 'Единая цифровая платформа для заказчиков и поставщиков. Эффективно, прозрачно, безопасно.')}
          </p>
        </div>
      </div>
    </div>
  );
}
