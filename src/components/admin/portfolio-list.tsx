'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { publicationStatuses, type PublicationStatus, type ServiceCategory } from '@/lib/db/types';
import type { PortfolioServiceOption, PortfolioSort } from '@/lib/db/queries/portfolio';

type ServiceOption = PortfolioServiceOption;
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

const publicationBadge: Record<PublicationStatus, string> = {
  DRAFT: 'bg-amber-950/80 border border-amber-500/40 text-amber-300',
  PUBLISHED: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300',
  ARCHIVED: 'bg-white/10 border border-white/20 text-[#9caaa4]',
};

export default function PortfolioList({ services, categories }: { services: ServiceOption[]; categories: ServiceCategory[] }) {
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
        const result = (await response.json()) as ListResponse | { success: false; error?: string };
        if (!response.ok || !result.success) throw new Error('error' in result ? result.error : 'Portfolio list request failed.');
        setItems(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        if (!controller.signal.aborted) {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
          setError(err instanceof Error ? err.message : 'Unable to load portfolio work.');
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

  async function removeWork(work: WorkRow) {
    if (!window.confirm(`Delete “${work.title}”? Its media associations may be removed, but media records are preserved.`)) return;
    const response = await fetch(`/admin/api/portfolio/${work.id}`, { method: 'DELETE' });
    const result = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !result.success) {
      setError(result.error ?? 'Unable to delete work.');
      return;
    }
    setRetry((current) => current + 1);
  }

  return (
    <div className="text-[#f5f1e8]">
      <div className="flex flex-col justify-between gap-4 border-b border-white/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PORTFOLIO</p>
          <h1 className="mt-2 font-display text-4xl text-white">Our Work</h1>
        </div>
        <Link
          href="/admin/our-work/new"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90"
        >
          Add work
        </Link>
      </div>

      <div className="grid gap-3 border-b border-white/15 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Search title</span>
          <input
            type="search"
            value={search}
            maxLength={200}
            placeholder="Title"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Service</span>
          <select
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All services</option>
            {(() => {
              return categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {services.filter((s) => s.categoryIds.includes(category.id)).map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Publication</span>
          <select
            value={publicationStatus}
            onChange={(event) => {
              setPublicationStatus(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All publication states</option>
            {publicationStatuses.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Featured</span>
          <select
            value={featured}
            onChange={(event) => {
              setFeatured(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All work</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Sort</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as PortfolioSort);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="featured">Featured first</option>
          </select>
        </label>
      </div>

      <p className="py-3 text-xs text-[#9caaa4]">{total} portfolio items</p>
      {error && (
        <p role="alert" className="border-l-2 border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="border-y border-white/15 py-10 text-sm text-[#9caaa4]">
          Loading work...
        </p>
      ) : error ? (
        <div className="border-y border-white/15 py-8">
          <button
            type="button"
            onClick={() => setRetry((current) => current + 1)}
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:underline"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="border-y border-white/15 py-10 text-sm text-[#9caaa4]">
          {search || serviceId || publicationStatus || featured
            ? 'No work matches these filters.'
            : 'No portfolio work has been added yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#08201b]">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-[#051714] text-xs font-medium text-[#9caaa4]">
                <th scope="col" className="px-3 py-3">Title</th>
                <th scope="col" className="px-3 py-3">Service</th>
                <th scope="col" className="px-3 py-3">Location</th>
                <th scope="col" className="px-3 py-3">Year</th>
                <th scope="col" className="px-3 py-3">Featured</th>
                <th scope="col" className="px-3 py-3">Publication</th>
                <th scope="col" className="px-3 py-3">Created</th>
                <th scope="col" className="px-3 py-3">Updated</th>
                <th scope="col" className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((work) => (
                <tr key={work.id} className="border-b border-white/10 align-top transition-colors hover:bg-[#0c2b25]">
                  <td className="px-3 py-4 font-medium text-white">
                    <Link href={`/admin/our-work/${work.id}`} className="hover:text-[var(--gold)]">
                      {work.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-[#f5f1e8]">
                    <span className="block text-xs text-[#9caaa4]">{work.service.categories.join(', ') || '—'}</span>
                    <span className="text-[var(--gold)]">#{work.service.title}</span>
                  </td>
                  <td className="px-3 py-4 text-[#9caaa4]">{work.location ?? '—'}</td>
                  <td className="px-3 py-4 text-[#f5f1e8]">{work.year ?? '—'}</td>
                  <td className="px-3 py-4 text-[#f5f1e8]">
                    {work.featured ? (
                      <span className="rounded bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--gold)]">
                        Featured
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${publicationBadge[work.publicationStatus]}`}>
                      {label(work.publicationStatus)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-[#9caaa4]">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(work.createdAt))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-[#9caaa4]">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(work.updatedAt))}
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => void removeWork(work)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Portfolio pages" className="mt-5 flex items-center justify-between border-b border-white/15 pb-5">
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
