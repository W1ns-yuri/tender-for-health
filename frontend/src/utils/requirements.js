/**
 * Требования к характеристикам позиции и сравнение с ними товара.
 * Та же логика, что в backend/src/services/specRequirements.js: там она решает, может ли предложение победить,
 * здесь только подсказывает поставщику заранее.
 */
export const OPERATOR_LABELS = { EQ: 'равно', GTE: 'не меньше', LTE: 'не больше' };

const toNumber = (v) => {
  if (v === null || v === undefined) return NaN;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};
const norm = (v) => String(v ?? '').trim().toLowerCase();

export const formatValue = (value, type) => {
  if (type === 'BOOLEAN') return value === 'true' ? 'да' : value === 'false' ? 'нет' : value;
  return value;
};

/** «Диагональ не меньше 23 дюйм» */
export function requirementText(r) {
  const name = r.attribute?.name || r.customName;
  const op = r.operator === 'EQ' ? ':' : ` ${OPERATOR_LABELS[r.operator]}`;
  return `${name}${op} ${formatValue(r.value, r.attribute?.type)}${r.attribute?.unit ? ' ' + r.attribute.unit : ''}`;
}

/** status: MATCH | MISMATCH | UNKNOWN (у товара не указано) */
export function checkRequirements(requirements = [], productValues = []) {
  return requirements.map((req) => {
    const reqName = norm(req.attribute?.name || req.customName);
    const pv = productValues.find((v) => req.attributeId && v.attributeId === req.attributeId)
      || productValues.find((v) => norm(v.attribute?.name || v.customName) === reqName);
    if (!pv) return { req, status: 'UNKNOWN', offered: null };
    let ok;
    const have = pv.numberValue ?? toNumber(pv.value);
    const need = req.numberValue ?? toNumber(req.value);
    if (req.operator === 'GTE' || req.operator === 'LTE') {
      if (!Number.isFinite(have) || !Number.isFinite(need)) return { req, status: 'UNKNOWN', offered: pv.value };
      ok = req.operator === 'GTE' ? have >= need : have <= need;
    } else if (req.attribute?.type === 'NUMBER' && Number.isFinite(have) && Number.isFinite(need)) {
      ok = Math.abs(have - need) < 1e-9;
    } else {
      ok = norm(pv.value) === norm(req.value);
    }
    return { req, status: ok ? 'MATCH' : 'MISMATCH', offered: pv.value };
  });
}
