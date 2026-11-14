import React from 'react';

/** Заголовок раздела ведомости объёмов внутри таблицы позиций */
export default function SectionRow({ title, className = '' }) {
  return (
    <tr className={`bg-slate-50 dark:bg-slate-800/50 print:bg-white ${className}`}>
      <td colSpan={99} className="py-2 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 print:text-black">{title}</td>
    </tr>
  );
}
