'use client';

import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Star, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  plotSizeUnits,
  priceModes,
  propertyStatuses,
  propertyTypes,
  publicationStatuses,
  representationTypes,
  type PlotSizeUnit,
  type PriceMode,
  type PropertyStatus,
  type PropertyType,
  type PublicationStatus,
  type RepresentationType,
  type PropertyMediaItem,
} from '@/lib/db/types';
import { createPropertySlug } from '@/lib/admin-property';
import { getMediaImageUrl } from '@/lib/media';

type PropertyData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  propertyType: PropertyType;
  priceAmount: string | null;
  priceMode: PriceMode;
  plotSize: string | null;
  plotSizeUnit: PlotSizeUnit | null;
  status: PropertyStatus;
  representationType: RepresentationType;
  publicationStatus: PublicationStatus;
};

type FormValues = {
  title: string;
  slug: string;
  description: string;
  location: string;
  propertyType: string;
  priceAmount: string;
  priceMode: PriceMode;
  plotSize: string;
  plotSizeUnit: string;
  status: string;
  representationType: string;
  publicationStatus: PublicationStatus;
};

type MediaOption = { id: string; storageKey: string; mimeType: string };

type AttachedMediaItem = {
  mediaId: string;
  storageKey: string;
  position: number;
  altText: string | null;
};

const inputClass = 'min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]';

