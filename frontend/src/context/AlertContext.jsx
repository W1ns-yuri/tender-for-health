import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertOctagon, XCircle, Info, X } from 'lucide-react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children, isDarkMode = false, lang = 'RU' }) => {
  const [dialog, setDialog] = useState(null); // { isOpen, mode, title, message, type, confirmText, cancelText, isDanger, resolve }

  const closeDialog = useCallback((result) => {
    if (dialog && dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog(null);
  }, [dialog]);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      const isString = typeof options === 'string';
      const msg = isString ? options : (options.message || '');
      const isDanger = !isString && Boolean(options.isDanger);
      const type = isString ? (isDanger ? 'danger' : 'warning') : (options.type || (isDanger ? 'danger' : 'warning'));

      setDialog({
        isOpen: true,
        mode: 'confirm',
        title: isString ? '' : options.title,
        message: msg,
        type,
        confirmText: !isString && options.confirmText ? options.confirmText : null,
        cancelText: !isString && options.cancelText ? options.cancelText : null,
        isDanger,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      const isString = typeof options === 'string';
      const msg = isString ? options : (options.message || '');
      const type = isString ? 'info' : (options.type || 'info');

      setDialog({
        isOpen: true,
        mode: 'alert',
        title: isString ? '' : options.title,
        message: msg,
        type,
        confirmText: !isString && options.confirmText ? options.confirmText : null,
        resolve,
      });
    });
  }, []);

  // Экспорт в window для удобства прямого вызова
  useEffect(() => {
    window.$alert = showAlert;
    window.$confirm = showConfirm;
    return () => {
      delete window.$alert;
      delete window.$confirm;
    };
  }, [showAlert, showConfirm]);

  // Блокировка скролла и обработка Escape / Enter
  useEffect(() => {
    if (!dialog) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDialog(false);
      } else if (e.key === 'Enter') {
        closeDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog, closeDialog]);

  // Тексты по умолчанию в зависимости от языка и типа
  const getDefaultTitle = (type, mode) => {
    if (mode === 'confirm') {
      return lang === 'RU' ? 'Подтверждение действия' : 'Hereketi tassyklaň';
    }
    switch (type) {
      case 'success':
        return lang === 'RU' ? 'Успешно' : 'Üstünlikli';
      case 'error':
      case 'danger':
        return lang === 'RU' ? 'Внимание' : 'Üns beriň';
      case 'warning':
        return lang === 'RU' ? 'Предупреждение' : 'Duýduryş';
      default:
        return lang === 'RU' ? 'Сообщение системы' : 'Ulgam habarnamasy';
    }
  };

  const getDefaultConfirmText = (type, mode, isDanger) => {
    if (mode === 'confirm') {
      if (isDanger) return lang === 'RU' ? 'Да, продолжить' : 'Hawa, dowam et';
      return lang === 'RU' ? 'Подтвердить' : 'Tassykla';
    }
    return lang === 'RU' ? 'Понятно' : 'Düşnükli';
  };

  const getDefaultCancelText = () => {
    return lang === 'RU' ? 'Отмена' : 'Ýatyr';
  };

  const getIconInfo = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/70'
        };
      case 'error':
        return {
          icon: <XCircle size={24} className="text-rose-600 dark:text-rose-400" />,
          bg: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/70'
        };
      case 'danger':
        return {
          icon: <AlertOctagon size={24} className="text-rose-600 dark:text-rose-400" />,
          bg: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/70'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/70'
        };
      default:
        return {
          icon: <Info size={24} className="text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/70'
        };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {dialog && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => closeDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-150 ${
              isDarkMode 
                ? 'bg-[#111827] border-slate-800 text-slate-100 shadow-black/80' 
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-900/20'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Бейдж иконки */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconInfo(dialog.type).bg}`}>
                {getIconInfo(dialog.type).icon}
              </div>

              {/* Содержимое диалога */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {dialog.title || getDefaultTitle(dialog.type, dialog.mode)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => closeDialog(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 whitespace-pre-line break-words">
                  {dialog.message}
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              {dialog.mode === 'confirm' && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
                >
                  {dialog.cancelText || getDefaultCancelText()}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => closeDialog(true)}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                  dialog.isDanger || dialog.type === 'danger' || dialog.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {dialog.confirmText || getDefaultConfirmText(dialog.type, dialog.mode, dialog.isDanger)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    // Безопасный fallback если компонент вдруг вызван вне провайдера
    return {
      showAlert: (opts) => {
        const msg = typeof opts === 'string' ? opts : opts.message;
        window.alert(msg);
        return Promise.resolve();
      },
      showConfirm: (opts) => {
        const msg = typeof opts === 'string' ? opts : opts.message;
        return Promise.resolve(window.confirm(msg));
      }
    };
  }
  return context;
};
