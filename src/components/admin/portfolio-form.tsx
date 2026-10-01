'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortfolioSlug } from '@/lib/admin-portfolio';
import { publicationStatuses, type PublicationStatus } from '@/lib/db/types';

type ServiceOption = { id: string; slug: string; title: string };
type PortfolioWorkData = {
  id: string;
  title: string;
  slug: string;
  serviceId: string;
  description: string;
  location: string | null;
  year: number | null;
  featured: boolean;
  publicationStatus: PublicationStatus;
  service: ServiceOption;
};

type FormValues = {
  title: string;
  slug: string;
  serviceId: string;
  description: string;
  location: string;
  year: string;
  featured: boolean;
  publicationStatus: PublicationStatus;
};

const inputClass = 'min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]';

function toFormValues(work?: PortfolioWorkData, firstServiceId = ''): FormValues {
  return {
    title: work?.title ?? '',
    slug: work?.slug ?? '',
    serviceId: work?.serviceId ?? firstServiceId,
    description: work?.description ?? '',
    location: work?.location ?? '',
    year: work?.year === null || work?.year === undefined ? '' : String(work.year),
    featured: work?.featured ?? false,
    publicationStatus: work?.publicationStatus ?? 'DRAFT',
  };
}

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PortfolioForm({
  work,
  services,
}: {
  work?: PortfolioWorkData;
  services: ServiceOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(work, services[0]?.id));
  const [slugEdited, setSlugEdited] = useState(Boolean(work));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');
    const payload = {
      title: values.title,
      slug: values.slug,
      serviceId: values.serviceId,
      description: values.description,
      location: values.location.trim() || null,
      year: values.year.trim() ? Number(values.year) : null,
      featured: values.featured,
      publicationStatus: values.publicationStatus,
    };

    try {
      const response = await fetch(work ? `/admin/api/portfolio/${work.id}` : '/admin/api/portfolio', {
        method: work ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        setError(result.error ?? 'Unable to save work. Please review the form and try again.');
        return;
      }

      router.push(`/admin/our-work/${result.data.id}`);
      router.refresh();
    } catch {
      setError('Unable to save work right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/our-work" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--viridian-950)]">
        <ArrowLeft className="h-4 w-4" /> All work
      </Link>
      <div className="mt-5 border-b border-[var(--viridian-950)]/15 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PORTFOLIO</p>
        <h1 className="mt-2 font-display text-4xl">{work ? 'Edit work' : 'Add work'}</h1>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Title *</span>
            <input required maxLength={200} value={values.title} onChange={(event) => {
              const title = event.target.value;
              setValues((current) => ({
                ...current,
                title,
                slug: slugEdited ? current.slug : createPortfolioSlug(title),
              }));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">URL slug *</span>
            <input required maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={(event) => {
              setSlugEdited(true);
              setValues((current) => ({ ...current, slug: event.target.value }));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Service *</span>
            <select required value={values.serviceId} onChange={(event) => {
              setValues((current) => ({ ...current, serviceId: event.target.value }));
            }} className={inputClass}>
              <option value="" disabled>Select a service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Year</span>
            <input type="number" min="1" max="32767" step="1" value={values.year} onChange={(event) => {
              setValues((current) => ({ ...current, year: event.target.value }));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Description *</span>
            <textarea required rows={5} value={values.description} onChange={(event) => {
              setValues((current) => ({ ...current, description: event.target.value }));
            }} className={`${inputClass} py-3`} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Location</span>
            <input maxLength={255} value={values.location} onChange={(event) => {
              setValues((current) => ({ ...current, location: event.target.value }));
            }} className={inputClass} />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={values.featured} onChange={(event) => {
              setValues((current) => ({ ...current, featured: event.target.checked }));
            }} className="h-4 w-4 accent-[var(--viridian-900)]" />
            Featured
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Publication status *</span>
            <select required value={values.publicationStatus} onChange={(event) => {
              setValues((current) => ({ ...current, publicationStatus: event.target.value as PublicationStatus }));
            }} className={inputClass}>
              {publicationStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
          </label>
        </section>

        {error && <p role="alert" className="border-l-2 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-[var(--viridian-950)]/15 pt-5">
          <button type="submit" disabled={saving || services.length === 0} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--viridian-900)] px-6 text-sm font-semibold text-white hover:bg-[var(--viridian-800)] disabled:opacity-60">
            {saving ? 'Saving...' : work ? 'Save changes' : 'Create work'}
          </button>
          <Link href="/admin/our-work" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--viridian-950)]/15 px-6 text-sm font-medium">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
