'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '@/lib/data';
import { filterPropertyListings, propertyListings, propertyTypes, sortPropertyListings, type PropertyListing, type PropertySort } from '@/lib/properties';

const fieldClassName = 'min-h-11 w-full min-w-0 border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none transition-colors focus:border-[var(--gold)] disabled:cursor-not-allowed disabled:bg-[var(--cream)]';

function PropertyCard({ property }: { property: PropertyListing }) {
  const leadImage = property.images?.[0];

  return (
    <article className="min-w-0 border-b border-[var(--viridian-950)]/15 pb-6">
      {leadImage && (
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sand)]">
          <Image src={leadImage.src} alt={leadImage.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 hover:scale-[1.02]" />
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--muted)]">
        {property.propertyType && <span>{property.propertyType}</span>}
        {property.status && (
          <span className="border-l border-[var(--viridian-950)]/20 pl-3 text-[var(--viridian-800)]">{property.status}</span>
        )}
      </div>
      <h3 className="mt-3 font-display text-2xl leading-snug text-[var(--viridian-950)]">{property.title}</h3>
      {property.location && <p className="mt-2 text-sm text-[var(--muted)]">{property.location}</p>}
      {property.description && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{property.description}</p>}
      {(property.price || property.plotSize) && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--viridian-950)]/10 pt-4 text-sm">
          {property.price && (
            <div>
              <dt className="text-xs text-[var(--muted)]">Price</dt>
              <dd className="mt-1 font-medium text-[var(--viridian-950)]">{property.price}</dd>
            </div>
          )}
          {property.plotSize && (
            <div>
              <dt className="text-xs text-[var(--muted)]">Plot size</dt>
              <dd className="mt-1 font-medium text-[var(--viridian-950)]">{property.plotSize}</dd>
            </div>
          )}
        </dl>
      )}
      <Link href={`/properties/${property.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
        View Property <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function PropertyListing() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [status, setStatus] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [plotMin, setPlotMin] = useState('');
  const [plotMax, setPlotMax] = useState('');
  const [sort, setSort] = useState<PropertySort>('featured');
  const statusOptions = Array.from(new Set(propertyListings.flatMap((item) => item.status ? [item.status] : [])));

  const filteredProperties = sortPropertyListings(filterPropertyListings(propertyListings, {
    location,
    propertyType,
    status,
    budgetMin: budgetMin === '' ? undefined : Number(budgetMin),
    budgetMax: budgetMax === '' ? undefined : Number(budgetMax),
    plotMin: plotMin === '' ? undefined : Number(plotMin),
    plotMax: plotMax === '' ? undefined : Number(plotMax),
  }), sort);

  const resetFilters = () => {
    setLocation('');
    setPropertyType('');
    setStatus('');
    setBudgetMin('');
    setBudgetMax('');
    setPlotMin('');
    setPlotMax('');
    setSort('featured');
  };

  return (
    <section className="bg-[var(--cream)] py-12 sm:py-16">
      <div className="container-xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">Browse opportunities</h2>
          <span className="text-xs text-[var(--muted)]">{filteredProperties.length} listed</span>
        </div>

        <div className="grid gap-3 border-y border-[var(--viridian-950)]/15 py-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClassName} placeholder="Any location" />
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Property Type</span>
            <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className={fieldClassName}>
              <option value="">All types</option>
              {propertyTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-xs font-medium text-[var(--muted)]">Budget</legend>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} className={fieldClassName} aria-label="Minimum budget" placeholder="Min" />
              <input type="number" min="0" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} className={fieldClassName} aria-label="Maximum budget" placeholder="Max" />
            </div>
            <span className="mt-1 block text-[10px] font-normal text-[var(--muted)]">Amount unit follows listing data.</span>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-xs font-medium text-[var(--muted)]">Plot Size</legend>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" value={plotMin} onChange={(event) => setPlotMin(event.target.value)} className={fieldClassName} aria-label="Minimum plot size" placeholder="Min" />
              <input type="number" min="0" value={plotMax} onChange={(event) => setPlotMax(event.target.value)} className={fieldClassName} aria-label="Maximum plot size" placeholder="Max" />
            </div>
            <span className="mt-1 block text-[10px] font-normal text-[var(--muted)]">Size unit follows listing data.</span>
          </fieldset>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClassName}>
              <option value="">All statuses</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-[var(--muted)] sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as PropertySort)} className={fieldClassName}>
              <option value="featured">Default</option>
              <option value="price-asc">Budget: low to high</option>
              <option value="price-desc">Budget: high to low</option>
              <option value="plot-size-asc">Plot size: small to large</option>
              <option value="plot-size-desc">Plot size: large to small</option>
            </select>
          </label>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        ) : propertyListings.length > 0 ? (
          <div className="mt-8 flex flex-col items-start gap-4 border-b border-[var(--viridian-950)]/15 py-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">No property opportunities match these filters.</p>
            <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
              <RotateCcw className="h-4 w-4" /> Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-start gap-4 border-b border-[var(--viridian-950)]/15 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="font-display text-2xl text-[var(--viridian-950)] sm:text-3xl">No properties currently available.</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">We&apos;re currently updating our available property opportunities. Looking for something specific? Talk to JLUXE.</p>
            </div>
            <Link href={siteConfig.nav.contact} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Talk to JLUXE <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        <p className="mt-5 max-w-2xl text-xs leading-5 text-[var(--muted)]">
          JLUXE may represent property opportunities as a channel partner; listings are shared by their respective owners or partners.
        </p>
      </div>
    </section>
  );
}