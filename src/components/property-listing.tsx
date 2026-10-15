'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import MediaGallerySlider, { type GalleryImage } from '@/components/media-gallery-slider';
import { isPropertyOptionEnquirable } from '@/lib/property-availability';

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
  priceMinimum?: string | null;
  priceMaximum?: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  plotSize: string | null;
  plotSizeUnit: string | null;
  status: string;
  availability?: string;
  subtype?: string | null;
  bedrooms?: number | null;
  configurations?: Array<{ name: string; bedrooms: number | null; availability: string; priceMode: string; priceAmount: string | null; priceMinimum: string | null; priceMaximum: string | null; priceCurrency: string | null; priceBasis: string }>;
  representationType: 'CHANNEL_PARTNER' | 'AUTHORIZED_REPRESENTATIVE' | 'OTHER';
  createdAt: string;
  coverImage?: { storageKey: string; deliveryUrl?: string | null; altText: string | null } | null;
  media?: Array<{ storageKey: string; deliveryUrl?: string | null; altText: string | null; position: number }>;
};

type PropertyApiResponse = {
  success: boolean;
  data: ApiProperty[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function formatPropertyPrice(property: ApiProperty) {
  if (property.configurations?.length) {
    const applicable = property.configurations.filter((configuration) => isPropertyOptionEnquirable(configuration.availability));
    if (!applicable.length) return null;
    if (applicable.every((configuration) => configuration.priceMode === 'ON_REQUEST')) return 'Price on request';
    if (applicable.some((configuration) => configuration.priceMode === 'ON_REQUEST' || (!configuration.priceAmount && !configuration.priceMinimum && !configuration.priceMaximum))) return null;
    const currencies = new Set(applicable.map((configuration) => configuration.priceCurrency ?? 'INR'));
    const bases = new Set(applicable.map((configuration) => configuration.priceBasis));
    if (currencies.size !== 1 || bases.size !== 1) return null;

    const ranges = applicable.map((configuration) => {
      if (configuration.priceMode === 'RANGE') {
        if (!configuration.priceMinimum || !configuration.priceMaximum) return null;
        const minimum = Number(configuration.priceMinimum);
        const maximum = Number(configuration.priceMaximum);
        return Number.isFinite(minimum) && Number.isFinite(maximum) ? { minimum, maximum, isRange: true } : null;
      }
      const amount = Number(configuration.priceAmount);
      return Number.isFinite(amount) ? { minimum: amount, maximum: amount, isRange: false } : null;
    });
    if (ranges.some((range) => range === null)) return null;
    const priced = ranges.filter((range): range is NonNullable<typeof range> => range !== null);
    const minimum = Math.min(...priced.map((range) => range.minimum));
    const maximum = Math.max(...priced.map((range) => range.maximum));
    const currency = currencies.values().next().value ?? 'INR';
    let formattedMinimum: string;
    let formattedMaximum: string;
    try {
      const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
      formattedMinimum = formatter.format(minimum);
      formattedMaximum = formatter.format(maximum);
    } catch {
      formattedMinimum = `${new Intl.NumberFormat().format(minimum)} ${currency}`;
      formattedMaximum = `${new Intl.NumberFormat().format(maximum)} ${currency}`;
    }
    const isRange = priced.some((range) => range.isRange);
    const price = isRange && minimum !== maximum ? `${formattedMinimum} – ${formattedMaximum}` : minimum !== maximum ? `From ${formattedMinimum}` : formattedMinimum;
    const basis = bases.values().next().value;
    return basis && basis !== 'TOTAL' ? `${price} / ${basis.toLowerCase().replaceAll('_', ' ')}` : price;
  }
  if (property.priceMinimum || property.priceMaximum) {
    const money = (value: string | null | undefined) => value ? new Intl.NumberFormat(undefined, { style: 'currency', currency: property.priceCurrency ?? 'INR', maximumFractionDigits: 2 }).format(Number(value)) : null;
    const minimum = money(property.priceMinimum);
    const maximum = money(property.priceMaximum);
    if (minimum && maximum) return `${minimum} – ${maximum}`;
    if (minimum) return `From ${minimum}`;
    if (maximum) return `Up to ${maximum}`;
  }
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
  const configurationSummary = (() => {
    const configurations = property.configurations ?? [];
    const bedrooms = [...new Set(configurations.map((item) => item.bedrooms).filter((value): value is number => value !== null))].sort((a, b) => a - b);
    if (bedrooms.length) return `${bedrooms.slice(0, -1).join(', ')}${bedrooms.length > 1 ? ' & ' : ''}${bedrooms.at(-1)} BHK`;
    if (configurations.length) return configurations.length === 1 ? configurations[0].name : `${configurations.length} configurations`;
    return null;
  })();
  const plotSize = formatPlotSize(property);
  const images: GalleryImage[] = [
    ...(property.coverImage ? [{ ...property.coverImage, id: property.coverImage.storageKey }] : []),
    ...(property.media ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ ...image, id: image.storageKey })),
  ].filter((image, index, all) => all.findIndex((candidate) => candidate.storageKey === image.storageKey) === index);

  return (
    <article data-reveal className="premium-card min-w-0 overflow-hidden rounded-lg border border-[var(--viridian-950)]/12 bg-white">
      <div className="premium-card-media overflow-hidden bg-[var(--sand)] text-sm text-[var(--muted)]">
        <MediaGallerySlider
          images={images}
          fallbackType="property"
          aspectRatioClassName="aspect-[4/3] sm:aspect-[16/10]"
          showThumbnails={false}
          imageFit="smart"
          imageBackgroundClassName="bg-[var(--cream)]"
          touchControls
        />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 break-words font-display text-lg leading-snug text-[var(--viridian-950)] sm:text-xl">{property.title}</h3>
          {price && <p className="max-w-[48%] shrink-0 text-right text-sm font-semibold leading-5 text-[var(--viridian-950)]">{price}</p>}
        </div>
        {property.location && <p className="mt-1.5 truncate text-sm text-[var(--muted)]">{property.location}</p>}
        {configurationSummary && <p className="mt-2 text-sm font-medium text-[var(--viridian-800)]">{configurationSummary}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--viridian-950)]/10 pt-3 text-xs text-[var(--muted)]">
          <span>{formatPropertyType(property.propertyType)}{property.subtype ? ` · ${property.subtype}` : ''}</span>
          <span aria-hidden="true" className="text-[var(--viridian-950)]/30">•</span>
          <span className="text-[var(--viridian-800)]">{formatPropertyType(property.availability ?? property.status)}</span>
          {plotSize && <><span aria-hidden="true" className="text-[var(--viridian-950)]/30">•</span><span>{plotSize}</span></>}
        </div>
        <Link href={`/properties/${property.slug}`} className="touch-press mt-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
          View Property <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={`/properties/${property.slug}#property-enquiry`} className="touch-press ml-5 mt-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[var(--viridian-800)] transition-colors hover:text-[var(--gold)]">Enquire <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

export default function PropertyListing() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [status, setStatus] = useState('');
  const [availability, setAvailability] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
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
    if (availability) params.set('availability', availability);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (/^\d+(\.\d+)?$/.test(priceMin.trim())) params.set('priceMin', priceMin.trim());
    if (/^\d+(\.\d+)?$/.test(priceMax.trim())) params.set('priceMax', priceMax.trim());

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
  }, [availability, bedrooms, location, page, priceMax, priceMin, propertyType, requestVersion, sort, status]);

  const resetFilters = () => {
    setLocation('');
    setPropertyType('');
    setStatus('');
    setAvailability('');
    setBedrooms('');
    setPriceMin('');
    setPriceMax('');
    setSort('latest');
    setPage(1);
  };

  const hasActiveFilters = Boolean(location.trim() || propertyType || status || availability || bedrooms || priceMin.trim() || priceMax.trim());

  return (
    <section className="bg-[var(--cream)] py-12 sm:py-16" data-reveal>
      <div className="container-xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h2 className="font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">Browse opportunities</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--muted)]">{total} listed</span>
            {hasActiveFilters && !loading && !error && (
              <button type="button" onClick={resetFilters} className="touch-press inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
                <RotateCcw className="h-4 w-4" /> Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-y border-[var(--viridian-950)]/15 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Location</span>
            <input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} className={fieldClassName} placeholder="Any location" />
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]"><span className="mb-1.5 block">Availability</span><select value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1); }} className={fieldClassName}><option value="">Any availability</option>{['AVAILABLE','LIMITED','COMING_SOON','RESERVED','SOLD_OUT','UNAVAILABLE'].map((value)=><option key={value} value={value}>{formatPropertyType(value)}</option>)}</select></label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]"><span className="mb-1.5 block">Bedrooms / BHK</span><select value={bedrooms} onChange={(event) => { setBedrooms(event.target.value); setPage(1); }} className={fieldClassName}><option value="">Any</option>{[1,2,3,4,5,6].map((value)=><option key={value} value={value}>{value}+ BHK</option>)}</select></label>
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
          <div className="min-w-0 text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Budget</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={priceMin}
                onChange={(event) => { setPriceMin(event.target.value); setPage(1); }}
                className={fieldClassName}
                placeholder="Min"
                aria-label="Minimum budget"
              />
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={priceMax}
                onChange={(event) => { setPriceMax(event.target.value); setPage(1); }}
                className={fieldClassName}
                placeholder="Max"
                aria-label="Maximum budget"
              />
            </div>
          </div>
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
          <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3" data-reveal-stagger>
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
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">We&apos;re currently updating our available property opportunities. Looking for something specific? Make an enquiry and tell us what you have in mind.</p>
            </div>
            <Link href="/contact/buy-property" className="touch-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--viridian-950)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-950)]">
              Make an Enquiry <ArrowRight className="h-4 w-4" />
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
