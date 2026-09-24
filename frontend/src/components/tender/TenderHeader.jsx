import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, AlertCircle, FilePlus2, FolderGit2 } from 'lucide-react';
import { IconBox } from '../ui';

export default function TenderHeader({
  tenderId,
  formData,
  activeTopTab = 'params',
  setActiveTopTab,
  canPublish,
  publishing,
  publishDisabledReason,
  onPublishTender,
  errorMsg,
  theme,
  t = (k, f) => f
}) {
  const navigate = useNavigate();

  // Mini-stepper logic
  const stepConfig = {
    params: {
      step: 1,
      label: t('tabGeneralParams', 'Параметры закупки'),
      subtitle: t('paramsStepSubtitle', 'Шаг 1: Основные реквизиты, сроки и классификаторы закупки'),
      percent: 33
    },
    lots: {
      step: 2,
      label: t('tabLotsSpecs', 'Лоты и спецификации'),
      subtitle: t('lotsStepSubtitle', 'Шаг 2: Спецификации, параметры лотов и требования к поставке'),
      percent: 66
    },
    docs: {
      step: 3,
      label: t('tabGeneralDocs', 'Общие документы'),
      subtitle: t('docsStepSubtitle', 'Шаг 3: Прикрепление общей документации и регламентов'),
      percent: 100
    }
  };

  const currentStepInfo = stepConfig[activeTopTab] || stepConfig.params;

  return (
    <div className="space-y-4">
      {/* 🟢 ИНФОРМАТИВНАЯ КАРТОЧКА С МИНИ-СТЕППЕРОМ ПРОГРЕССА */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${theme?.cardBg || 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800'}`}>
        {/* Левая часть: Строгая SVG-иконка, номер, статус и динамический заголовок */}
        <div className="flex items-center gap-3.5 min-w-0">
          <IconBox
            variant="emerald"
            size="lg"
            className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/80 shadow-xs shrink-0"
          >
            {tenderId ? <FolderGit2 size={22} /> : <FilePlus2 size={22} />}
          </IconBox>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black tracking-wide border border-emerald-500/20">
                {formData.tenderNumber || 'TNDR-NEW'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                formData.status === 'TASLAMA' 
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}>
                {formData.status === 'TASLAMA' ? t('draftStatusBadge', 'Черновик (Taslama)') : t('statusAcyk', 'Открыт (Açyk)')}
              </span>
            </div>

            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mt-1 truncate">
              {formData.title?.trim() || t('newTenderTitle', 'Новый тендер')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {currentStepInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Правая часть: Мини-степпер прогресса и кнопки управления */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
          {/* Мини-степпер прогресса (заполняет пустоту справа) */}
          <div className="w-full sm:w-68 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                {t('stepLabel', 'Шаг')} {currentStepInfo.step} {t('ofThree', 'из 3')}:{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentStepInfo.label}</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-2">
                {currentStepInfo.percent}%
              </span>
            </div>
            
            {/* Полоска прогресс-бара */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${currentStepInfo.percent}%` }}
              />
            </div>

            {/* Метки 3 шагов */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              <button
                type="button"
                onClick={() => setActiveTopTab?.('params')}
                className={`transition-colors cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 ${currentStepInfo.step >= 1 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                1. Параметры
              </button>
              <button
                type="button"
                disabled={!tenderId}
                onClick={() => tenderId && setActiveTopTab?.('lots')}
                className={`transition-colors ${tenderId ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : 'cursor-not-allowed opacity-50'} ${currentStepInfo.step >= 2 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                2. Лоты
              </button>
              <button
                type="button"
                disabled={!tenderId}
                onClick={() => tenderId && setActiveTopTab?.('docs')}
                className={`transition-colors ${tenderId ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : 'cursor-not-allowed opacity-50'} ${currentStepInfo.step >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                3. Документы
              </button>
            </div>
          </div>

          {/* Кнопки действий (если тендер сохранен) */}
          {tenderId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/tenders/${tenderId}`)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Eye size={15} />
                <span>{t('previewTenderBtn', 'Просмотр тендера')}</span>
              </button>

              {formData.status === 'TASLAMA' && (
                <div className="relative group flex items-center">
                  <button
                    type="button"
                    onClick={onPublishTender}
                    disabled={!canPublish || publishing}
                    className={`px-5 py-2.5 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm ${
                      canPublish 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95 cursor-pointer' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Check size={16} />
                    <span>{publishing ? t('publishing', 'Публикация...') : t('publishTenderBtn', 'Опубликовать')}</span>
                  </button>
                  {!canPublish && publishDisabledReason && (
                    <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-xl z-50 whitespace-nowrap animate-in fade-in">
                      <AlertCircle size={13} className="text-amber-400 shrink-0" />
                      <span>{publishDisabledReason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
