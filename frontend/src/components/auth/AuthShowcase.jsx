import React from 'react';

// Раньше здесь была карусель «Вариант 1 (В стиле оригинала)… Вариант 7» — остаток выбора дизайна.
// Пользователю показываем одну иллюстрацию без подписей-вариантов.
export default function AuthShowcase({ illustrations, activeIndex, t }) {
  const currentIll = illustrations[activeIndex] || illustrations[0];

  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-slate-100 flex-col items-center justify-center p-8 xl:p-12 overflow-hidden select-none">
      {/* Логотип платформы в верхнем левом углу */}
      <div className="absolute top-8 left-8 sm:top-8 sm:left-12 flex items-center gap-3 z-30">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xl">
          TU
        </div>
        <span className="font-extrabold text-slate-800 text-xl tracking-tight">Tender Ulgam</span>
      </div>


      <div className="relative z-10 w-full max-w-125 mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 mt-8">
        {/* Интерактивный постер иллюстрации */}
        <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 mb-8 relative overflow-hidden flex flex-col items-center justify-center group">
          <div className="w-full relative overflow-hidden rounded-3xl bg-slate-50">
            <img
              src={currentIll.src}
              alt={t(currentIll.titleKey, currentIll.defaultTitle)}
              className="w-full h-auto object-cover rounded-3xl relative z-0 transition-all duration-300"
            />
          </div>
        </div>

        {/* Заголовок и презентационный текст */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            {t('loginHeadline1', 'Упростите взаимодействие')}<br />
            <span className="text-emerald-700">
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