function toFormValues(property?: PropertyData): FormValues {
  return {
    title: property?.title ?? '',
    slug: property?.slug ?? '',
    description: property?.description ?? '',
    location: property?.location ?? '',
    propertyType: property?.propertyType ?? '',
    priceAmount: property?.priceAmount ?? '',
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

export default function PropertyForm({
  property,
  initialMedia = [],
}: {
  property?: PropertyData;
  initialMedia?: PropertyMediaItem[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(property));
  const [slugEdited, setSlugEdited] = useState(Boolean(property));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Media gallery state
  const [mediaList, setMediaList] = useState<AttachedMediaItem[]>(() =>
    initialMedia.map((item) => ({
      mediaId: item.mediaId,
      storageKey: item.storageKey,
      position: item.position,
      altText: item.altText,
    })),
  );
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMediaIdToAdd, setSelectedMediaIdToAdd] = useState('');
  const [mediaActionPending, setMediaActionPending] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!property) return;
    const controller = new AbortController();
    setMediaLoading(true);

    fetch('/admin/api/media?limit=100', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) {
          setMediaOptions(
            result.data.map((item: { id: string; storageKey: string; mimeType: string }) => ({
              id: item.id,
              storageKey: item.storageKey,
              mimeType: item.mimeType,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setMediaLoading(false);
      });

    return () => controller.abort();
  }, [property]);

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function persistMediaList(newList: AttachedMediaItem[]) {
    if (!property) return;
    setMediaActionPending(true);
    setMediaNotice(null);

    try {
      const response = await fetch(`/admin/api/properties/${property.id}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media: newList.map((item) => ({
            mediaId: item.mediaId,
            altText: item.altText,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.error ?? 'Unable to update property gallery.');
      }

      setMediaList(
        result.data.map((item: PropertyMediaItem) => ({
          mediaId: item.mediaId,
          storageKey: item.storageKey,
          position: item.position,
          altText: item.altText,
        })),
      );
      setMediaNotice({ type: 'success', text: 'Gallery updated.' });
      router.refresh();
    } catch (err) {
      setMediaNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update gallery.',
      });
    } finally {
      setMediaActionPending(false);
    }
  }

  const handleMakeCover = (index: number) => {
    if (index === 0 || mediaActionPending) return;
    const target = mediaList[index];
    const remaining = mediaList.filter((_, i) => i !== index);
    const updated = [target, ...remaining].map((item, idx) => ({ ...item, position: idx }));
    void persistMediaList(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || mediaActionPending) return;
    const updated = [...mediaList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    void persistMediaList(updated.map((item, idx) => ({ ...item, position: idx })));
  };

  const handleMoveDown = (index: number) => {
    if (index === mediaList.length - 1 || mediaActionPending) return;
    const updated = [...mediaList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    void persistMediaList(updated.map((item, idx) => ({ ...item, position: idx })));
  };

  const handleRemoveMedia = (mediaId: string) => {
    if (mediaActionPending) return;
    const updated = mediaList
      .filter((item) => item.mediaId !== mediaId)
      .map((item, idx) => ({ ...item, position: idx }));
    void persistMediaList(updated);
  };

  const handleAddMedia = () => {
    if (!selectedMediaIdToAdd || mediaActionPending) return;
    if (mediaList.some((item) => item.mediaId === selectedMediaIdToAdd)) {
      setMediaNotice({ type: 'error', text: 'This image is already attached to this property.' });
      return;
    }
    const option = mediaOptions.find((item) => item.id === selectedMediaIdToAdd);
    if (!option) return;

    const newItem: AttachedMediaItem = {
      mediaId: option.id,
      storageKey: option.storageKey,
      position: mediaList.length,
      altText: null,
    };
    const updated = [...mediaList, newItem];
    setSelectedMediaIdToAdd('');
    void persistMediaList(updated);
  };

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
      priceCurrency: values.priceAmount ? 'INR' : null,
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

      router.push('/admin/properties?saved=1');
      router.refresh();
    } catch {
      setError('Unable to save property right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl text-[#f5f1e8]">
      <Link href="/admin/properties" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#9caaa4] transition-colors hover:text-[#f5f1e8]">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <div className="mt-5 border-b border-white/15 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY LISTING</p>
        <h1 className="mt-2 font-display text-4xl text-white">{property ? 'Edit property' : 'Add property'}</h1>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-8">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Title *</span>
            <input
              required
              maxLength={200}
              value={values.title}
              onChange={(event) => {
                const title = event.target.value;
                update('title', title);
                if (!slugEdited) update('slug', createPropertySlug(title));
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">URL slug *</span>
            <input
              required
              maxLength={180}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);
                update('slug', event.target.value);
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
            <span className="mb-1.5 block">Description</span>
            <textarea
              maxLength={20000}
              rows={5}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
              className={`${inputClass} py-3`}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
            <span className="mb-1.5 block">Location</span>
            <input
              maxLength={255}
              value={values.location}
              onChange={(event) => update('location', event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Property type *</span>
            <select
              required
              value={values.propertyType}
              onChange={(event) => update('propertyType', event.target.value)}
              className={inputClass}
            >
              <option value="">Select type</option>
              {propertyTypes.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Property status *</span>
            <select
              required
              value={values.status}
              onChange={(event) => update('status', event.target.value)}
              className={inputClass}
            >
              <option value="">Select status</option>
              {propertyStatuses.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="border-t border-white/15 pt-6">
          <h2 className="font-display text-2xl text-white">Price and size</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price amount (INR)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.priceAmount}
                onChange={(event) => update('priceAmount', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price mode *</span>
              <select
                value={values.priceMode}
                onChange={(event) => update('priceMode', event.target.value as FormValues['priceMode'])}
                className={inputClass}
              >
                {priceModes.map((value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Plot size</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={values.plotSize}
                onChange={(event) => update('plotSize', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Plot size unit</span>
              <select
                value={values.plotSizeUnit}
                onChange={(event) => update('plotSizeUnit', event.target.value)}
                className={inputClass}
              >
                <option value="">No plot size</option>
                {plotSizeUnits.map((value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="border-t border-white/15 pt-6">
          <h2 className="font-display text-2xl text-white">Representation and publication</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">JLUXE representation *</span>
              <select
                required
                value={values.representationType}
                onChange={(event) => update('representationType', event.target.value)}
                className={inputClass}
              >
                <option value="">Select representation</option>
                {representationTypes.map((value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Publication status *</span>
              <select
                value={values.publicationStatus}
                onChange={(event) => update('publicationStatus', event.target.value as FormValues['publicationStatus'])}
                className={inputClass}
              >
                {publicationStatuses.map((value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && (
          <p role="alert" className="border-l-2 border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-white/15 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : property ? 'Save changes' : 'Create property'}
          </button>
          <Link
            href="/admin/properties"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Media Management Section for existing property */}
      {property && (
        <section className="mt-12 border-t border-white/15 pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">MEDIA &amp; GALLERY</p>
              <h2 className="mt-1 font-display text-2xl text-white">Associated property images</h2>
              <p className="mt-1 text-xs text-[#9caaa4]">
                The first image (Position 0) serves as the listing cover image. Reorder or change cover as needed.
              </p>
            </div>
          </div>

          {mediaNotice && (
            <div
              role="status"
              className={`mt-4 border-l-2 px-3 py-2 text-sm ${
                mediaNotice.type === 'success'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-500 bg-red-950/40 text-red-200'
              }`}
            >
              {mediaNotice.text}
            </div>
          )}

          {/* Attached images list */}
          <div className="mt-6 space-y-3">
            {mediaList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/20 bg-[#08201b] p-6 text-center text-sm text-[#9caaa4]">
                No images attached yet. Select an image from the library below to attach it to this property.
              </p>
            ) : (
              mediaList.map((item, index) => {
                const isCover = index === 0;
                return (
                  <div
                    key={item.mediaId}
                    className={`flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                      isCover
                        ? 'border-[var(--gold)]/60 bg-[#0c2a23]'
                        : 'border-white/10 bg-[#08201b]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded border border-white/10 bg-[var(--sand)]">
                        <img
                          src={getMediaImageUrl(item.storageKey, 'property')}
                          alt={item.altText ?? 'Property thumbnail'}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getMediaImageUrl(null, 'property');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#9caaa4]">
                            #{index + 1}
                          </span>
                          {isCover && (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--viridian-950)]">
                              <Star className="h-3 w-3 fill-current" /> Cover Image
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-white/70">{item.storageKey}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                      {!isCover && (
                        <button
                          type="button"
                          disabled={mediaActionPending}
                          onClick={() => handleMakeCover(index)}
                          className="inline-flex min-h-9 items-center gap-1 rounded border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 text-xs font-medium text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/20 disabled:opacity-40"
                        >
                          <Star className="h-3.5 w-3.5" /> Make cover
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={index === 0 || mediaActionPending}
                        onClick={() => handleMoveUp(index)}
                        aria-label="Move image up"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === mediaList.length - 1 || mediaActionPending}
                        onClick={() => handleMoveDown(index)}
                        aria-label="Move image down"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={mediaActionPending}
                        onClick={() => handleRemoveMedia(item.mediaId)}
                        aria-label="Remove image from property"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-500/30 bg-red-950/30 text-red-300 transition-colors hover:bg-red-900/50 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add media dropdown */}
          <div className="mt-6 rounded-lg border border-white/15 bg-[#08201b] p-4">
            <p className="text-xs font-semibold text-white">Attach image from media library</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                disabled={mediaLoading || mediaActionPending || mediaOptions.length === 0}
                value={selectedMediaIdToAdd}
                onChange={(event) => setSelectedMediaIdToAdd(event.target.value)}
                className="min-h-11 flex-1 border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)] disabled:opacity-50"
              >
                <option value="">
                  {mediaLoading ? 'Loading media options...' : mediaOptions.length === 0 ? 'No media available in library' : 'Select an image to attach'}
                </option>
                {mediaOptions.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.storageKey} ({media.mimeType})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedMediaIdToAdd || mediaActionPending}
                onClick={handleAddMedia}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded bg-[var(--viridian-800)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--viridian-700)] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Attach image
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}