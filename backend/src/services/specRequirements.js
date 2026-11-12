/**
 * Требования к характеристикам позиции лота и сравнение с ними предложенного товара.
 *
 * Требование: «Диагональ не меньше 23 дюймов», «Цвет: белый», «Гарантия: 3 года».
 * Обязательное требование нарушать нельзя: такое предложение не может победить.
 * Желательное только подсвечивается, решает человек.
 */
const prisma = require('../lib/prisma');

const OPERATORS = ['EQ', 'GTE', 'LTE'];
const MAX_PER_SPEC = 30;
const BOOLEAN_TRUE = ['true', 'да', 'yes', 'hawa', '1'];
const BOOLEAN_FALSE = ['false', 'нет', 'no', 'ýok', 'yok', '0'];

const toNumber = (v) => {
    if (v === null || v === undefined) return NaN;
    const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : NaN;
};
const norm = (v) => String(v ?? '').trim().toLowerCase();

/**
 * Проверка требований всех позиций лота до записи в базу.
 * specs: [{ requirements: [{ attributeId?, customName?, operator, value, isMandatory }] }]
 * Возвращает { error } или { bySpec: [[row, ...], ...] } в том же порядке, что specs.
 */
async function normalizeSpecRequirements(specs) {
    if (!Array.isArray(specs)) return { bySpec: [] };
    const ids = new Set();
    for (const s of specs) for (const r of (Array.isArray(s?.requirements) ? s.requirements : [])) if (r?.attributeId) ids.add(String(r.attributeId));
    const attrs = ids.size ? await prisma.attribute.findMany({ where: { id: { in: [...ids] } } }) : [];
    const byId = new Map(attrs.map((a) => [a.id, a]));

    const bySpec = [];
    for (let si = 0; si < specs.length; si++) {
        const list = specs[si]?.requirements;
        if (list === undefined || list === null) { bySpec.push([]); continue; }
        if (!Array.isArray(list)) return { error: `Позиция ${si + 1}: требования должны быть списком` };
        if (list.length > MAX_PER_SPEC) return { error: `Позиция ${si + 1}: не больше ${MAX_PER_SPEC} требований` };
        const rows = [];
        const seen = new Set();
        for (const [ri, r] of list.entries()) {
            const where = `Позиция ${si + 1}, требование ${ri + 1}`;
            const raw = String(r?.value ?? '').trim();
            if (!raw) continue; // пустую строку формы просто пропускаем
            if (raw.length > 500) return { error: `${where}: слишком длинное значение` };
            const operator = OPERATORS.includes(r.operator) ? r.operator : 'EQ';
            let attributeId = null;
            let customName = null;
            let value = raw;
            let numberValue = null;

            if (r.attributeId) {
                const a = byId.get(String(r.attributeId));
                if (!a) return { error: `${where}: такой характеристики нет` };
                attributeId = a.id;
                if (seen.has(a.id)) return { error: `${where}: «${a.name}» указана дважды` };
                seen.add(a.id);
                if (operator !== 'EQ' && a.type !== 'NUMBER') return { error: `${where}: «не меньше / не больше» бывает только у чисел` };
                if (a.type === 'NUMBER') {
                    numberValue = toNumber(raw);
                    if (!Number.isFinite(numberValue)) return { error: `${where}: «${a.name}» должно быть числом` };
                    value = String(numberValue);
                } else if (a.type === 'LIST') {
                    const match = a.options.find((o) => norm(o) === norm(raw));
                    if (!match) return { error: `${where}: «${a.name}» — выберите из вариантов (${a.options.join(', ')})` };
                    value = match;
                } else if (a.type === 'BOOLEAN') {
                    if (BOOLEAN_TRUE.includes(norm(raw))) value = 'true';
                    else if (BOOLEAN_FALSE.includes(norm(raw))) value = 'false';
                    else return { error: `${where}: «${a.name}» — ответ «да» или «нет»` };
                }
            } else {
                customName = String(r.customName ?? '').trim();
                if (!customName) return { error: `${where}: укажите, что требуется (например «Гарантия»)` };
                if (customName.length > 100) return { error: `${where}: название не длиннее 100 символов` };
                if (operator !== 'EQ') {
                    numberValue = toNumber(raw);
                    if (!Number.isFinite(numberValue)) return { error: `${where}: для «не меньше / не больше» нужно число` };
                }
            }
            rows.push({ attributeId, customName, operator, value, numberValue, isMandatory: r.isMandatory !== false, order: rows.length });
        }
        bySpec.push(rows);
    }
    return { bySpec };
}

