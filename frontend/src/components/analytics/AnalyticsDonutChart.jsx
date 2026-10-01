import React, { useState } from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { formatNumber } from './analyticsUtils';

export default function AnalyticsDonutChart({
  statusDistribution = [],
  totalProcedures = 0,
  isDarkMode = false,
  t,
}) {
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState(null);

  const totalStatusCount = statusDistribution.reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0
  );

  let cumulativeAngle = 0;
  const donutSegments =
    totalStatusCount > 0
      ? statusDistribution.map((item, idx) => {
          const fraction = (Number(item.count) || 0) / totalStatusCount;
          if (fraction <= 0) return { ...item, path: '', fraction: 0, idx };

          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + fraction * 360;
          cumulativeAngle = endAngle;

          const rOuter = 85;
          const rInner = 56;
          const cx = 110;
          const cy = 110;

          const radStart = ((startAngle - 90) * Math.PI) / 180;
          const radEnd = ((endAngle - 90) * Math.PI) / 180;

          const x1 = cx + rOuter * Math.cos(radStart);
          const y1 = cy + rOuter * Math.sin(radStart);
          const x2 = cx + rOuter * Math.cos(radEnd);
          const y2 = cy + rOuter * Math.sin(radEnd);

          const x3 = cx + rInner * Math.cos(radEnd);
          const y3 = cy + rInner * Math.sin(radEnd);
          const x4 = cx + rInner * Math.cos(radStart);
          const y4 = cy + rInner * Math.sin(radStart);

          const largeArc = fraction > 0.5 ? 1 : 0;
          const path = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;

          return { ...item, path, startAngle, endAngle, fraction, idx };
        })
      : [];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
        isDarkMode
          ? 'bg-[#111827] border-slate-800 shadow-md'
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('procedureResults', 'Результативность процедур')}
          </h2>
          <PieIcon size={18} className="text-slate-400" />
        </div>

        {/* Donut SVG */}
        <div className="relative flex justify-center items-center my-2">
          <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
            {totalStatusCount === 0 ? (
              <circle
                cx="110"
                cy="110"
                r="70"
                fill="none"
                stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
                strokeWidth="18"
                strokeDasharray="4 4"
              />
            ) : (
              donutSegments.map((segment) => {
                if (!segment.path) return null;
                const isHovered = hoveredDonutIdx === segment.idx;
                return (
                  <path
                    key={segment.id}
                    d={segment.path}
                    fill={segment.color}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transformOrigin: '110px 110px',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      opacity: hoveredDonutIdx !== null && !isHovered ? 0.45 : 1,
                    }}
                    onMouseEnter={() => setHoveredDonutIdx(segment.idx)}
                    onMouseLeave={() => setHoveredDonutIdx(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Центр бублика */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatNumber(totalProcedures || 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              {t('totalProceduresLabel', 'Всего процедур')}
            </span>
          </div>
        </div>
      </div>

      {/* Легенда под бубликом */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        {statusDistribution.map((item, idx) => {
          const isHovered = hoveredDonutIdx === idx;
          const isCancelled = item.id === 'CANCELLED';
          const displayLabel = isCancelled ? t('cancelledShort', 'Не состоялись') : item.label;
          const hoverTitle = isCancelled
            ? t('cancelledFull', 'Не состоялись / Отменены')
            : item.label;
          return (
            <div
              key={item.id}
              title={hoverTitle}
              onMouseEnter={() => setHoveredDonutIdx(idx)}
              onMouseLeave={() => setHoveredDonutIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                isHovered
                  ? isDarkMode
                    ? 'bg-slate-800'
                    : 'bg-slate-100'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                  {displayLabel}
                </span>
              </div>
              <div className="flex items-center space-x-2 tabular-nums shrink-0 whitespace-nowrap">
                <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
                <span className="text-slate-400 text-[11px] shrink-0 whitespace-nowrap">
                  ({item.percent}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
