'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  propertyStatuses,
  propertyTypes,
  publicationStatuses,
  type PropertyStatus,
  type PropertyType,
  type PublicationStatus,
} from '@/lib/db/types';

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  propertyType: PropertyType;
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  status: PropertyStatus;
  publicationStatus: PublicationStatus;
  updatedAt: string;
};

type ListResponse = {
  success: true;
  data: PropertyRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priceLabel(property: PropertyRow) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : '—';
  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return '—';
  let formatted = new Intl.NumberFormat().format(amount);
  if (property.priceCurrency) {
    try {
      formatted = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: property.priceCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      formatted = `${formatted} ${property.priceCurrency}`;
    }
  }
  return property.priceMode === 'STARTING_FROM' ? `From ${formatted}` : formatted;
}

const publicationBadge: Record<PropertyRow['publicationStatus'], string> = {
  DRAFT: 'bg-amber-950/80 border border-amber-500/40 text-amber-300',
  PUBLISHED: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300',
  ARCHIVED: 'bg-white/10 border border-white/20 text-[#9caaa4]',
};

export default function PropertyList() {
  const [search, setSearch] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PropertyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('saved')) return;
    setSavedNotice(true);
    window.history.replaceState(null, '', window.location.pathname);
    const timer = window.setTimeout(() => setSavedNotice(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  async function removeProperty(property: PropertyRow) {
    if (!window.confirm(`Delete “${property.title}”? Related enquiries will be preserved.`)) return;
    const response = await fetch(`/admin/api/properties/${property.id}`, { method: 'DELETE' });
    const result = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !result.success) {
      window.alert(result.error ?? 'Unable to delete property.');
      return;
    }
    setRetry((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (publicationStatus) params.set('publicationStatus', publicationStatus);
      if (status) params.set('status', status);

      try {
        const response = await fetch(`/admin/api/properties?${params.toString()}`, { signal: controller.signal });
        const result = (await response.json()) as ListResponse | { success: false };
        if (!response.ok || !result.success) throw new Error('Property list request failed.');
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
  }, [page, publicationStatus, retry, search, status]);

  return (
    <div className="text-[#f5f1e8]">
      <div className="flex flex-col justify-between gap-4 border-b border-white/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">LISTINGS</p>
          <h1 className="mt-2 font-display text-4xl text-white">Properties</h1>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90"
        >
          Add property
        </Link>
      </div>

      {savedNotice && (
        <div role="status" className="mt-4 border-l-2 border-emerald-500 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">
          Property saved successfully.
        </div>
      )}

      <div className="grid gap-3 border-b border-white/15 py-4 sm:grid-cols-[minmax(0,1fr)_200px_200px]">
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Search</span>
          <input
            type="search"
            value={search}
            maxLength={200}
            placeholder="Title or location"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]"
          />
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
            {publicationStatuses.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[#9caaa4]">
          <span className="mb-1.5 block">Property status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
          >
            <option value="">All property statuses</option>
            {propertyStatuses.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="py-3 text-xs text-[#9caaa4]">{total} properties</p>
      {loading ? (
        <p role="status" className="border-y border-white/15 py-10 text-sm text-[#9caaa4]">
          Loading properties...
        </p>
      ) : error ? (
        <div role="alert" className="border-y border-white/15 py-10">
          <p className="text-sm text-[#9caaa4]">We couldn’t load properties right now.</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:underline"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="border-y border-white/15 py-10 text-sm text-[#9caaa4]">
          {search || publicationStatus || status
            ? 'No properties match these filters.'
            : 'No properties have been added yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#08201b]">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-[#051714] text-xs font-medium text-[#9caaa4]">
                <th scope="col" className="px-3 py-3">Title</th>
                <th scope="col" className="px-3 py-3">Location</th>
                <th scope="col" className="px-3 py-3">Property type</th>
                <th scope="col" className="px-3 py-3">Price</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Publication</th>
                <th scope="col" className="px-3 py-3">Updated</th>
                <th scope="col" className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((property) => (
                <tr key={property.id} className="border-b border-white/10 align-top transition-colors hover:bg-[#0c2b25]">
                  <td className="px-3 py-4 font-medium text-white">
                    <Link href={`/admin/properties/${property.id}`} className="hover:text-[var(--gold)]">
                      {property.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-[#9caaa4]">{property.location ?? '—'}</td>
                  <td className="px-3 py-4 text-[#f5f1e8]">{label(property.propertyType)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-[#f5f1e8]">{priceLabel(property)}</td>
                  <td className="px-3 py-4 text-[#f5f1e8]">{label(property.status)}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${publicationBadge[property.publicationStatus]}`}>
                      {label(property.publicationStatus)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-[#9caaa4]">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(property.updatedAt),
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => void removeProperty(property)}
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
        <nav aria-label="Property pages" className="mt-5 flex items-center justify-between border-b border-white/15 pb-5">
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