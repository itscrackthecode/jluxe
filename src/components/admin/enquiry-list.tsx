'use client';

import Link from 'next/link';
import { Download, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enquiryStatuses, type EnquiryStatus } from '@/lib/db/types';

type EnquiryStatusValue = EnquiryStatus;
type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedServiceLabel: string;
  enquiryType: string;
  status: EnquiryStatusValue;
  createdAt: string;
  property: { title: string; slug: string; location: string | null } | null;
};
type ListResponse = {
  success: true;
  data: EnquiryRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const statusStyles: Record<EnquiryStatusValue, string> = {
  NEW: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300',
  CONTACTED: 'bg-sky-950/80 border border-sky-500/40 text-sky-300',
  IN_DISCUSSION: 'bg-amber-950/80 border border-amber-500/40 text-amber-300',
  CONVERTED: 'bg-teal-950/80 border border-teal-500/40 text-teal-300',
  CLOSED: 'bg-white/10 border border-white/20 text-[#9caaa4]',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function EnquiryList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EnquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function leaveSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }

  async function deleteSelected() {
    setDeleting(true);
    setActionMessage('');
    try {
      const response = await fetch('/admin/api/enquiries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const result = await response.json() as { success?: boolean; error?: string; deleted?: number };
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to delete selected enquiries.');
      setActionMessage(`${result.deleted ?? selectedIds.size} ${result.deleted === 1 ? 'enquiry' : 'enquiries'} deleted.`);
      leaveSelectionMode();
      setRetry((current) => current + 1);
    } catch (error) {
      setConfirmDelete(false);
      setActionMessage(error instanceof Error ? error.message : 'Unable to delete selected enquiries.');
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);

      try {
        const response = await fetch(`/admin/api/enquiries?${params.toString()}`, { signal: controller.signal });
        const result = (await response.json()) as ListResponse | { success: false };
        if (!response.ok || !result.success) throw new Error('Enquiry list request failed.');
        setItems(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, retry, search, status]);

  const exportParams = new URLSearchParams();
  if (search.trim()) exportParams.set('search', search.trim());
  if (status) exportParams.set('status', status);
  const currentExportHref = `/admin/api/enquiries/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

  return (
    <div className="text-[#f5f1e8]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">INBOX</p>
          <h1 className="mt-2 font-display text-4xl text-white">Enquiries</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectionMode ? (
            <>
              <span className="text-sm text-[#9caaa4]" aria-live="polite">{selectedIds.size} selected (up to 50 per deletion)</span>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" /> Confirm delete
              </button>
              <button type="button" onClick={leaveSelectionMode} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-[#f5f1e8] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setSelectionMode(true); setActionMessage(''); }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-400/50 px-4 text-sm font-medium text-red-200 transition-colors hover:bg-red-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              <Trash2 className="h-4 w-4" /> Delete enquiries
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Native navigation is required to download the API response. */}
          <a
            href="/admin/api/enquiries/export"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-[#f5f1e8] transition-colors hover:bg-white/10 hover:border-white/40"
          >
            <Download className="h-4 w-4" /> Export all
          </a>
          <a
            href={currentExportHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--gold)] px-4 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90"
          >
            <Download className="h-4 w-4" /> Export current
          </a>
          <p className="text-sm text-[#9caaa4]">{total} total</p>
        </div>
      </div>

      {actionMessage && <p role="status" className="border-b border-white/15 py-3 text-sm text-[#f5f1e8]">{actionMessage}</p>}

      <div className="grid gap-3 border-b border-white/15 py-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Search enquiries</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Name, email, phone or message"
            maxLength={200}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All statuses</option>
            {enquiryStatuses.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p role="status" className="border-b border-white/15 py-10 text-sm text-[#9caaa4]">
          Loading enquiries...
        </p>
      ) : error ? (
        <div role="alert" className="border-b border-white/15 py-10">
          <p className="text-sm text-[#9caaa4]">We couldn’t load enquiries right now.</p>
          <button
            type="button"
            onClick={() => setRetry((current) => current + 1)}
            className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:underline"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="border-b border-white/15 py-10 text-sm text-[#9caaa4]">
          {search || status ? 'No enquiries match these filters.' : 'No enquiries have been received yet.'}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-[#08201b]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-[#051714] text-xs font-medium text-[#9caaa4]">
                {selectionMode && <th scope="col" className="w-12 px-3 py-3"><span className="sr-only">Select enquiry</span></th>}
                <th scope="col" className="px-3 py-3">Name</th>
                <th scope="col" className="px-3 py-3">Service</th>
                <th scope="col" className="px-3 py-3">Contact</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/10 align-top transition-colors hover:bg-[#0c2b25]">
                  {selectionMode && <td className="px-3 py-4"><input type="checkbox" checked={selectedIds.has(item.id)} disabled={!selectedIds.has(item.id) && selectedIds.size >= 50} onChange={() => toggleSelected(item.id)} aria-label={`Select enquiry from ${item.name}`} className="h-4 w-4 accent-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40" /></td>}
                  <td className="px-3 py-4 font-medium text-white">
                    <Link href={`/admin/enquiries/${item.id}`} className="hover:text-[var(--gold)]">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-[#f5f1e8]">{item.interestedServiceLabel}<span className="mt-1 block text-[10px] text-[#9caaa4]">{item.enquiryType.replaceAll('_', ' ')}</span></td>
                  <td className="px-3 py-4">
                    <a href={`mailto:${item.email}`} className="block text-white hover:text-[var(--gold)]">
                      {item.email}
                    </a>
                    <a
                      href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}
                      className="mt-1 block text-xs text-[#9caaa4] hover:text-[var(--gold)]"
                    >
                      {item.phone}
                    </a>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[item.status]}`}>
                      {item.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-[#9caaa4]">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setConfirmDelete(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-enquiries-title" aria-describedby="delete-enquiries-description" className="w-full max-w-lg border border-white/15 bg-[#08201b] p-6 text-[#f5f1e8] shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-red-300">PERMANENT ACTION</p>
                <h2 id="delete-enquiries-title" className="mt-2 font-display text-2xl text-white">Delete selected enquiries?</h2>
              </div>
              <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} aria-label="Close confirmation" className="rounded-full p-2 text-[#9caaa4] hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><X className="h-5 w-5" /></button>
            </div>
            <p id="delete-enquiries-description" className="mt-4 text-sm leading-6 text-[#c6d0cb]">
              You are about to permanently delete {selectedIds.size} {selectedIds.size === 1 ? 'enquiry' : 'enquiries'} and its stored enquiry details. This cannot be undone. The related property listings, if any, will not be deleted.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="min-h-10 rounded-full border border-white/20 px-4 text-sm font-medium hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] disabled:opacity-50">Keep enquiries</button>
              <button type="button" disabled={deleting} onClick={deleteSelected} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
            </div>
          </section>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Enquiry pages" className="mt-5 flex items-center justify-between border-b border-white/15 pb-5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="min-h-10 text-sm font-medium text-[#f5f1e8] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-[#9caaa4]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="min-h-10 text-sm font-medium text-[#f5f1e8] disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
