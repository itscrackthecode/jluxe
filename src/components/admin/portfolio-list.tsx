'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { publicationStatuses, type PublicationStatus } from '@/lib/db/types';
import type { PortfolioSort } from '@/lib/db/queries/portfolio';

type ServiceOption = { id: string; slug: string; title: string };
type WorkRow = {
  id: string;
  title: string;
  slug: string;
  serviceId: string;
  description: string;
  location: string | null;
  year: number | null;
  featured: boolean;
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  service: ServiceOption;
};

type ListResponse = {
  success: true;
  data: WorkRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const publicationBadge: Record<PublicationStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-800',
  PUBLISHED: 'bg-emerald-50 text-emerald-800',
  ARCHIVED: 'bg-black/5 text-[var(--muted)]',
};

export default function PortfolioList({ services }: { services: ServiceOption[] }) {
  const [search, setSearch] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [featured, setFeatured] = useState('');
  const [sort, setSort] = useState<PortfolioSort>('latest');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<WorkRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20', sort });
      if (search.trim()) params.set('search', search.trim());
      if (serviceId) params.set('serviceId', serviceId);
      if (publicationStatus) params.set('publicationStatus', publicationStatus);
      if (featured) params.set('featured', featured);

      try {
        const response = await fetch(`/admin/api/portfolio?${params.toString()}`, { signal: controller.signal });
        const result = await response.json() as ListResponse | { success: false; error?: string };
        if (!response.ok || !result.success) throw new Error('error' in result ? result.error : undefined);
        setItems(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
          setError(requestError instanceof Error ? requestError.message : 'Unable to load portfolio work.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [featured, page, publicationStatus, retry, search, serviceId, sort]);

  async function setStatus(work: WorkRow, nextStatus: PublicationStatus) {
    if (nextStatus === 'ARCHIVED' && !window.confirm(`Archive “${work.title}”?`)) return;

    try {
      const response = await fetch(`/admin/api/portfolio/${work.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: work.title,
          slug: work.slug,
          serviceId: work.serviceId,
          description: work.description,
          location: work.location,
          year: work.year,
          featured: work.featured,
          publicationStatus: nextStatus,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error ?? 'Unable to update work.');
      setRetry((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update work.');
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--viridian-950)]/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PORTFOLIO</p>
          <h1 className="mt-2 font-display text-4xl">Our Work</h1>
        </div>
        <Link href="/admin/our-work/new" className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--viridian-900)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">Add work</Link>
      </div>

      <div className="grid gap-3 border-b border-[var(--viridian-950)]/15 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Search title</span>
          <input type="search" value={search} maxLength={200} placeholder="Title" onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }} className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]" />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Service</span>
          <select value={serviceId} onChange={(event) => {
            setServiceId(event.target.value);
            setPage(1);
          }} className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]">
            <option value="">All services</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Publication</span>
          <select value={publicationStatus} onChange={(event) => {
            setPublicationStatus(event.target.value);
            setPage(1);
          }} className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]">
            <option value="">All publication states</option>
            {publicationStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Featured</span>
          <select value={featured} onChange={(event) => {
            setFeatured(event.target.value);
            setPage(1);
          }} className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]">
            <option value="">All work</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          <span className="mb-1.5 block">Sort</span>
          <select value={sort} onChange={(event) => {
            setSort(event.target.value as PortfolioSort);
            setPage(1);
          }} className="min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="featured">Featured first</option>
          </select>
        </label>
      </div>

      <p className="py-3 text-xs text-[var(--muted)]">{total} portfolio items</p>
      {error && <p role="alert" className="border-l-2 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p role="status" className="border-y border-[var(--viridian-950)]/15 py-10 text-sm text-[var(--muted)]">Loading work...</p>
      ) : error ? (
        <div className="border-y border-[var(--viridian-950)]/15 py-8">
          <button type="button" onClick={() => setRetry((current) => current + 1)} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold hover:text-[var(--gold)]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="border-y border-[var(--viridian-950)]/15 py-10 text-sm text-[var(--muted)]">
          {search || serviceId || publicationStatus || featured ? 'No work matches these filters.' : 'No portfolio work has been added yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[var(--viridian-950)]/15 text-xs font-medium text-[var(--muted)]">
              <th scope="col" className="px-3 py-3">Title</th>
              <th scope="col" className="px-3 py-3">Service</th>
              <th scope="col" className="px-3 py-3">Location</th>
              <th scope="col" className="px-3 py-3">Year</th>
              <th scope="col" className="px-3 py-3">Featured</th>
              <th scope="col" className="px-3 py-3">Publication</th>
              <th scope="col" className="px-3 py-3">Created</th>
              <th scope="col" className="px-3 py-3">Updated</th>
              <th scope="col" className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>{items.map((work) => (
              <tr key={work.id} className="border-b border-[var(--viridian-950)]/10 align-top hover:bg-white/60">
                <td className="px-3 py-4 font-medium">{work.title}</td>
                <td className="px-3 py-4">{work.service.title}</td>
                <td className="px-3 py-4 text-[var(--muted)]">{work.location ?? '—'}</td>
                <td className="px-3 py-4">{work.year ?? '—'}</td>
                <td className="px-3 py-4">{work.featured ? 'Yes' : 'No'}</td>
                <td className="px-3 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${publicationBadge[work.publicationStatus]}`}>{label(work.publicationStatus)}</span></td>
                <td className="whitespace-nowrap px-3 py-4 text-xs text-[var(--muted)]">{formatDate(work.createdAt)}</td>
                <td className="whitespace-nowrap px-3 py-4 text-xs text-[var(--muted)]">{formatDate(work.updatedAt)}</td>
                <td className="px-3 py-4">
                  <div className="flex min-w-40 flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium">
                    <Link href={`/admin/our-work/${work.id}`} className="hover:text-[var(--gold)]">Edit</Link>
                    {work.publicationStatus === 'PUBLISHED' ? (
                      <button type="button" onClick={() => void setStatus(work, 'DRAFT')} className="hover:text-[var(--gold)]">Unpublish</button>
                    ) : work.publicationStatus === 'DRAFT' ? (
                      <button type="button" onClick={() => void setStatus(work, 'PUBLISHED')} className="hover:text-[var(--gold)]">Publish</button>
                    ) : (
                      <button type="button" onClick={() => void setStatus(work, 'DRAFT')} className="hover:text-[var(--gold)]">Restore</button>
                    )}
                    {work.publicationStatus !== 'ARCHIVED' && (
                      <button type="button" onClick={() => void setStatus(work, 'ARCHIVED')} className="text-red-700 hover:text-red-900">Archive</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Portfolio pages" className="mt-5 flex items-center justify-between border-b border-[var(--viridian-950)]/15 pb-5">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 text-sm font-medium disabled:opacity-40">Previous</button>
          <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="min-h-10 text-sm font-medium disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
