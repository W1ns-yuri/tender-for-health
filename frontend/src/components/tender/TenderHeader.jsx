import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, AlertCircle, FilePlus2, FolderGit2, CalendarClock, X } from 'lucide-react';
import { IconBox } from '../ui';

export default function TenderHeader({
  tenderId,
  formData,
  activeTopTab = 'params',
  setActiveTopTab,
  progressPercent = 0,
  canAccessLots = false,
  canAccessDocs = false,
  onNavigateTab,
  canPublish,
  publishing,
  publishDisabledReason,
  onPublishTender,
  onScheduleTender,
  onUnscheduleTender,
  theme,
  t = (k, f) => f
}) {
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  // Значение для <input type="datetime-local"> в местном времени: завтра в 09:00
  const defaultScheduleValue = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const scheduledLabel = formData.publishAt
    ? new Date(formData.publishAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';

  // Mini-stepper logic
  const stepConfig = {
    params: {
      step: 1,
      label: t('tabGeneralParams', 'Параметры закупки'),
      subtitle: t('paramsStepSubtitle', 'Шаг 1: Основные реквизиты, сроки и классификаторы закупки'),
    },
    lots: {
      step: 2,
      label: t('tabLotsSpecs', 'Лоты и спецификации'),
      subtitle: t('lotsStepSubtitle', 'Шаг 2: Спецификации, параметры лотов и требования к поставке'),
    },
    docs: {
      step: 3,
      label: t('tabGeneralDocs', 'Общие документы'),
      subtitle: t('docsStepSubtitle', 'Шаг 3: Прикрепление общей документации и регламентов'),
    }
  };

  const currentStepInfo = stepConfig[activeTopTab] || stepConfig.params;

  return (
    <div className="space-y-4">
      {/* ИНФОРМАТИВНАЯ КАРТОЧКА С МИНИ-СТЕППЕРОМ ПРОГРЕССА */}
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
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
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
              <span className="font-mono text-[12px] font-bold text-slate-500 dark:text-slate-400 ml-2">
                {progressPercent}%
              </span>
            </div>
            
            {/* Полоска прогресс-бара */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Метки 3 шагов */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('params') : setActiveTopTab?.('params')}
                className={`transition-colors cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 ${progressPercent >= 33 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                1. {t('paramsShort', 'Параметры')}
              </button>
              <button
                type="button"
                disabled={!canAccessLots}
                onClick={() => onNavigateTab ? onNavigateTab('lots') : (canAccessLots && setActiveTopTab?.('lots'))}
                className={`transition-colors ${canAccessLots ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : 'cursor-not-allowed opacity-40'} ${progressPercent >= 66 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                2. {t('lotsShort', 'Лоты')}
              </button>
              <button
                type="button"
                disabled={!canAccessDocs}
                onClick={() => onNavigateTab ? onNavigateTab('docs') : (canAccessDocs && setActiveTopTab?.('docs'))}
                className={`transition-colors ${canAccessDocs ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : 'cursor-not-allowed opacity-40'} ${progressPercent >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
              >
                3. {t('docsShort', 'Документы')}
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

              {formData.status === 'TASLAMA' && onScheduleTender && !formData.publishAt && (
                <button
                  type="button"
                  onClick={() => { setScheduleAt(defaultScheduleValue()); setScheduleOpen((v) => !v); }}
                  disabled={!canPublish || publishing}
                  className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
                    canPublish
                      ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CalendarClock size={15} />
                  <span>{t('scheduleBtn', 'Запланировать')}</span>
                </button>
              )}

              {formData.status === 'TASLAMA' && (
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
                  <span>{publishing ? t('publishing', 'Публикация...') : formData.publishAt ? t('publishNowBtn', 'Опубликовать сейчас') : t('publishTenderBtn', 'Опубликовать')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Почему нельзя опубликовать: раньше было видно только при наведении */}
      {tenderId && formData.status === 'TASLAMA' && !canPublish && publishDisabledReason && (
        <p className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <AlertCircle size={14} className="shrink-0" />
          {t('cannotPublishYet', 'Опубликовать пока нельзя')}: {publishDisabledReason}
        </p>
      )}

      {formData.status === 'TASLAMA' && formData.publishAt && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
          <CalendarClock size={18} className="shrink-0" />
          <span className="text-sm font-semibold">
            {t('willPublishAt', 'Тендер опубликуется автоматически')} {scheduledLabel}
          </span>
          <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
            {t('scheduleEditHint', 'До этого момента его видите только вы, и его можно править.')}
          </span>
          <button
            type="button"
            onClick={onUnscheduleTender}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline cursor-pointer"
          >
            <X size={14} /> {t('cancelSchedule', 'Отменить расписание')}
          </button>
        </div>
      )}

      {scheduleOpen && !formData.publishAt && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onScheduleTender(scheduleAt)) setScheduleOpen(false);
          }}
          className="flex flex-wrap items-end gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 space-y-1">
            <span className="block">{t('publishAtLabel', 'Когда опубликовать')}</span>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              required
              className="px-3 py-2 text-xs border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
          <button type="submit" disabled={publishing} className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">
            {t('confirmSchedule', 'Запланировать публикацию')}
          </button>
          <button type="button" onClick={() => setScheduleOpen(false)} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
            {t('cancel', 'Отмена')}
          </button>
          <p className="basis-full text-xs text-slate-500 dark:text-slate-400">
            {t('scheduleHint', 'Тендер останется черновиком и откроется для поставщиков сам, с точностью до минуты. Срок подачи должен быть позже времени публикации.')}
          </p>
        </form>
      )}
    </div>
  );
}
