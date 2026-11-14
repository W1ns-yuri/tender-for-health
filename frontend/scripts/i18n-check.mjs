/**
 * Проверка переводов: каждый ключ из t('ключ', …) должен быть во всех трёх словарях.
 * Запуск: npm run i18n:check. Падает с кодом 1, если чего-то не хватает, и печатает, чего именно.
 * --unused дополнительно печатает ключи словаря, которые нигде не используются.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import tm from '../src/locales/tm.js';
import ru from '../src/locales/ru.js';
import en from '../src/locales/en.js';

const SRC = new URL('../src', import.meta.url).pathname;
const LOCALES = { TM: tm, RU: ru, EN: en };
// t('key', …) и getTranslation(lang, 'key', …)
const CALL = /(?:\bt|getTranslation\(\s*\w+\s*,)\s*\(?\s*['"]([A-Za-z0-9_]+)['"]/g;
// Ключи в списках-настройках, которые потом идут в t(item.key, item.label): { key: 'x', label: '…' }, titleKey: 'x'
const CONFIG = /\b(?:titleKey|descKey|nameKey|tagKey|labelKey)\s*:\s*'([A-Za-z][A-Za-z0-9_]+)'|\bkey\s*:\s*'([A-Za-z][A-Za-z0-9_]+)'\s*,\s*(?:label|name|defaultName|defaultTitle|defaultLabel)\s*:/g;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'locales') walk(p); }
    else if (/\.(jsx?|tsx?)$/.test(name)) files.push(p);
  }
};
walk(SRC);

const used = new Map(); // key → первое место использования
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of [...text.matchAll(CALL), ...text.matchAll(CONFIG)]) {
    const key = m[1] || m[2];
    if (!used.has(key)) used.set(key, `${relative(SRC, f)}:${text.slice(0, m.index).split('\n').length}`);
  }
}

let problems = 0;
for (const [lang, dict] of Object.entries(LOCALES)) {
  const missing = [...used.keys()].filter((k) => !(k in dict));
  if (missing.length) {
    problems += missing.length;
    console.log(`\n${lang}: нет ${missing.length} ключей`);
    for (const k of missing.slice(0, 50)) console.log(`  ${k}  (${used.get(k)})`);
    if (missing.length > 50) console.log(`  … и ещё ${missing.length - 50}`);
  }
}
const all = new Set(Object.values(LOCALES).flatMap((d) => Object.keys(d)));
for (const [lang, dict] of Object.entries(LOCALES)) {
  const gap = [...all].filter((k) => !(k in dict));
  if (gap.length) { problems += gap.length; console.log(`\n${lang}: нет ключей, которые есть в других языках: ${gap.join(', ')}`); }
}
if (process.argv.includes('--unused')) {
  const unused = [...all].filter((k) => !used.has(k));
  console.log(`\nНе используются (${unused.length}): ${unused.join(', ')}`);
}
console.log(problems ? `\nПереводы: ${problems} проблем` : `Переводы: ок, ${used.size} ключей во всех трёх языках`);
process.exit(problems ? 1 : 0);
