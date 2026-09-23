import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image, FileArchive, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FileDropzone({
  file = null,
  onFileSelect,
  onFileRemove,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  maxSizeMB = 25,
  title = 'Faýly ýükläň',
  subtitle = 'Ýa-da faýly şu ýere süýräp getiriň (PDF, Word, Excel, Surat 25MB çenli)',
  disabled = false,
  error = '',
  className = '',
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const validateAndPass = (selectedFile) => {
    setLocalError('');
    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Faýlyň göwrümi ${maxSizeMB}MB-dan köp bolmaly däl`);
      return;
    }

    onFileSelect?.(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) {
      return <Image size={20} className="text-emerald-500" />;
    }
    if (['zip', 'rar', '7z'].includes(ext)) {
      return <FileArchive size={20} className="text-amber-500" />;
    }
    return <FileText size={20} className="text-blue-500" />;
  };

  const displayError = error || localError;

  // 1. File is already selected / attached
  if (file) {
    const fileName = file.name || file.fileName || file.originalName || 'Ýüklenen faýl';
    const fileSize = file.size || file.fileSize;

    return (
      <div className={`p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
            {getFileIcon(fileName)}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {fileName}
            </h5>
            <div className="flex items-center gap-2 mt-0.5">
              {fileSize && (
                <span className="text-[11px] text-slate-400">
                  {formatSize(fileSize)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>Ýüklenen</span>
              </span>
            </div>
          </div>
        </div>

        {onFileRemove && !disabled && (
          <button
            type="button"
            onClick={onFileRemove}
            className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Aýyrmak"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  // 2. Dropzone upload area
  return (
    <div className={className}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-150 cursor-pointer
          ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/20'
          }
          ${displayError ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-2xs">
          <UploadCloud size={24} className={isDragOver ? 'text-blue-500' : ''} />
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          {title}
        </h4>

        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      {displayError && (
        <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
          <AlertCircle size={13} className="shrink-0" />
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
}
