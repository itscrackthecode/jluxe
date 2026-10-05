'use client';

import Link from 'next/link';
import { Download, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enquiryStatuses, type EnquiryStatus } from '@/lib/db/types';

type EnquiryStatusValue = EnquiryStatus;
type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedServiceLabel: string;
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
  NEW: 'bg-emerald-50 text-emerald-800',
  CONTACTED: 'bg-sky-50 text-sky-800',
  IN_DISCUSSION: 'bg-amber-50 text-amber-800',
  CONVERTED: 'bg-[var(--viridian-950)]/8 text-[var(--viridian-950)]',
  CLOSED: 'bg-black/5 text-[var(--muted)]',
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
        const result = await response.json() as ListResponse | { success: false };
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
    <div>
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--viridian-950)]/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">INBOX</p>
          <h1 className="mt-2 font-display text-4xl">Enquiries</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/admin/api/enquiries/export" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--viridian-950)]/15 px-4 text-sm font-medium transition-colors hover:border-[var(--gold)]"><Download className="h-4 w-4" /> Export all</a>
          <a href={currentExportHref} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--viridian-800)]"><Download className="h-4 w-4" /> Export current</a>
          <p className="text-sm text-[var(--muted)]">{total} total</p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-[var(--viridian-950)]/15 py-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Search enquiries</span>
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Name, email, phone or message"
            maxLength={200}
            className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Status</span>
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All statuses</option>
            {enquiryStatuses.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p role="status" className="border-b border-[var(--viridian-950)]/15 py-10 text-sm text-[var(--muted)]">Loading enquiries...</p>
      ) : error ? (
        <div role="alert" className="border-b border-[var(--viridian-950)]/15 py-10">
          <p className="text-sm text-[var(--muted)]">We couldn’t load enquiries right now.</p>
          <button type="button" onClick={() => setRetry((current) => current + 1)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold hover:text-[var(--gold)]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="border-b border-[var(--viridian-950)]/15 py-10 text-sm text-[var(--muted)]">
          {search || status ? 'No enquiries match these filters.' : 'No enquiries have been received yet.'}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--viridian-950)]/15 text-xs font-medium text-[var(--muted)]">
                <th scope="col" className="px-3 py-3">Name</th>
                <th scope="col" className="px-3 py-3">Service</th>
                <th scope="col" className="px-3 py-3">Contact</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--viridian-950)]/10 align-top hover:bg-white/60">
                  <td className="px-3 py-4 font-medium">
                    <Link href={`/admin/enquiries/${item.id}`} className="hover:text-[var(--gold)]">{item.name}</Link>
                  </td>
                  <td className="px-3 py-4 text-[var(--muted)]">{item.interestedServiceLabel}</td>
                  <td className="px-3 py-4">
                    <a href={`mailto:${item.email}`} className="block hover:text-[var(--gold)]">{item.email}</a>
                    <a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`} className="mt-1 block text-xs text-[var(--muted)] hover:text-[var(--gold)]">{item.phone}</a>
                  </td>
                  <td className="px-3 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[item.status]}`}>{item.status.replaceAll('_', ' ')}</span></td>
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-[var(--muted)]">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Enquiry pages" className="mt-5 flex items-center justify-between border-b border-[var(--viridian-950)]/15 pb-5">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 text-sm font-medium disabled:opacity-40">Previous</button>
          <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="min-h-10 text-sm font-medium disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}