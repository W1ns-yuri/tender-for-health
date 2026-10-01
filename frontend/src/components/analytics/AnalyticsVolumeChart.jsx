import React, { useState, useMemo } from 'react';
import { formatCurrency } from './analyticsUtils';

export default function AnalyticsVolumeChart({
  timeline = [],
  currencySymbol = 'TMT',
  isDarkMode = false,
  t,
}) {
  const [hoveredTimelineIdx, setHoveredTimelineIdx] = useState(null);

  const isTimelineEmpty = useMemo(() => {
    if (!timeline.length) return true;
    return timeline.every((p) => Number(p.published || 0) === 0 && Number(p.awarded || 0) === 0);
  }, [timeline]);

  const maxVolume = useMemo(() => {
    if (!timeline.length) return 100;
    const computedMax = Math.max(
      ...timeline.map((p) => Math.max(Number(p.published || 0), Number(p.awarded || 0)))
    );
    return computedMax > 0 ? computedMax * 1.15 : 100;
  }, [timeline]);

  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const pointsPublished = useMemo(() => {
    if (!timeline.length) return [];
    const stepX = (svgWidth - paddingX * 2) / Math.max(timeline.length - 1, 1);
    return timeline.map((p, i) => {
      const x = paddingX + i * stepX;
      const y =
        svgHeight - paddingY - (Number(p.published || 0) / maxVolume) * (svgHeight - paddingY * 2);
      return { x, y, data: p };
    });
  }, [timeline, maxVolume]);

  const pointsAwarded = useMemo(() => {
    if (!timeline.length) return [];
    const stepX = (svgWidth - paddingX * 2) / Math.max(timeline.length - 1, 1);
    return timeline.map((p, i) => {
      const x = paddingX + i * stepX;
      const y =
        svgHeight - paddingY - (Number(p.awarded || 0) / maxVolume) * (svgHeight - paddingY * 2);
      return { x, y, data: p };
    });
  }, [timeline, maxVolume]);

  // Генерация плавных кривых Bezier
  const createSmoothPath = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cpX = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C ${cpX},${pts[i].y} ${cpX},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
  };

  const linePathPublished = createSmoothPath(pointsPublished);
  const linePathAwarded = createSmoothPath(pointsAwarded);

  const areaPathAwarded =
    pointsAwarded.length > 0
      ? `${linePathAwarded} L ${pointsAwarded[pointsAwarded.length - 1].x},${
          svgHeight - paddingY
        } L ${pointsAwarded[0].x},${svgHeight - paddingY} Z`
      : '';

  const activeTimelineItem =
    hoveredTimelineIdx !== null ? timeline[hoveredTimelineIdx] : null;

  return (
    <div
      className={`p-6 rounded-2xl border transition-all relative ${
        isDarkMode ? 'bg-[#111827] border-slate-800 shadow-md' : 'bg-white border-slate-200/80 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('tradeDynamics', 'Динамика торгов и объемов')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Соотношение объема опубликованных лотов к сумме заключенных контрактов
          </p>
        </div>

        {/* Легенда графиков */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {t('publishedLotsVolume', 'Объем объявленных лотов (План)')}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40 inline-block" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {t('awardedVolume', 'Фактически разыграно (Факт)')}
            </span>
          </div>
        </div>
      </div>

      {/* Интерактивный SVG график */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 sm:h-72 overflow-visible"
        >
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={isDarkMode ? 0.35 : 0.22} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>

            <linearGradient id="awardedStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Горизонтальные сетчатые линии */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Заливка под линией разыгранного объема (Факт) */}
          {areaPathAwarded && <path d={areaPathAwarded} fill="url(#emeraldGradient)" />}

          {/* Линия опубликованного объема (План: пунктир #94A3B8) */}
          {linePathPublished && (
            <path
              d={linePathPublished}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              className="transition-all duration-300"
            />
          )}

          {/* Линия фактически разыгранного объема (Факт: изумрудная #10B981) */}
          {linePathAwarded && (
            <path
              d={linePathAwarded}
              fill="none"
              stroke="url(#awardedStrokeGradient)"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="transition-all duration-300 drop-shadow-xs"
            />
          )}

          {/* Вертикальная направляющая при ховере */}
          {hoveredTimelineIdx !== null && pointsPublished[hoveredTimelineIdx] && (
            <line
              x1={pointsPublished[hoveredTimelineIdx].x}
              y1={paddingY}
              x2={pointsPublished[hoveredTimelineIdx].x}
              y2={svgHeight - paddingY}
              stroke={isDarkMode ? '#64748b' : '#94a3b8'}
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Интерактивные точки */}
          {pointsPublished.map((pt, i) => {
            const isHovered = hoveredTimelineIdx === i;
            const ptAwarded = pointsAwarded[i];
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredTimelineIdx(i)}
                onMouseLeave={() => setHoveredTimelineIdx(null)}
              >
                <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#94A3B8"
                  stroke={isDarkMode ? '#111827' : '#ffffff'}
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {ptAwarded && (
                  <circle
                    cx={ptAwarded.x}
                    cy={ptAwarded.y}
                    r={isHovered ? 7 : 4.5}
                    fill="#10B981"
                    stroke={isDarkMode ? '#111827' : '#ffffff'}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150"
                  />
                )}

                <text
                  x={pt.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                      : isDarkMode
                      ? 'fill-slate-500'
                      : 'fill-slate-400'
                  }`}
                >
                  {pt.data.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Заглушка (Empty State) при отсутствии объемов за период */}
        {isTimelineEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
            <div
              className={`px-4 py-2 rounded-xl border text-xs font-medium backdrop-blur-xs shadow-xs ${
                isDarkMode
                  ? 'bg-[#0f172a]/90 border-slate-800 text-slate-400'
                  : 'bg-white/90 border-slate-200 text-slate-600'
              }`}
            >
              {t('noCompletedTendersYet', 'Нет завершенных торгов за выбранный период')}
            </div>
          </div>
        )}

        {/* Всплывающий Custom Tooltip */}
        {activeTimelineItem &&
          hoveredTimelineIdx !== null &&
          pointsPublished[hoveredTimelineIdx] && (
            <div
              className={`absolute pointer-events-none p-3 rounded-xl border shadow-xl text-xs z-20 backdrop-blur-md transition-all duration-100 ${
                isDarkMode
                  ? 'bg-[#1e293b]/95 border-slate-700 text-white shadow-black/40'
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/80'
              }`}
              style={{
                left: `${(pointsPublished[hoveredTimelineIdx].x / svgWidth) * 100}%`,
                top: '15%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-700 pb-1.5 mb-1.5 flex items-center justify-between gap-4">
                <span>{activeTimelineItem.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                  {t('tradeDynamics', 'Динамика')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
                    {t('lotsPlanShort', 'Объявлено (План)')}:
                  </span>
                  <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency(activeTimelineItem.published, currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                    {t('lotsFactShort', 'Разыграно (Факт)')}:
                  </span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(activeTimelineItem.awarded, currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400">Экономия:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(activeTimelineItem.savings, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
