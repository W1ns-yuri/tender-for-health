import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Reusable Toast (Push-Notification) Component for W1ns UI Kit
 * Supports types: 'success' | 'error' | 'warning' | 'info'
 */
export default function Toast({
  id,
  type = 'info',
  title,
  message,
  onClose,
  duration = 3000,
  showProgress = true,
  role = 'ADMIN',
  className = '',
}) {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!duration || duration <= 0) return;

    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (isHovered) return; // Pause timer when user hovers

      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose?.(id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isHovered, onClose, id]);

  const isSupplier = role === 'SUPPLIER';

  // Config by type
  const config = {
    success: {
      icon: isSupplier ? (
        <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
      ) : (
        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
      ),
      iconBg: isSupplier
        ? 'bg-blue-100 dark:bg-blue-900/60'
        : 'bg-emerald-100 dark:bg-emerald-900/60',
      border: isSupplier
        ? 'border-blue-200 dark:border-blue-800/80'
        : 'border-emerald-200 dark:border-emerald-800/80',
      progressBar: isSupplier ? 'bg-blue-600' : 'bg-emerald-600',
      defaultTitle: 'Успешно',
    },
    error: {
      icon: <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-900/60',
      border: 'border-rose-200 dark:border-rose-800/80',
      progressBar: 'bg-rose-600',
      defaultTitle: 'Ошибка',
    },
    warning: {
      icon: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/60',
      border: 'border-amber-200 dark:border-amber-800/80',
      progressBar: 'bg-amber-500',
      defaultTitle: 'Внимание',
    },
    info: {
      icon: <Info size={18} className="text-sky-600 dark:text-sky-400" />,
      iconBg: 'bg-sky-100 dark:bg-sky-900/60',
      border: 'border-sky-200 dark:border-sky-800/80',
      progressBar: 'bg-sky-600',
      defaultTitle: 'Уведомление',
    },
  }[type] || {
    icon: <Info size={18} className="text-slate-600" />,
    iconBg: 'bg-slate-100',
    border: 'border-slate-200',
    progressBar: 'bg-slate-600',
    defaultTitle: 'Уведомление',
  };

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        pointer-events-auto relative overflow-hidden rounded-2xl border
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
        p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40
        transition-all duration-200 animate-in slide-in-from-right-8 fade-in
        flex items-start gap-3 w-full max-w-sm
        ${config.border}
        ${className}
      `}
    >
      {/* Icon badge */}
      <div className={`p-2 rounded-xl shrink-0 ${config.iconBg}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
          {title || config.defaultTitle}
        </h4>
        {message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed break-words">
            {message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onClose?.(id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Закрыть уведомление"
      >
        <X size={15} />
      </button>

      {/* Time progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all linear ${config.progressBar}`}
            style={{ width: `${progress}%`, transitionDuration: '40ms' }}
          />
        </div>
      )}
    </div>
  );
}
