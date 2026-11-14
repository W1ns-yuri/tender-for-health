/** Позиция idx открывает новый раздел ведомости (у неё раздел и он не как у предыдущей) */
export const isSectionStart = (list, idx) => Boolean(list[idx]?.section) && list[idx].section !== list[idx - 1]?.section;
