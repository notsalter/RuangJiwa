import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { QueryState } from '../core/types';
import { safeError } from '../core/config';
export function Field({ label, children }: { label: string; children: ComponentChildren }) { return <label class="field"><span>{label}</span>{children}</label>; }
export function QueryFeedback({ query, retry, empty }: { query: QueryState<unknown>; retry: () => void; empty: string }) {
  if (query.loading) return <p role="status">Memuat catatan dari Firebase...</p>;
  if (query.error) return <div role="alert"><p>{query.error}</p><button onClick={retry}>Coba lagi</button></div>;
  return query.items.length ? null : <p>{empty}</p>;
}
export function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const run = async (action: () => Promise<unknown>, success = 'Tersimpan.') => { if (busy) return; setBusy(true); setError(''); setNotice(''); try { const result = await action(); if (result !== false) setNotice(success); } catch (e) { setError(safeError(e)); } finally { setBusy(false); } };
  return { busy, error, notice, run, clear: () => { setError(''); setNotice(''); } };
}
export function ActionFeedback({ action }: { action: ReturnType<typeof useAction> }) { return <>{action.error && <p role="alert">{action.error}</p>}{action.notice && <p role="status">{action.notice}</p>}</>; }
export function dateLabel(value?: string) { const date = new Date(value ?? ''); return Number.isFinite(date.getTime()) ? date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanggal tidak tersedia'; }
