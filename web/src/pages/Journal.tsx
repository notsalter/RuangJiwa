import { useState } from 'preact/hooks';
import { Session } from '../core/session';
import { useQuery } from '../core/hooks';
import { journalDraft, journalPrompts, filterJournals, type JournalDraft } from '../features/journal';
import { moodOptions } from '../features/mood';
import { Field, useAction, ActionFeedback, QueryFeedback, dateLabel } from '../ui/shared';
const blank: JournalDraft = { title: '', content: '', mood: '', prompt: '', tags: '', isFavorite: false };
export function JournalPage({ session, path: _path }: { session: Session; path?: string }) {
  const query = useQuery(session, 'journals'), action = useAction();
  const [draft, setDraft] = useState<JournalDraft>(blank), [selected, setSelected] = useState(''), [editing, setEditing] = useState(''), [confirm, setConfirm] = useState(false), [validation, setValidation] = useState(''), [search, setSearch] = useState(''), [favorites, setFavorites] = useState(false);
  const entry = query.items.find(x => x.id === selected), visible = filterJournals(query.items, search, favorites);
  const change = (key: keyof JournalDraft, value: string | boolean) => { setDraft({ ...draft, [key]: value }); setValidation(''); };
  return <><h1>{editing ? 'Edit jurnal' : 'Tulis jurnal'}</h1><form onSubmit={e => { e.preventDefault(); if (draft.content.trim().length < 10) { setValidation('Isi jurnal minimal 10 karakter setelah spasi tepi dihapus.'); return; } void action.run(async () => {
    const data = journalDraft(draft, new Date()); const saved = editing ? await session.update('journals', editing, { ...data, createdAt: query.items.find(x => x.id === editing)?.createdAt ?? data.createdAt }) : await session.create('journals', data);
    if (saved) { setEditing(''); setDraft(blank); } return saved;
  }); }}>
    <Field label="Judul (opsional)"><input value={draft.title} maxLength={200} onInput={e => change('title', e.currentTarget.value)} /></Field>
    <Field label="Prompt refleksi"><select value={draft.prompt} onChange={e => change('prompt', e.currentTarget.value)}><option value="">Tanpa prompt</option>{journalPrompts.map(prompt => <option key={prompt} value={prompt}>{prompt}</option>)}</select></Field>
    <button type="button" onClick={() => change('prompt', journalPrompts[Math.floor(Math.random() * journalPrompts.length)])}>Pilih prompt acak</button>
    {draft.prompt && <p>{draft.prompt}</p>}
    <Field label="Isi jurnal"><textarea required minLength={10} maxLength={50000} value={draft.content} onInput={e => change('content', e.currentTarget.value)} /></Field>
    <Field label="Mood jurnal (opsional)"><select value={draft.mood} onChange={e => change('mood', e.currentTarget.value)}><option value="">Tanpa mood</option>{moodOptions.map(m => <option value={m.value} key={m.value}>{m.label}</option>)}</select></Field>
    <Field label="Tag (pisahkan dengan koma)"><input value={draft.tags} maxLength={500} onInput={e => change('tags', e.currentTarget.value)} /></Field>
    <label class="choice"><input type="checkbox" checked={draft.isFavorite} onChange={e => change('isFavorite', e.currentTarget.checked)} />Simpan sebagai favorit</label>
    {validation && <p role="alert">{validation}</p>}<div class="actions"><button class="primary" disabled={action.busy}>{editing ? 'Simpan perubahan' : 'Simpan jurnal'}</button>{editing && <button type="button" onClick={() => { setEditing(''); setDraft(blank); setValidation(''); }}>Batal edit</button>}</div>
  </form><ActionFeedback action={action} />
    {entry && <section aria-label="Detail jurnal"><h2>{entry.title || 'Jurnal tanpa judul'}</h2>{entry.prompt && <p>{entry.prompt}</p>}<p style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p><p>{dateLabel(entry.createdAt)}</p>{entry.mood && <p>{moodOptions.find(m => m.value === entry.mood)?.label}</p>}{entry.tags?.length ? <p>Tag: {entry.tags.join(', ')}</p> : null}
    <div class="actions"><button disabled={action.busy} onClick={() => void action.run(() => session.update('journals', entry.id, { isFavorite: !entry.isFavorite }))}>{entry.isFavorite ? 'Hapus favorit' : 'Favoritkan'}</button><button onClick={() => { setEditing(entry.id); setDraft({ ...entry, tags: entry.tags?.join(', ') ?? '' }); setValidation(''); }}>Edit jurnal</button><button onClick={() => setConfirm(true)}>Hapus jurnal</button><button onClick={() => { setSelected(''); setConfirm(false); }}>Tutup detail</button></div>
    {confirm && <div role="group" aria-label="Konfirmasi hapus"><p>Hapus jurnal ini permanen? Tindakan ini tidak dapat dibatalkan.</p><div class="actions"><button disabled={action.busy} onClick={() => void action.run(async () => { const saved = await session.remove(entry.id); if (saved) { setSelected(''); setConfirm(false); } return saved; }, 'Jurnal dihapus.')}>Ya, hapus permanen</button><button onClick={() => setConfirm(false)}>Batal hapus</button></div></div>}</section>}
    <section><h2>Riwayat jurnal</h2><Field label="Cari jurnal"><input type="search" value={search} onInput={e => setSearch(e.currentTarget.value)} /></Field><label class="choice"><input type="checkbox" checked={favorites} onChange={e => setFavorites(e.currentTarget.checked)} />Hanya favorit</label>
    <QueryFeedback query={query} retry={() => void session.load('journals')} empty="Belum ada jurnal. Tulis catatan pertamamu di atas." />{!query.loading && query.items.length > 0 && !visible.length && <p>Tidak ada jurnal yang cocok dengan pencarian atau filter.</p>}
    {visible.map(item => <article key={item.id}><h3>{item.title || 'Jurnal tanpa judul'}</h3><p>{dateLabel(item.createdAt)}{item.isFavorite ? ' · Favorit' : ''}</p><button onClick={() => { setSelected(item.id); setConfirm(false); }}>Baca {item.title || 'jurnal tanpa judul'}</button></article>)}</section>
  </>;
}
