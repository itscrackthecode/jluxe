'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlotSizeUnit, PriceMode, PropertyStatus, PropertyType, PublicationStatus, RepresentationType } from '@/generated/prisma/enums';
import { createPropertySlug } from '@/lib/admin-property';

type PropertyData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  propertyType: typeof PropertyType[keyof typeof PropertyType];
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: typeof PriceMode[keyof typeof PriceMode];
  plotSize: string | null;
  plotSizeUnit: typeof PlotSizeUnit[keyof typeof PlotSizeUnit] | null;
  status: typeof PropertyStatus[keyof typeof PropertyStatus];
  representationType: typeof RepresentationType[keyof typeof RepresentationType];
  publicationStatus: typeof PublicationStatus[keyof typeof PublicationStatus];
};

type FormValues = {
  title: string;
  slug: string;
  description: string;
  location: string;
  propertyType: string;
  priceAmount: string;
  priceCurrency: string;
  priceMode: typeof PriceMode[keyof typeof PriceMode];
  plotSize: string;
  plotSizeUnit: string;
  status: string;
  representationType: string;
  publicationStatus: typeof PublicationStatus[keyof typeof PublicationStatus];
};

const inputClass = 'min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]';

function toFormValues(property?: PropertyData): FormValues {
  return {
    title: property?.title ?? '',
    slug: property?.slug ?? '',
    description: property?.description ?? '',
    location: property?.location ?? '',
    propertyType: property?.propertyType ?? '',
    priceAmount: property?.priceAmount ?? '',
    priceCurrency: property?.priceCurrency?.trim() ?? '',
    priceMode: property?.priceMode ?? 'EXACT',
    plotSize: property?.plotSize ?? '',
    plotSizeUnit: property?.plotSizeUnit ?? '',
    status: property?.status ?? '',
    representationType: property?.representationType ?? '',
    publicationStatus: property?.publicationStatus ?? 'DRAFT',
  };
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PropertyForm({ property }: { property?: PropertyData }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(property));
  const [slugEdited, setSlugEdited] = useState(Boolean(property));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');
    const payload = {
      ...values,
      slug: values.slug || undefined,
      description: values.description || null,
      location: values.location || null,
      priceAmount: values.priceAmount || null,
      priceCurrency: values.priceCurrency || null,
      plotSize: values.plotSize || null,
      plotSizeUnit: values.plotSizeUnit || null,
    };

    try {
      const response = await fetch(property ? `/admin/api/properties/${property.id}` : '/admin/api/properties', {
        method: property ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        setError(result.error ?? 'Unable to save property. Please review the form and try again.');
        return;
      }

      router.push(`/admin/properties/${result.data.id}`);
      router.refresh();
    } catch {
      setError('Unable to save property right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/properties" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--viridian-950)]"><ArrowLeft className="h-4 w-4" /> Properties</Link>
      <div className="mt-5 border-b border-[var(--viridian-950)]/15 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY LISTING</p>
        <h1 className="mt-2 font-display text-4xl">{property ? 'Edit property' : 'Add property'}</h1>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-8">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Title *</span>
            <input required maxLength={200} value={values.title} onChange={(event) => {
              const title = event.target.value;
              update('title', title);
              if (!slugEdited) update('slug', createPropertySlug(title));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">URL slug *</span>
            <input required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={(event) => { setSlugEdited(true); update('slug', event.target.value); }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Description</span>
            <textarea maxLength={20000} rows={5} value={values.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} py-3`} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Location</span>
            <input maxLength={255} value={values.location} onChange={(event) => update('location', event.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Property type *</span>
            <select required value={values.propertyType} onChange={(event) => update('propertyType', event.target.value)} className={inputClass}>
              <option value="">Select type</option>
              {Object.values(PropertyType).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Property status *</span>
            <select required value={values.status} onChange={(event) => update('status', event.target.value)} className={inputClass}>
              <option value="">Select status</option>
              {Object.values(PropertyStatus).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </label>
        </section>

        <section className="border-t border-[var(--viridian-950)]/15 pt-6">
          <h2 className="font-display text-2xl">Price and size</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Price amount</span>
              <input type="number" min="0" step="0.01" value={values.priceAmount} onChange={(event) => update('priceAmount', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Price currency (ISO 4217)</span>
              <input maxLength={3} value={values.priceCurrency} onChange={(event) => update('priceCurrency', event.target.value.toUpperCase())} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Price mode *</span>
              <select value={values.priceMode} onChange={(event) => update('priceMode', event.target.value as FormValues['priceMode'])} className={inputClass}>
                {Object.values(PriceMode).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Plot size</span>
              <input type="number" min="0.01" step="0.01" value={values.plotSize} onChange={(event) => update('plotSize', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Plot size unit</span>
              <select value={values.plotSizeUnit} onChange={(event) => update('plotSizeUnit', event.target.value)} className={inputClass}>
                <option value="">No plot size</option>
                {Object.values(PlotSizeUnit).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--viridian-950)]/15 pt-6">
          <h2 className="font-display text-2xl">Representation and publication</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">JLUXE representation *</span>
              <select required value={values.representationType} onChange={(event) => update('representationType', event.target.value)} className={inputClass}>
                <option value="">Select representation</option>
                {Object.values(RepresentationType).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              <span className="mb-1.5 block">Publication status *</span>
              <select value={values.publicationStatus} onChange={(event) => update('publicationStatus', event.target.value as FormValues['publicationStatus'])} className={inputClass}>
                {Object.values(PublicationStatus).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
          </div>
        </section>

        {error && <p role="alert" className="border-l-2 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-[var(--viridian-950)]/15 pt-5">
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--viridian-900)] px-6 text-sm font-semibold text-white hover:bg-[var(--viridian-800)] disabled:opacity-60">{saving ? 'Saving...' : property ? 'Save changes' : 'Create property'}</button>
          <Link href="/admin/properties" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--viridian-950)]/15 px-6 text-sm font-medium">Cancel</Link>
        </div>
      </form>
    </div>
  );
}