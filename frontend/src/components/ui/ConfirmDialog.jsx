import React from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Tassyklama',
  message = 'Siz hakykatdan hem bu hereketi ýerine ýetirmek isleýärsiňizmi?',
  confirmText = 'Tassykla',
  cancelText = 'Ýatyr',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  icon = null,
}) {
  const getIcon = () => {
    if (icon) return icon;
    if (variant === 'danger') return <Trash2 size={24} className="text-rose-600 dark:text-rose-400" />;
    if (variant === 'warning') return <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />;
    return <HelpCircle size={24} className="text-blue-600 dark:text-blue-400" />;
  };

  const getIconBg = () => {
    if (variant === 'danger') return 'bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50';
    if (variant === 'warning') return 'bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50';
    return 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/50';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalBody className="pt-6 pb-2 text-center">
        <div className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center mb-4 ${getIconBg()}`}>
          {getIcon()}
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </ModalBody>

      <ModalFooter className="justify-center sm:justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>

        <Button
          variant={variant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
