import React from 'react';
import { Check, Clock, FileCheck, Award, FileSignature, AlertOctagon } from 'lucide-react';

export default function TenderDetailsStepper({
  status,
  lifecycleStep,
  theme,
  isDarkMode,
  t,
}) {
  const isCancelled = String(status || '').toUpperCase().includes('GOYBOLSUN') || String(status || '').toUpperCase().includes('CANCEL');

  const steps = [
    {
      num: 1,
      title: t('lifecycleStep1', 'Публикация'),
      desc: t('lifecycleStep1Desc', 'Параметры и лоты'),
      icon: FileCheck,
    },
    {
      num: 2,
      title: t('lifecycleStep2', 'Прием заявок'),
      desc: t('lifecycleStep2Desc', 'Подача КП участниками'),
      icon: Clock,
    },
    {
      num: 3,
      title: t('lifecycleStep3', 'Оценка заявок'),
      desc: t('lifecycleStep3Desc', 'Вскрытие и экспертиза'),
      icon: Clock,
    },
    {
      num: 4,
      title: t('lifecycleStep4', 'Победитель'),
      desc: t('lifecycleStep4Desc', 'Протокол комиссии'),
      icon: Award,
    },
    {
      num: 5,
      title: t('lifecycleStep5', 'Контракт'),
      desc: t('lifecycleStep5Desc', 'Подписание и поставка'),
      icon: FileSignature,
    },
  ];

  if (isCancelled) {
    return (
      <div className={`p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-center gap-3 text-rose-700 dark:text-rose-300`}>
        <AlertOctagon size={22} className="shrink-0 text-rose-600" />
        <div>
          <span className="font-bold text-sm">{t('tenderCancelledTitle', 'Процедура закупки отменена')}</span>
          <p className="text-xs text-rose-600/90 dark:text-rose-400 mt-0.5">
            {t('tenderCancelledDesc', 'Тендер переведен в статус аннулированного. Прием и рассмотрение коммерческих предложений прекращены.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-xl border shadow-2xs ${theme.cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('tenderLifecycleTitle', 'Жизненный цикл процедуры')}
        </h4>
        <span className="text-[11px] font-bold text-slate-400">
          {t('stepNumberLabel', 'Этап')} {lifecycleStep} {t('outOf', 'из')} 5
        </span>
      </div>

      {/* Горизонтальный адаптивный степпер */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center justify-between min-w-[560px] sm:min-w-0">
          {steps.map((step, idx) => {
            const isCompleted = lifecycleStep > step.num;
            const isCurrent = lifecycleStep === step.num;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center flex-1 text-center group">
                  {/* Иконка / Кругляшок шага */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-900/50 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>

                  {/* Название шага */}
                  <span
                    className={`text-xs font-bold mt-2 transition-colors ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>

                  {/* Подпись */}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                    {step.desc}
                  </span>
                </div>

                {/* Соединительная линия */}
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 -mt-7 transition-all duration-300 ${
                      lifecycleStep > step.num
                        ? 'bg-emerald-500 dark:bg-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
