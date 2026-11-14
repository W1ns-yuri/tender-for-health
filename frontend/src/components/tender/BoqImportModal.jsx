import React, { useMemo, useState } from 'react';
import { ClipboardPaste, AlertTriangle } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { parseBoq } from '../../utils/boqParser';

const SAMPLE = `Демонтажные работы
Демонтаж перегородок\tм3\t45,5
Вывоз мусора\tт\t12
Отделка
Штукатурка стен\tм2\t860`;

/**
 * Вставка ведомости объёмов из Excel: выделить строки в таблице, Ctrl+C, вставить сюда.
 * Перед добавлением показываем, что поняли: разделы, позиции, единицы.
 */
export default function BoqImportModal({ isOpen, onClose, onImport, units = [], hasSpecs, inputClass, primaryBtn, t = (k, f) => f }) {
  const [text, setText] = useState('');
  const parsed = useMemo(() => parseBoq(text, units), [text, units]);
  const unitName = (id) => units.find((u) => u.id === id)?.shortName || '';

  const close = () => { setText(''); onClose(); };
  const apply = (replace) => { onImport(parsed.rows, replace); close(); };

  return (
    <Modal isOpen={isOpen} onClose={close} size="xl">
      <ModalHeader onClose={close}>
        <ModalTitle>{t('boqImportTitle', 'Вставить ведомость из Excel')}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('boqImportHint', 'Выделите в Excel строки ведомости (наименование, единица, объём) и вставьте сюда. Строка без объёма станет разделом, шапку и «Итого» пропустим.')}
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={SAMPLE}
          aria-label={t('boqImportArea', 'Текст ведомости')}
          className={`${inputClass} w-full font-mono text-xs`}
        />

        {parsed.rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold">
              {t('boqFound', 'Нашли')}: {parsed.rows.length} {t('boqPositions', 'позиций')}
              {parsed.sections > 0 && <>, {parsed.sections} {t('boqSections', 'разделов')}</>}
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsed.rows.map((r, i) => (
                    <React.Fragment key={r.line}>
                      {r.section && r.section !== parsed.rows[i - 1]?.section && (
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                          <td colSpan={3} className="px-3 py-1.5 font-bold">{r.section}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className={`px-3 py-1.5 w-20 ${r.unitId ? '' : 'text-amber-600'}`}>{unitName(r.unitId) || r.unitText || '—'}</td>
                        <td className="px-3 py-1.5 w-24 text-right font-mono">{r.quantity}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {parsed.warnings.length > 0 && (
          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
            {parsed.warnings.slice(0, 8).map((w) => (
              <li key={w} className="flex gap-1.5"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{w}</li>
            ))}
            {parsed.warnings.length > 8 && <li>… {t('boqMoreWarnings', 'и ещё')} {parsed.warnings.length - 8}</li>}
          </ul>
        )}
      </ModalBody>
      <ModalFooter className="flex flex-wrap justify-end gap-2">
        {hasSpecs && (
          <button type="button" disabled={!parsed.rows.length} onClick={() => apply(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50">
            {t('boqReplace', 'Заменить все позиции')}
          </button>
        )}
        <button type="button" disabled={!parsed.rows.length} onClick={() => apply(false)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 ${primaryBtn}`}>
          <ClipboardPaste size={14} /> {hasSpecs ? t('boqAppend', 'Добавить к позициям') : t('boqAdd', 'Добавить позиции')}
        </button>
      </ModalFooter>
    </Modal>
  );
}
