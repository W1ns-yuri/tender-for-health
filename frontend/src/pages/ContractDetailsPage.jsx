import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Send, Upload, FileText, Undo2, XCircle } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, resolveFileUrl } from '../utils/themeUtils';
import useT from '../utils/useT';
import { useAlert } from '../context/AlertContext';
import { contractStatus, formatMoney, formatDate } from '../utils/contracts';
import SectionRow from '../components/ui/SectionRow';

const unitName = (u) => u?.shortName || u?.name || '';

/** Кнопка «загрузить скан»: файл уходит в /documents/upload, затем имя файла — в действие договора */
function ScanUpload({ label, onUploaded, busy, className }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await onUploaded(res.data?.fileName);
    } catch (err) {
      window.$toast?.({ type: 'error', message: err.response?.data?.error || 'Не удалось загрузить файл' });
    } finally {
      setUploading(false);
    }
  };
  return (
    <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${className} ${busy || uploading ? 'opacity-60 pointer-events-none' : ''}`}>
      <Upload size={16} /> {uploading ? 'Загрузка...' : label}
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={pick} />
    </label>
  );
}

const ScanLink = ({ fileName, label }) => (
  <a href={resolveFileUrl(fileName)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2">
    <FileText size={15} /> {label}
  </a>
);

export default function ContractDetailsPage({ role, isDarkMode, lang = 'RU' }) {
  const { id } = useParams();
  const theme = getRoleTheme(role, isDarkMode);
  const t = useT(lang);
  const { showToast } = useAlert();
  const isAdmin = role === 'ADMIN';
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // 'return' | 'cancel' — открыта форма с текстом
  const [text, setText] = useState('');

  const load = useCallback(() => {
    API.get(`/contracts/${id}`).then((res) => setC(res.data)).catch((err) => setError(err.response?.data?.error || 'Договор не найден'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (action, body = {}, okMessage) => {
    setBusy(true);
    try {
      await API.post(`/contracts/${id}/${action}`, body);
      showToast({ type: 'success', message: okMessage });
      setMode(null);
      setText('');
      load();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Не получилось' });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!c) return <div className="h-40 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />;

  const st = contractStatus(c.status);
  const specs = c.offer?.specs || [];
  const s = c.supplier || {};
  const card = `rounded-xl border p-5 ${theme.cardBg}`;
  const ghostBtn = `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`;
  const canCancel = isAdmin && ['DRAFT', 'SENT', 'SUPPLIER_SIGNED'].includes(c.status);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Шапка: на печать не идёт */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/contracts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <ArrowLeft size={16} /> {t('contractsTitle', 'Договоры')}
        </Link>
        <button type="button" onClick={() => window.print()} className={ghostBtn}>
          <Printer size={16} /> {t('print', 'Печать / PDF')}
        </button>
      </div>

      {/* Что сделать сейчас */}
      <section className={`${card} space-y-3 print:hidden`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${st.cls}`}>{st.label}</span>
          {c.sentAt && <span className="text-xs text-slate-500">Отправлен {formatDate(c.sentAt)}</span>}
          {c.supplierSignedAt && <span className="text-xs text-slate-500">· поставщик подписал {formatDate(c.supplierSignedAt)}</span>}
          {c.signedAt && <span className="text-xs text-slate-500">· подписан {formatDate(c.signedAt)}</span>}
        </div>

        {c.note && c.status === 'SENT' && (
          <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200 px-3 py-2">
            Замечание организатора: {c.note}
          </p>
        )}
        {c.status === 'CANCELLED' && <p className="text-sm text-rose-600">Причина отмены: {c.cancelReason}</p>}

        <div className="flex flex-wrap items-center gap-4">
          {c.supplierSignedFile && <ScanLink fileName={c.supplierSignedFile} label="Скан поставщика" />}
          {c.adminSignedFile && <ScanLink fileName={c.adminSignedFile} label="Экземпляр организатора" />}
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && c.status === 'DRAFT' && (
            <button type="button" disabled={busy} onClick={() => act('send', {}, 'Договор отправлен поставщику')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 ${theme.primaryBtn}`}>
              <Send size={16} /> Отправить поставщику
            </button>
          )}
          {!isAdmin && c.status === 'SENT' && (
            <ScanUpload label="Загрузить подписанный скан" busy={busy} className={theme.primaryBtn}
              onUploaded={(fileName) => act('supplier-sign', { fileName }, 'Скан отправлен организатору')} />
          )}
          {isAdmin && c.status === 'SUPPLIER_SIGNED' && (
            <>
              <ScanUpload label="Загрузить свой подписанный экземпляр" busy={busy} className={theme.primaryBtn}
                onUploaded={(fileName) => act('admin-sign', { fileName }, 'Договор подписан')} />
              <button type="button" onClick={() => setMode(mode === 'return' ? null : 'return')} className={ghostBtn}>
                <Undo2 size={16} /> Вернуть с замечанием
              </button>
            </>
          )}
          {canCancel && (
            <button type="button" onClick={() => setMode(mode === 'cancel' ? null : 'cancel')} className={`${ghostBtn} text-rose-600`}>
              <XCircle size={16} /> Отменить договор
            </button>
          )}
        </div>

        {!isAdmin && c.status === 'SENT' && (
          <p className="text-xs text-slate-500">Распечатайте договор кнопкой «Печать / PDF», подпишите, поставьте печать и загрузите скан (PDF или фото).</p>
        )}

        {mode && (
          <div className="space-y-2">
            <textarea
              value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000}
              placeholder={mode === 'return' ? 'Что исправить: например, нет печати' : 'Причина отмены'}
              aria-label={mode === 'return' ? 'Замечание' : 'Причина отмены'}
              className={`w-full rounded-lg px-3 py-2 text-sm ${theme.inputBg}`}
            />
            <div className="flex gap-2">
              <button type="button" disabled={busy || !text.trim()}
                onClick={() => (mode === 'return'
                  ? act('return', { note: text }, 'Договор возвращён поставщику')
                  : act('cancel', { reason: text }, 'Договор отменён'))}
                className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 ${mode === 'cancel' ? 'bg-rose-600 hover:bg-rose-700 text-white' : theme.primaryBtn}`}>
                {mode === 'return' ? 'Вернуть' : 'Отменить договор'}
              </button>
              <button type="button" onClick={() => { setMode(null); setText(''); }} className={ghostBtn}>Не надо</button>
            </div>
          </div>
        )}
      </section>

      {/* Сам договор: печатается без меню и кнопок */}
      <article className={`${card} space-y-5 text-sm leading-relaxed print:border-0 print:p-0 print:text-black print:bg-white`}>
        <header className="text-center space-y-1">
          <h1 className="text-lg font-bold">ДОГОВОР № {c.number}</h1>
          <p className="text-slate-500 print:text-black">по итогам тендера №{c.tender?.tenderNumber} «{c.tender?.title}»</p>
          <p className="text-slate-500 print:text-black">от {formatDate(c.createdAt)}</p>
        </header>

        <p>
          <b>{c.tender?.client?.name || 'Заказчик'}</b>, далее «Заказчик», с одной стороны, и <b>{s.name}</b>
          {s.directorName ? <>, в лице {s.directorName}</> : null}, далее «Поставщик», с другой стороны, по итогам тендера
          заключили настоящий договор о нижеследующем.
        </p>

        <section className="space-y-2">
          <h2 className="font-bold">1. Предмет договора</h2>
          <p>Поставщик передаёт, а Заказчик принимает и оплачивает товары (работы, услуги) в объёме и по ценам ниже.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-2 pr-2 w-8">№</th>
                  <th className="py-2 pr-2">Наименование</th>
                  <th className="py-2 pr-2">Ед.</th>
                  <th className="py-2 pr-2 text-right">Кол-во</th>
                  <th className="py-2 pr-2 text-right">Цена</th>
                  <th className="py-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((os, i) => (
                  <React.Fragment key={os.id}>
                  {os.tenderSpec?.section && os.tenderSpec.section !== specs[i - 1]?.tenderSpec?.section && <SectionRow title={os.tenderSpec.section} className="border-b border-slate-200" />}
                  <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-300 align-top">
                    <td className="py-2 pr-2">{i + 1}</td>
                    <td className="py-2 pr-2">
                      {os.isEquivalent && os.equivalentName ? os.equivalentName : (os.name || os.tenderSpec?.name)}
                      {os.isEquivalent && <span className="block text-slate-500 print:text-black">аналог позиции «{os.tenderSpec?.name}»</span>}
                      {os.tenderSpec?.lot && <span className="block text-slate-400 print:text-black">Лот {os.tenderSpec.lot.lotNumber}: {os.tenderSpec.lot.name}</span>}
                    </td>
                    <td className="py-2 pr-2">{unitName(os.unit || os.tenderSpec?.unit)}</td>
                    <td className="py-2 pr-2 text-right font-mono">{os.quantity}</td>
                    <td className="py-2 pr-2 text-right font-mono">{formatMoney(os.unitPrice)}</td>
                    <td className="py-2 text-right font-mono">{formatMoney(Number(os.unitPrice) * Number(os.quantity))}</td>
                  </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-3 text-right font-bold">Итого:</td>
                  <td className="pt-3 text-right font-mono font-bold whitespace-nowrap">{formatMoney(c.amount, c.currencyCode)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold">2. Цена и оплата</h2>
          <p>Цена договора: <b>{formatMoney(c.amount, c.currencyCode)}</b>. Цена соответствует предложению Поставщика и не меняется в течение срока договора.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold">3. Прочие условия</h2>
          <p>Сроки и место поставки, гарантия и требования к качеству берутся из условий тендера и предложения Поставщика, которые являются неотъемлемой частью договора.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 print:grid-cols-2">
          <div className="space-y-1">
            <h3 className="font-bold">Заказчик</h3>
            <p>{c.tender?.client?.name || '—'}</p>
            <p className="pt-8 border-b border-slate-400 w-48" />
            <p className="text-xs text-slate-500 print:text-black">подпись, печать</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Поставщик</h3>
            <p>{s.name}</p>
            {(s.legalAddress || s.address) && <p>Адрес: {s.legalAddress || s.address}</p>}
            {s.taxId && <p>ИНН: {s.taxId}</p>}
            {s.bankName && <p>Банк: {s.bankName}{s.bankMfo ? `, МФО ${s.bankMfo}` : ''}</p>}
            {(s.bankAccount || s.bankIban) && <p>Счёт: {s.bankAccount || s.bankIban}</p>}
            <p className="pt-8 border-b border-slate-400 w-48" />
            <p className="text-xs text-slate-500 print:text-black">подпись, печать</p>
          </div>
        </section>
      </article>
      <p className="text-xs text-slate-400 print:hidden">Это типовой текст. Когда будет утверждённый шаблон договора, текст разделов заменим на него.</p>
    </div>
  );
}
