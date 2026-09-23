import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export function Modal({
  isOpen = false,
  onClose,
  size = 'md',
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Dialog Content */}
      <div
        className={`
          relative w-full bg-white dark:bg-slate-900 rounded-3xl
          border border-slate-200/80 dark:border-slate-800 shadow-2xl
          z-10 overflow-hidden transform transition-all duration-200
          ${SIZES[size] || SIZES.md}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function ModalTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold text-slate-900 dark:text-white truncate ${className}`}>
      {children}
    </h3>
  );
}

export function ModalDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export function ModalBody({ children, className = '', maxH = 'max-h-[75vh]' }) {
  return (
    <div className={`p-6 overflow-y-auto ${maxH} ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default Modal;
