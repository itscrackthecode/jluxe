'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/data';
import { getFallbackImage } from '@/lib/media';

const fieldClassName = 'min-h-11 w-full min-w-0 border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-base text-[var(--viridian-950)] outline-none transition-colors focus:border-[var(--gold)] disabled:cursor-not-allowed disabled:bg-[var(--cream)] md:text-sm';
const pageSize = 12;
const propertyTypes = ['PLOT', 'VILLA', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'];
const statusOptions = ['AVAILABLE', 'UNDER_OFFER', 'SOLD', 'LEASED', 'WITHDRAWN'];

type ApiProperty = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  propertyType: string;
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  plotSize: string | null;
  plotSizeUnit: string | null;
  status: string;
  representationType: 'CHANNEL_PARTNER' | 'AUTHORIZED_REPRESENTATIVE' | 'OTHER';
  createdAt: string;
};

type PropertyApiResponse = {
  success: boolean;
  data: ApiProperty[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function formatPropertyPrice(property: ApiProperty) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : null;

  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return null;

  let formattedAmount = new Intl.NumberFormat().format(amount);
  if (property.priceCurrency) {
    try {
      formattedAmount = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: property.priceCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      formattedAmount = `${formattedAmount} ${property.priceCurrency}`;
    }
  }

  return property.priceMode === 'STARTING_FROM' ? `From ${formattedAmount}` : formattedAmount;
}

function formatPropertyType(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlotSize(property: ApiProperty) {
  if (!property.plotSize) return null;

  const units: Record<string, string> = {
    SQFT: 'sq ft',
    SQM: 'sq m',
    ACRE: 'acre',
    HECTARE: 'hectare',
  };
  const amount = new Intl.NumberFormat().format(Number(property.plotSize));

  return property.plotSizeUnit ? `${amount} ${units[property.plotSizeUnit] ?? property.plotSizeUnit}` : amount;
}

function PropertyCard({ property }: { property: ApiProperty }) {
  const price = formatPropertyPrice(property);
  const plotSize = formatPlotSize(property);

  return (
    <article data-reveal className="premium-card min-w-0 border-b border-[var(--viridian-950)]/15 pb-6">
      <div className="premium-card-media flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] text-sm text-[var(--muted)]">
        <img src={getFallbackImage('property')} alt="JLUXE property placeholder" className="h-full w-full object-cover" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--muted)]">
        <span>{formatPropertyType(property.propertyType)}</span>
        <span className="border-l border-[var(--viridian-950)]/20 pl-3 text-[var(--viridian-800)]">{formatPropertyType(property.status)}</span>
      </div>
      <h3 className="mt-3 font-display text-2xl leading-snug text-[var(--viridian-950)]">{property.title}</h3>
      {property.location && <p className="mt-2 text-sm text-[var(--muted)]">{property.location}</p>}
      {property.description && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{property.description}</p>}
      {(price || plotSize) && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--viridian-950)]/10 pt-4 text-sm">
          {price && (
            <div>
              <dt className="text-xs text-[var(--muted)]">Price</dt>
              <dd className="mt-1 font-medium text-[var(--viridian-950)]">{price}</dd>
            </div>
          )}
          {plotSize && (
            <div>
              <dt className="text-xs text-[var(--muted)]">Plot size</dt>
              <dd className="mt-1 font-medium text-[var(--viridian-950)]">{plotSize}</dd>
            </div>
          )}
        </dl>
      )}
      <Link href={`/properties/${property.slug}`} className="touch-press mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
        View Property <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function PropertyListing() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [page, setPage] = useState(1);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort });
    if (location.trim()) params.set('location', location.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (status) params.set('status', status);

    setLoading(true);
    setError(null);

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/properties?${params.toString()}`, { signal: controller.signal });
        const result = await response.json() as PropertyApiResponse | { success: false; error?: string };

        if (!response.ok || !result.success) {
          throw new Error('error' in result ? result.error : undefined);
        }

        setProperties(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setError('We couldn’t retrieve property opportunities right now. Please try again.');
          setProperties([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [location, page, propertyType, requestVersion, sort, status]);

  const resetFilters = () => {
    setLocation('');
    setPropertyType('');
    setStatus('');
    setSort('latest');
    setPage(1);
  };

  const hasActiveFilters = Boolean(location || propertyType || status);

  return (
    <section className="bg-[var(--cream)] py-12 sm:py-16" data-reveal>
      <div className="container-xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">Browse opportunities</h2>
          <span className="text-xs text-[var(--muted)]">{total} listed</span>
        </div>

        <div className="grid gap-3 border-y border-[var(--viridian-950)]/15 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Location</span>
            <input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} className={fieldClassName} placeholder="Any location" />
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Property Type</span>
            <select value={propertyType} onChange={(event) => { setPropertyType(event.target.value); setPage(1); }} className={fieldClassName}>
              <option value="">All types</option>
              {propertyTypes.map((type) => <option key={type} value={type}>{formatPropertyType(type)}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={fieldClassName}>
              <option value="">All statuses</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)] sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block">Sort by</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className={fieldClassName}>
              <option value="latest">Latest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p role="status" className="mt-8 border-y border-[var(--viridian-950)]/15 py-8 text-sm text-[var(--muted)]">Loading property opportunities...</p>
        ) : error ? (
          <div role="alert" className="mt-8 border-y border-[var(--viridian-950)]/15 py-8">
            <p className="text-sm text-[var(--muted)]">{error}</p>
            <button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="touch-press mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : properties.length > 0 ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        ) : hasActiveFilters ? (
          <div className="mt-8 flex flex-col items-start gap-4 border-b border-[var(--viridian-950)]/15 py-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">No property opportunities match these filters.</p>
            <button type="button" onClick={resetFilters} className="touch-press inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
              <RotateCcw className="h-4 w-4" /> Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-start gap-4 border-b border-[var(--viridian-950)]/15 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="font-display text-2xl text-[var(--viridian-950)] sm:text-3xl">No properties currently available.</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">We&apos;re currently updating our available property opportunities. Looking for something specific? Talk to JLUXE.</p>
            </div>
            <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Talk to JLUXE <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Property pages" className="mt-8 flex items-center justify-between border-b border-[var(--viridian-950)]/15 pb-5">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="touch-press inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40">
              <ArrowRight className="h-4 w-4 rotate-180" /> Previous
            </button>
            <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="touch-press inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </nav>
        )}
        <p className="mt-5 max-w-2xl text-xs leading-5 text-[var(--muted)]">
          JLUXE may represent property opportunities as a channel partner; listings are shared by their respective owners or partners.
        </p>
      </div>
    </section>
  );
}