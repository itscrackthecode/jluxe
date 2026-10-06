'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortfolioSlug } from '@/lib/admin-portfolio';
import { publicationStatuses, type PublicationStatus } from '@/lib/db/types';
import { getMediaImageUrl } from '@/lib/media';

type ServiceOption = { id: string; slug: string; title: string };
type WorkCover = { storageKey: string; altText: string | null };
type MediaOption = { id: string; storageKey: string; mimeType: string };
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
  cover: initialCover,
}: {
  work?: PortfolioWorkData;
  services: ServiceOption[];
  cover?: WorkCover | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(work, services[0]?.id));
  const [slugEdited, setSlugEdited] = useState(Boolean(work));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cover, setCover] = useState<WorkCover | null>(initialCover ?? null);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    if (!work) return;
    const controller = new AbortController();

    async function loadMedia() {
      try {
        const response = await fetch('/admin/api/media?limit=50', { signal: controller.signal });
        const result = await response.json() as { success: boolean; data?: MediaOption[] };
        if (!response.ok || result.success !== true || !Array.isArray(result.data)) throw new Error();
        setMediaOptions(result.data.filter((item) => item.mimeType.startsWith('image/')));
        setMediaState('ready');
      } catch {
        if (!controller.signal.aborted) setMediaState('error');
      }
    }

    void loadMedia();
    return () => controller.abort();
  }, [work]);

  async function updateCover(mediaId: string | null) {
    if (!work || coverSaving) return;
    setCoverSaving(true);
    setCoverError('');

    try {
      const response = await fetch(`/admin/api/portfolio/${work.id}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error ?? 'Unable to update the cover image.');

      const chosen = mediaId ? mediaOptions.find((item) => item.id === mediaId) ?? null : null;
      setCover(chosen ? { storageKey: chosen.storageKey, altText: null } : null);
      setSelectedMediaId('');
      router.refresh();
    } catch (requestError) {
      setCoverError(requestError instanceof Error ? requestError.message : 'Unable to update the cover image.');
    } finally {
      setCoverSaving(false);
    }
  }

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

        {work && (
          <section className="border-t border-[var(--viridian-950)]/15 pt-6">
            <h2 className="font-display text-2xl">Cover image</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-[220px_1fr]">
              <img
                src={getMediaImageUrl(cover?.storageKey ?? null, 'portfolio')}
                alt={cover?.altText ?? 'Work cover'}
                onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getMediaImageUrl(null, 'portfolio'); }}
                className="aspect-[4/3] w-full border border-[var(--viridian-950)]/15 bg-[var(--sand)] object-cover"
              />
              <div>
                {cover ? (
                  <p className="text-xs text-[var(--muted)]">A cover image is set. It is shown as the first image on the public Our Work pages.</p>
                ) : (
                  <p className="text-xs text-[var(--muted)]">No cover image set. The public Our Work pages show the standard JLUXE fallback image.</p>
                )}
                {mediaState === 'loading' ? (
                  <p role="status" className="mt-3 text-xs text-[var(--muted)]">Loading media library...</p>
                ) : mediaState === 'error' ? (
                  <p role="alert" className="mt-3 text-xs text-red-700">Unable to load the media library right now.</p>
                ) : (
                  <>
                    <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
                      <span className="mb-1.5 block">Select a cover image from the media library</span>
                      <select value={selectedMediaId} onChange={(event) => setSelectedMediaId(event.target.value)} disabled={mediaOptions.length === 0} className={inputClass}>
                        <option value="">{mediaOptions.length === 0 ? 'No uploaded media available yet' : 'Choose an image'}</option>
                        {mediaOptions.map((item) => <option key={item.id} value={item.id}>{item.storageKey}</option>)}
                      </select>
                    </label>
                    {mediaOptions.length === 0 && (
                      <p className="mt-2 text-xs text-[var(--muted)]">Image uploads are pending storage provider configuration. Once media is uploaded it can be selected here as the cover.</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" onClick={() => void updateCover(selectedMediaId)} disabled={coverSaving || !selectedMediaId} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--viridian-900)] px-6 text-sm font-semibold text-white hover:bg-[var(--viridian-800)] disabled:opacity-60">
                        {coverSaving ? 'Updating...' : 'Set as cover'}
                      </button>
                      {cover && (
                        <button type="button" onClick={() => void updateCover(null)} disabled={coverSaving} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--viridian-950)]/15 px-6 text-sm font-medium disabled:opacity-60">
                          Remove cover
                        </button>
                      )}
                    </div>
                  </>
                )}
                {coverError && <p role="alert" className="mt-3 border-l-2 border-red-600 bg-white px-3 py-2 text-sm text-red-700">{coverError}</p>}
              </div>
            </div>
          </section>
        )}

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
