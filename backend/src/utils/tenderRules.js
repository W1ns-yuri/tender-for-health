/**
 * Правила жизненного цикла тендера в одном месте.
 *
 *   TASLAMA ──publish──▶ ACYK ──дедлайн──▶ YAPYK ──вскрытие──▶ BAHALANDYRYLDY ──итоги──▶ YENIJI_YGLAN_EDILDI ──▶ ARHIWLENDI
 *      │                  │                  │                                                              ▲
 *      └──────────────────┴──────────────────┴──────────────▶ GOYBOLSUN_EDILDI (отмена) ───────────────────┘
 *
 * Статус меняется ТОЛЬКО через свои эндпоинты (publish, open, complete) или через отмену/архив.
 * Прямой PUT status=BAHALANDYRYLDY раньше позволял "вскрыть" конверты до дедлайна.
 */

// Ручные переходы, разрешённые через PUT /tenders/:id
const MANUAL_TRANSITIONS = {
    GOYBOLSUN_EDILDI: ['TASLAMA', 'ACYK', 'YAPYK', 'BAHALANDYRYLDY'], // отменить можно до объявления итогов
    ARHIWLENDI: ['YENIJI_YGLAN_EDILDI', 'GOYBOLSUN_EDILDI'],
};

const canTransitionManually = (from, to) => (MANUAL_TRANSITIONS[to] || []).includes(from);

// Структуру тендера (лоты, позиции) можно менять только пока поставщики не начали подавать заявки
const isStructureEditable = (tender, offersCount) =>
    tender.status === 'TASLAMA' || (tender.status === 'ACYK' && offersCount === 0);

// Выбор победителей возможен только между вскрытием и объявлением итогов
const isAwardingOpen = (tender) => Boolean(tender) && tender.status === 'BAHALANDYRYLDY';

/**
 * Часовой пояс заказчика (Ашхабад, UTC+5). Если с фронта пришла только дата ("2026-11-20"
 * или полночь UTC "2026-11-20T00:00:00.000Z" от new Date('2026-11-20').toISOString()),
 * дедлайн считаем концом этого дня по местному времени, а не 05:00 утра.
 */
const TENDER_TZ = process.env.TENDER_TZ_OFFSET || '+05:00';

const parseDeadline = (value) => {
    if (!value) return null;
    const str = String(value);
    const dateOnly = str.match(/^(\d{4}-\d{2}-\d{2})(?:T00:00(?::00(?:\.000)?)?Z)?$/);
    const date = dateOnly ? new Date(`${dateOnly[1]}T23:59:59${TENDER_TZ}`) : new Date(str);
    return isNaN(date.getTime()) ? null : date;
};

module.exports = { canTransitionManually, isStructureEditable, isAwardingOpen, parseDeadline, TENDER_TZ };
