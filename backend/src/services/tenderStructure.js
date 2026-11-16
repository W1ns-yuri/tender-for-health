/**
 * Структура тендера: лоты и позиции. Общие функции для контроллеров тендера и лотов.
 */
const prisma = require('../lib/prisma');
const { isStructureEditable } = require('../utils/tenderRules');
const { parseQuantity } = require('../utils/validation');
const { normalizeSpecRequirements } = require('./specRequirements');

const LOCKED_STRUCTURE_ERROR = 'Лоты и позиции нельзя менять: по тендеру уже поданы предложения или приём заявок закрыт. Отмените тендер и создайте новый.';

// Можно ли менять лоты/позиции тендера (иначе удаление позиций каскадно стирает позиции поданных предложений)
const assertStructureEditable = async (tender) => {
    const offersCount = await prisma.offer.count({ where: { tenderId: tender.id } });
    return isStructureEditable(tender, offersCount);
};

/**
 * Записать позиции лота вместе с требованиями к характеристикам.
 * Позиции без названия пропускаются. Ошибка в требованиях → 400 (isClientError), транзакция откатывается.
 */
async function createLotSpecs(tx, tenderId, lotId, specs) {
    const valid = (Array.isArray(specs) ? specs : []).filter(s => (s.name || s.haryt) && (s.name || s.haryt).trim() !== '');
    if (!valid.length) return;
    const reqs = await normalizeSpecRequirements(valid);
    if (reqs.error) throw Object.assign(new Error(reqs.error), { isClientError: true });
    for (const [idx, spec] of valid.entries()) {
        await tx.tenderSpecification.create({
            data: {
                tenderId,
                lotId,
                positionNumber: parseInt(spec.positionNumber, 10) || (idx + 1),
                generalProductId: (spec.generalProductId && spec.generalProductId !== '') ? spec.generalProductId : null,
                name: (spec.name || spec.haryt || '').trim(),
                quantity: parseQuantity(spec.quantity ?? spec.mukdar),
                unitId: (spec.unitId && spec.unitId !== '') ? spec.unitId : ((spec.unit && spec.unit !== '') ? spec.unit : null),
                manufacturerId: (spec.manufacturerId && spec.manufacturerId !== '') ? spec.manufacturerId : ((spec.brand && spec.brand !== '') ? spec.brand : null),
                description: (spec.description || spec.desc || '').trim() || null,
                section: String(spec.section ?? '').trim().slice(0, 200) || null,
                ...(reqs.bySpec[idx].length ? { requirements: { create: reqs.bySpec[idx] } } : {}),
            },
        });
    }
}

// Генерация последовательного номера тендера вида TNDR-YYYY-MM-001
const generateNextTenderNumber = async (txOrPrisma = prisma) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `TNDR-${year}-${month}-`;

    const existingTenders = await txOrPrisma.tender.findMany({
        where: {
            tenderNumber: {
                startsWith: prefix
            }
        },
        select: { tenderNumber: true }
    });

    let maxSeq = 0;
    for (const t of existingTenders) {
        const numPart = t.tenderNumber.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
            maxSeq = parsed;
        }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
};

module.exports = { LOCKED_STRUCTURE_ERROR, assertStructureEditable, createLotSpecs, generateNextTenderNumber };
