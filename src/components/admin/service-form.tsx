'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createServiceSlug } from '@/lib/admin-service';
import { publicationStatuses, type PublicationStatus } from '@/lib/db/types';

type ServiceData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  publicationStatus: PublicationStatus;
  sortOrder: number;
};

type FormValues = {
  title: string;
  slug: string;
  description: string;
  publicationStatus: PublicationStatus;
  sortOrder: string;
};

const inputClass = 'min-h-11 w-full border border-[var(--viridian-950)]/15 bg-white px-3 py-2 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]';

function toFormValues(service?: ServiceData): FormValues {
  return {
    title: service?.title ?? '',
    slug: service?.slug ?? '',
    description: service?.description ?? '',
    publicationStatus: service?.publicationStatus ?? 'DRAFT',
    sortOrder: String(service?.sortOrder ?? 0),
  };
}

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ServiceForm({ service }: { service?: ServiceData }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(service));
  const [slugEdited, setSlugEdited] = useState(Boolean(service));
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
      description: values.description.trim() || null,
      publicationStatus: values.publicationStatus,
      sortOrder: Number(values.sortOrder),
    };

    try {
      const response = await fetch(service ? `/admin/api/services/${service.id}` : '/admin/api/services', {
        method: service ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        setError(result.error ?? 'Unable to save service. Please review the form and try again.');
        return;
      }

      router.push(`/admin/services/${result.data.id}`);
      router.refresh();
    } catch {
      setError('Unable to save service right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/services" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--viridian-950)]">
        <ArrowLeft className="h-4 w-4" /> Services
      </Link>
      <div className="mt-5 border-b border-[var(--viridian-950)]/15 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">SERVICE</p>
        <h1 className="mt-2 font-display text-4xl">{service ? 'Edit service' : 'Add service'}</h1>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Title *</span>
            <input required maxLength={150} value={values.title} onChange={(event) => {
              const title = event.target.value;
              setValues((current) => ({
                ...current,
                title,
                slug: slugEdited ? current.slug : createServiceSlug(title),
              }));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">URL slug *</span>
            <input required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={(event) => {
              setSlugEdited(true);
              setValues((current) => ({ ...current, slug: event.target.value }));
            }} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
            <span className="mb-1.5 block">Description</span>
            <textarea maxLength={20000} rows={5} value={values.description} onChange={(event) => {
              setValues((current) => ({ ...current, description: event.target.value }));
            }} className={`${inputClass} py-3`} />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Publication status *</span>
            <select required value={values.publicationStatus} onChange={(event) => {
              setValues((current) => ({ ...current, publicationStatus: event.target.value as PublicationStatus }));
            }} className={inputClass}>
              {publicationStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            <span className="mb-1.5 block">Sort order *</span>
            <input required type="number" min="0" max="2147483647" step="1" value={values.sortOrder} onChange={(event) => {
              setValues((current) => ({ ...current, sortOrder: event.target.value }));
            }} className={inputClass} />
          </label>
        </section>

        {error && <p role="alert" className="border-l-2 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-[var(--viridian-950)]/15 pt-5">
          <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--viridian-900)] px-6 text-sm font-semibold text-white hover:bg-[var(--viridian-800)] disabled:opacity-60">
            {saving ? 'Saving...' : service ? 'Save changes' : 'Create service'}
          </button>
          <Link href="/admin/services" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--viridian-950)]/15 px-6 text-sm font-medium">Cancel</Link>
        </div>
      </form>
    </div>
  );
}