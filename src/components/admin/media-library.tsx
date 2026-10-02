'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Upload } from 'lucide-react';
import { fallbackImages, type FallbackImageType } from '@/lib/media';

type MediaRow = { id: string; storageKey: string; provider: string; mimeType: string; byteSize: string; width: number | null; height: number | null; createdAt: string; propertyReferences: number; portfolioReferences: number };
type MediaResponse = { success: true; data: MediaRow[]; pagination: { page: number; total: number; totalPages: number } };

const defaults: Array<[FallbackImageType, string]> = [['property', 'Property Default'], ['portfolio', 'Portfolio / Work Default'], ['service', 'Service Default'], ['general', 'General Default']];

function formatBytes(value: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [search, setSearch] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search.trim()) params.set('search', search.trim());
    if (mimeType) params.set('mimeType', mimeType);
    fetch(`/admin/api/media?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as MediaResponse | { success: false; error?: string };
        if (!response.ok || !result.success) throw new Error('error' in result ? result.error : 'Unable to load media.');
        setItems(result.data); setTotal(result.pagination.total); setTotalPages(result.pagination.totalPages); setError('');
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load media.'); });
    return () => controller.abort();
  }, [mimeType, page, reload, search]);

  const remove = async (id: string) => {
    const response = await fetch(`/admin/api/media/${id}`, { method: 'DELETE' });
    const result = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !result.success) { window.alert(result.error ?? 'Unable to delete media.'); return; }
    setReload((value) => value + 1);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--viridian-950)]/15 pb-6 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">LIBRARY</p><h1 className="mt-2 font-display text-4xl">Media</h1></div>
        <button type="button" disabled className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[var(--viridian-900)] px-5 text-sm font-semibold text-white opacity-60"><Upload className="h-4 w-4" /> Upload pending storage</button>
      </div>
      <p className="mt-4 border-l-2 border-[var(--gold)] bg-[var(--sand)]/35 px-4 py-3 text-sm text-[var(--muted)]">No external storage provider is configured. Media metadata and default assets are available now; uploads will be enabled after storage is configured.</p>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search storage key" className="min-h-11 flex-1 border border-[var(--viridian-950)]/15 bg-white px-3 text-sm outline-none focus:border-[var(--gold)]" />
          <select value={mimeType} onChange={(event) => { setMimeType(event.target.value); setPage(1); }} className="min-h-11 border border-[var(--viridian-950)]/15 bg-white px-3 text-sm outline-none focus:border-[var(--gold)]"><option value="">All file types</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option><option value="image/avif">AVIF</option></select>
        </div>
        {error ? <div role="alert" className="border-y border-[var(--viridian-950)]/15 py-8 text-sm">{error}<button type="button" onClick={() => setReload((value) => value + 1)} className="ml-4 inline-flex items-center gap-2 font-semibold"><RotateCcw className="h-4 w-4" />Retry</button></div> : items.length === 0 ? <p className="border-y border-[var(--viridian-950)]/15 py-10 text-sm text-[var(--muted)]">No media metadata has been added yet.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="border border-black/10 bg-white p-4"><div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)]"><span className="px-4 text-center text-xs text-[var(--muted)]">{item.storageKey}</span></div><p className="mt-4 break-all text-sm font-semibold">{item.storageKey}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]"><div><dt>Type</dt><dd>{item.mimeType}</dd></div><div><dt>Size</dt><dd>{formatBytes(item.byteSize)}</dd></div><div><dt>Dimensions</dt><dd>{item.width && item.height ? `${item.width} × ${item.height}` : '—'}</dd></div><div><dt>Provider</dt><dd>{item.provider}</dd></div><div><dt>Used by</dt><dd>{item.propertyReferences + item.portfolioReferences} references</dd></div><div><dt>Uploaded</dt><dd>{new Date(item.createdAt).toLocaleDateString()}</dd></div></dl><button type="button" onClick={() => remove(item.id)} className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-red-700"><Trash2 className="h-4 w-4" />Delete</button></article>)}</div>}
        <p className="mt-4 text-xs text-[var(--muted)]">{total} media items</p>
        {totalPages > 1 && <div className="mt-4 flex items-center justify-between border-t border-[var(--viridian-950)]/15 pt-4 text-sm"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-40">Next</button></div>}
      </section>

      <section className="mt-12 border-t border-[var(--viridian-950)]/15 pt-8"><p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">DEFAULT ASSETS</p><h2 className="mt-2 font-display text-3xl">JLUXE fallback images</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{defaults.map(([type, label]) => <article key={type} className="border border-black/10 bg-white p-3"><img src={fallbackImages[type]} alt={`${label} preview`} className="aspect-[4/3] w-full object-cover" /><p className="mt-3 text-sm font-semibold">{label}</p><p className="mt-1 break-all text-xs text-[var(--muted)]">{fallbackImages[type]}</p></article>)}</div></section>
    </div>
  );
}