/** Значение товара для требования: по самой характеристике, иначе по совпадению названия */
function findProductValue(req, productValues) {
    const reqName = norm(req.attribute?.name || req.customName);
    return productValues.find((v) => req.attributeId && v.attributeId === req.attributeId)
        || productValues.find((v) => norm(v.attribute?.name || v.customName) === reqName)
        || null;
}

/**
 * Сравнить товар с требованиями позиции.
 * requirements: с include attribute; productValues: attributeValues товара с include attribute.
 * status: MATCH — подходит, MISMATCH — не подходит, UNKNOWN — у товара не указано (проверит человек).
 */
function checkRequirements(requirements = [], productValues = []) {
    return requirements.map((req) => {
        const pv = findProductValue(req, productValues);
        const base = {
            requirementId: req.id,
            name: req.attribute?.name || req.customName,
            unit: req.attribute?.unit || null,
            operator: req.operator,
            required: req.value,
            isMandatory: req.isMandatory,
            offered: pv ? pv.value : null,
        };
        if (!pv) return { ...base, status: 'UNKNOWN' };
        let ok;
        if (req.operator === 'GTE' || req.operator === 'LTE') {
            const have = pv.numberValue ?? toNumber(pv.value);
            const need = req.numberValue ?? toNumber(req.value);
            if (!Number.isFinite(have) || !Number.isFinite(need)) return { ...base, status: 'UNKNOWN' };
            ok = req.operator === 'GTE' ? have >= need : have <= need;
        } else if (Number.isFinite(req.numberValue) && Number.isFinite(pv.numberValue ?? toNumber(pv.value)) && req.attribute?.type === 'NUMBER') {
            ok = Math.abs((pv.numberValue ?? toNumber(pv.value)) - req.numberValue) < 1e-9;
        } else {
            ok = norm(pv.value) === norm(req.value);
        }
        return { ...base, status: ok ? 'MATCH' : 'MISMATCH' };
    });
}

function summarize(results) {
    return {
        mandatoryFailed: results.filter((r) => r.isMandatory && r.status === 'MISMATCH').length,
        optionalFailed: results.filter((r) => !r.isMandatory && r.status === 'MISMATCH').length,
        unknown: results.filter((r) => r.status === 'UNKNOWN').length,
    };
}

const REQUIREMENTS_INCLUDE = { include: { attribute: true }, orderBy: { order: 'asc' } };
const PRODUCT_VALUES_INCLUDE = { attributeValues: { include: { attribute: true } } };

/**
 * Нарушения обязательных требований у предложения по набору позиций.
 * Возвращает список строк «Позиция 2 «Монитор»: Диагональ — нужно не меньше 23, предложено 21,5».
 */
async function mandatoryViolations(offerId, specIds) {
    const offerSpecs = await prisma.offerSpecification.findMany({
        where: { offerId, tenderSpecId: { in: specIds } },
        include: {
            generalProduct: { include: PRODUCT_VALUES_INCLUDE },
            tenderSpec: { include: { requirements: REQUIREMENTS_INCLUDE, generalProduct: { include: PRODUCT_VALUES_INCLUDE } } },
        },
    });
    const problems = [];
    for (const os of offerSpecs) {
        const reqs = os.tenderSpec.requirements;
        if (!reqs.length) continue;
        const product = os.generalProduct || (!os.isEquivalent ? os.tenderSpec.generalProduct : null);
        const results = checkRequirements(reqs, product?.attributeValues || []);
        for (const r of results.filter((x) => x.isMandatory && x.status === 'MISMATCH')) {
            const op = r.operator === 'GTE' ? 'не меньше ' : r.operator === 'LTE' ? 'не больше ' : '';
            problems.push(`Позиция ${os.tenderSpec.positionNumber} «${os.tenderSpec.name}»: ${r.name} — нужно ${op}${r.required}${r.unit ? ' ' + r.unit : ''}, предложено ${r.offered}`);
        }
    }
    return problems;
}

/** Добавить к позициям предложений результат сравнения (для экрана оценки) */
function attachRequirementChecks(tender) {
    for (const offer of tender.offers || []) {
        for (const os of offer.specs || []) {
            const reqs = os.tenderSpec?.requirements || [];
            if (!reqs.length) continue;
            const product = os.generalProduct || (!os.isEquivalent ? os.tenderSpec.generalProduct : null);
            const results = checkRequirements(reqs, product?.attributeValues || []);
            os.requirementCheck = { results, ...summarize(results) };
        }
    }
    return tender;
}

module.exports = {
    normalizeSpecRequirements, checkRequirements, summarize, mandatoryViolations, attachRequirementChecks,
    REQUIREMENTS_INCLUDE, PRODUCT_VALUES_INCLUDE, OPERATORS,
};
