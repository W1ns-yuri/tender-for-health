import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

const VARIANTS = {
  info: {
    container: 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-950 dark:text-blue-100',
    defaultIcon: Info,
  },
  success: {
    container: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-emerald-950 dark:text-emerald-100',
    defaultIcon: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-950 dark:text-amber-100',
    defaultIcon: AlertTriangle,
  },
  danger: {
    container: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200',
    iconColor: 'text-rose-600 dark:text-rose-400',
    titleColor: 'text-rose-950 dark:text-rose-100',
    defaultIcon: AlertCircle,
  },
};

export default function Alert({
  children,
  variant = 'info',
  title = '',
  description = '',
  icon = null,
  dismissible = false,
  onDismiss,
  action = null,
  className = '',
  ...props
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.info;

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon || currentVariant.defaultIcon;
    if (IconComp) {
      const Comp = IconComp;
      return <Comp size={20} />;
    }
    return null;
  };

  return (
    <div
      className={`
        p-4 sm:p-4.5 rounded-2xl border flex items-start gap-3.5 transition-all
        ${currentVariant.container}
        ${className}
      `}
      {...props}
    >
      <div className={`shrink-0 mt-0.5 ${currentVariant.iconColor}`}>
        {renderIcon()}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-bold leading-snug ${currentVariant.titleColor}`}>
            {title}
          </h4>
        )}

        {description && (
          <p className="text-xs mt-1 leading-relaxed opacity-90">
            {description}
          </p>
        )}

        {children && (
          <div className={`text-xs ${title ? 'mt-1.5' : ''} leading-relaxed`}>
            {children}
          </div>
        )}

        {action && (
          <div className="mt-3 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
