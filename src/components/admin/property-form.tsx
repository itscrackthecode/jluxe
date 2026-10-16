'use client';

import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Star, Plus, Copy, ChevronDown } from 'lucide-react';
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
import { uploadAdminImage, uploadAdminPropertyDocument, type PropertyDocumentKind } from '@/lib/cloudinary-client';
import PropertyDescriptionEditor from '@/components/admin/property-description-editor';

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
  subtype?: string | null; projectName?: string | null; address?: string | null; locality?: string | null;
  city?: string | null; state?: string | null; locationUrl?: string | null; bedrooms?: number | null;
  bathrooms?: number | null; builtUpArea?: string | null; builtUpAreaUnit?: PlotSizeUnit | null;
  floorCount?: number | null; parkingSpaces?: number | null; roadAccess?: string | null; approvalInfo?: string | null;
  seoTitle?: string | null; seoDescription?: string | null; availability?: string;
  priceMinimum?: string | null; priceMaximum?: string | null; priceBasis?: string;
  features?: string[]; configurations?: Configuration[];
  inventory?: InventoryItem[];
};

type Configuration = { id?: string; name: string; area: string | null; areaUnit: string | null; bedrooms: number | null; bathrooms: number | null; floor: string | null; block: string | null; priceMode: 'EXACT' | 'RANGE' | 'PER_UNIT' | 'ON_REQUEST'; priceAmount: string | null; priceMinimum: string | null; priceMaximum: string | null; priceCurrency: string | null; priceBasis: string; availability: string; availableUnits: number | null; features: string[]; media?: Array<{ id: string }> };
type InventoryItem = { id?: string; reference: string; configurationId: string | null; availability: string; priceAmount: string | null; priceCurrency: string | null; area: string | null; areaUnit: string | null };

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
  subtype: string; projectName: string; address: string; locality: string; city: string; state: string; locationUrl: string;
  bedrooms: string; bathrooms: string; builtUpArea: string; builtUpAreaUnit: string; floorCount: string; parkingSpaces: string;
  roadAccess: string; approvalInfo: string; seoTitle: string; seoDescription: string; availability: string;
  priceMinimum: string; priceMaximum: string; priceBasis: string; featuresText: string;
};

type MediaOption = { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; byteSize?: string; width?: number | null; height?: number | null };

type AttachedMediaItem = {
  mediaId: string;
  storageKey: string;
  deliveryUrl?: string | null;
  position: number;
  altText: string | null;
};

const inputClass = 'min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]';
const panelClass = 'overflow-hidden border border-white/10 bg-[#08201b]/80 shadow-[0_18px_45px_rgba(0,0,0,0.12)]';
const panelHeadingClass = 'font-display text-2xl text-white';
const propertyTypeLabels: Record<PropertyType, string> = { PLOT: 'Plot / Land', LAND: 'Plot / Land', APARTMENT: 'Apartment', VILLA: 'Villa / Independent House', COMMERCIAL: 'Commercial Property', OTHER: 'Other' };

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
    subtype: property?.subtype ?? '', projectName: property?.projectName ?? '', address: property?.address ?? '', locality: property?.locality ?? '',
    city: property?.city ?? '', state: property?.state ?? '', locationUrl: property?.locationUrl ?? '', bedrooms: property?.bedrooms?.toString() ?? '', bathrooms: property?.bathrooms?.toString() ?? '',
    builtUpArea: property?.builtUpArea ?? '', builtUpAreaUnit: property?.builtUpAreaUnit ?? '', floorCount: property?.floorCount?.toString() ?? '', parkingSpaces: property?.parkingSpaces?.toString() ?? '',
    roadAccess: property?.roadAccess ?? '', approvalInfo: property?.approvalInfo ?? '', seoTitle: property?.seoTitle ?? '', seoDescription: property?.seoDescription ?? '', availability: property?.availability ?? 'AVAILABLE',
    priceMinimum: property?.priceMinimum ?? '', priceMaximum: property?.priceMaximum ?? '', priceBasis: property?.priceBasis ?? 'TOTAL', featuresText: (property?.features ?? []).join(', '),
  };
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function configurationPriceLabel(configuration: Configuration) {
  if (configuration.priceMode === 'ON_REQUEST') return 'Price on request';
  if (configuration.priceMode === 'RANGE') return configuration.priceMinimum || configuration.priceMaximum
    ? `₹${configuration.priceMinimum || '—'} – ₹${configuration.priceMaximum || '—'}` : 'Price range';
  return configuration.priceAmount ? `₹${configuration.priceAmount}` : 'No price set';
}

export default function PropertyForm({
  property,
  initialMedia = [],
  duplicate = false,
}: {
  property?: PropertyData;
  initialMedia?: PropertyMediaItem[];
  duplicate?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(property));
  const [configurations, setConfigurations] = useState<Configuration[]>(property?.configurations ?? []);
  const [expandedConfiguration, setExpandedConfiguration] = useState<string | null>(property?.configurations?.[0]?.id ?? null);
  const [configurationMediaIds, setConfigurationMediaIds] = useState<Record<string, string[]>>(() => Object.fromEntries((property?.configurations ?? []).filter((item) => item.id).map((item) => [item.id!, (item.media ?? []).map((media) => media.id)])));
  const [inventory, setInventory] = useState<InventoryItem[]>(property?.inventory ?? []);
  const [inventoryDetailsOpen, setInventoryDetailsOpen] = useState(Boolean(property?.inventory?.length));
  const isEditing = Boolean(property && !duplicate);
  const showTypeField = (appliesToType: boolean, currentValue: string) => appliesToType || Boolean(currentValue);
  const [slugEdited, setSlugEdited] = useState(Boolean(property));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationDetails, setValidationDetails] = useState<Array<{ field: string; message: string }>>([]);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Media gallery state
  const [mediaList, setMediaList] = useState<AttachedMediaItem[]>(() =>
    initialMedia.map((item) => ({
      mediaId: item.mediaId,
        storageKey: item.storageKey,
        deliveryUrl: item.deliveryUrl,
      position: item.position,
      altText: item.altText,
    })),
  );
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMediaIdsToAdd, setSelectedMediaIdsToAdd] = useState<string[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaActionPending, setMediaActionPending] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; kind: PropertyDocumentKind; url: string; byteSize: string }>>([]);
  const [documentKind, setDocumentKind] = useState<PropertyDocumentKind>('FLOOR_PLAN');
  const [documentMessage, setDocumentMessage] = useState('');
  const [documentBusy, setDocumentBusy] = useState(false);
  const [promoKind, setPromoKind] = useState<'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT'>('PROMO_LANDSCAPE');
  const [promoSelection, setPromoSelection] = useState<Array<{ mediaId: string; kind: 'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT' }>>([]);
  const [promoMessage, setPromoMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setMediaLoading(true);

    fetch('/admin/api/media?limit=50', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) {
          setMediaOptions(
            result.data.map((item: { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; byteSize?: string; width?: number | null; height?: number | null }) => ({
              id: item.id,
              storageKey: item.storageKey,
              mimeType: item.mimeType,
              deliveryUrl: item.deliveryUrl,
              byteSize: item.byteSize,
              width: item.width,
              height: item.height,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setMediaLoading(false);
      });

    return () => controller.abort();
  }, [property?.id]);

  useEffect(() => {
    if (!property?.id) return;
    const controller = new AbortController();
    fetch(`/admin/api/properties/${property.id}/assets`, { signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (response.ok && result.success) setPromoSelection(result.data.map((item: { id: string; kind: 'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT' }) => ({ mediaId: item.id, kind: item.kind }))); })
      .catch(() => {});
    return () => controller.abort();
  }, [property?.id]);

  useEffect(() => {
    if (!property?.id) return;
    const controller = new AbortController();
    fetch(`/admin/api/properties/${property.id}/documents`, { signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (response.ok && result.success) setDocuments(result.data); })
      .catch(() => {});
    return () => controller.abort();
  }, [property?.id]);

  async function uploadDocument(file: File | undefined) {
    if (!file || !property?.id || documentBusy) return;
    setDocumentBusy(true); setDocumentMessage('');
    try {
      await uploadAdminPropertyDocument(file, property.id, documentKind);
      const response = await fetch(`/admin/api/properties/${property.id}/documents`, { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.success) setDocuments(result.data);
      setDocumentMessage('PDF added to this property.');
    } catch (reason) {
      setDocumentMessage(reason instanceof Error ? reason.message : 'Unable to upload this PDF.');
    } finally { setDocumentBusy(false); }
  }

  async function removeDocument(mediaId: string) {
    if (!property?.id || documentBusy || !window.confirm('Remove this document from the property? The media file remains in the library.')) return;
    setDocumentBusy(true); setDocumentMessage('');
    try {
      const response = await fetch(`/admin/api/properties/${property.id}/documents`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to remove document.');
      setDocuments((current) => current.filter((document) => document.id !== mediaId));
    } catch (reason) { setDocumentMessage(reason instanceof Error ? reason.message : 'Unable to remove document.'); }
    finally { setDocumentBusy(false); }
  }

  async function savePromotionalAssets() {
    if (!property?.id || mediaActionPending) return;
    setMediaActionPending(true); setPromoMessage('');
    try {
      const response = await fetch(`/admin/api/properties/${property.id}/assets`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: promoSelection }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to save promotional assets.');
      setPromoSelection(result.data.map((item: { id: string; kind: 'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT' }) => ({ mediaId: item.id, kind: item.kind })));
      setPromoMessage('Promotional images saved.');
    } catch (reason) { setPromoMessage(reason instanceof Error ? reason.message : 'Unable to save promotional assets.'); }
    finally { setMediaActionPending(false); }
  }

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function persistMediaList(newList: AttachedMediaItem[]) {
    const entityId = isEditing ? property?.id ?? createdPropertyId : createdPropertyId;
    if (!entityId) {
      setMediaList(newList);
      return;
    }
    setMediaActionPending(true);
    setMediaNotice(null);

    try {
      const response = await fetch(`/admin/api/properties/${entityId}/media`, {
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
          deliveryUrl: item.deliveryUrl,
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

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files);
    if (mediaList.length + chosen.length > 12) {
      setMediaNotice({ type: 'error', text: 'A property can have up to 12 images.' });
      return;
    }
    setUploading(true);
    setMediaNotice(null);
    try {
      for (const file of chosen) {
        const uploaded = await uploadAdminImage(file, 'properties');
        const next = [...mediaList, { mediaId: uploaded.id, storageKey: uploaded.storageKey, deliveryUrl: uploaded.deliveryUrl, position: mediaList.length, altText: null }];
        await persistMediaList(next);
        setMediaList(next);
      }
      setMediaNotice({ type: 'success', text: 'Image uploaded and added to this property.' });
    } catch (reason) {
      setMediaNotice({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to upload image.' });
    } finally {
      setUploading(false);
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
    if (!window.confirm('Remove this image from the property gallery? The file stays in the shared media library.')) return;
    const updated = mediaList
      .filter((item) => item.mediaId !== mediaId)
      .map((item, idx) => ({ ...item, position: idx }));
    void persistMediaList(updated);
  };

  const handleAddMedia = () => {
    if (selectedMediaIdsToAdd.length === 0 || mediaActionPending) return;
    const selected = mediaOptions.filter((option) => selectedMediaIdsToAdd.includes(option.id) && !mediaList.some((item) => item.mediaId === option.id));
    const updated = [...mediaList, ...selected.map((option, index): AttachedMediaItem => ({
      mediaId: option.id, storageKey: option.storageKey, deliveryUrl: option.deliveryUrl,
      position: mediaList.length + index, altText: null,
    }))];
    setSelectedMediaIdsToAdd([]);
    setMediaPickerOpen(false);
    void persistMediaList(updated);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const namedConfigurations = configurations.map((item) => item.name.trim().toLocaleLowerCase()).filter(Boolean);
    if (new Set(namedConfigurations).size !== namedConfigurations.length) {
      setError('Each configuration needs a unique name. Update the repeated labels and save again.');
      return;
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const saveAction = submitter?.name === 'saveAction' ? submitter.value : null;
    const targetPublicationStatus: PublicationStatus = saveAction === 'draft' ? 'DRAFT' : values.publicationStatus;

    setSaving(true);
    setError('');
    setValidationDetails([]);
    const { featuresText, ...propertyValues } = values;
    const payload = {
      ...propertyValues,
      publicationStatus: targetPublicationStatus,
      slug: values.slug || undefined,
      description: values.description || null,
      location: values.location || null,
      priceAmount: values.priceAmount || null,
      priceCurrency: values.priceAmount || values.priceMinimum || values.priceMaximum ? 'INR' : null,
      priceMinimum: values.priceMinimum || null,
      priceMaximum: values.priceMaximum || null,
      priceBasis: values.priceBasis,
      availability: values.availability,
      subtype: values.subtype || null,
      projectName: values.projectName || null,
      address: values.address || null,
      locality: values.locality || null,
      city: values.city || null,
      state: values.state || null,
      locationUrl: values.locationUrl || null,
      bedrooms: values.bedrooms || null,
      bathrooms: values.bathrooms || null,
      builtUpArea: values.builtUpArea || null,
      builtUpAreaUnit: values.builtUpAreaUnit || null,
      floorCount: values.floorCount || null,
      parkingSpaces: values.parkingSpaces || null,
      roadAccess: values.roadAccess || null,
      approvalInfo: values.approvalInfo || null,
      features: featuresText.split(',').map((item) => item.trim()).filter(Boolean),
      configurations: configurations.map((configuration) => {
        const savedConfiguration = { ...configuration };
        delete savedConfiguration.media;
        return savedConfiguration;
      }),
      inventory,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      plotSize: values.plotSize || null,
      plotSizeUnit: values.plotSizeUnit || null,
    };

    try {
      const entityId = isEditing ? property?.id ?? createdPropertyId : createdPropertyId;
      const response = await fetch(entityId ? `/admin/api/properties/${entityId}` : '/admin/api/properties', {
        method: entityId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        setError(result.error ?? 'Unable to save property. Please review the form and try again.');
        if (Array.isArray(result.details)) {
          setValidationDetails(result.details.filter((item: unknown): item is { field: string; message: string } =>
            typeof item === 'object' && item !== null && 'field' in item && typeof item.field === 'string' && 'message' in item && typeof item.message === 'string',
          ));
        }
        return;
      }

      const savedId = entityId ?? result.data.id as string;
      {
        for (const configuration of configurations) {
          if (!configuration.id) continue;
          const mediaResponse = await fetch(`/admin/api/properties/${savedId}/configurations/${configuration.id}/media`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaIds: configurationMediaIds[configuration.id] ?? [] }),
          });
          if (!mediaResponse.ok) throw new Error('Property saved, but configuration images could not be updated. Save again to retry.');
        }
      }
      if (!entityId) setCreatedPropertyId(savedId);
      if (!entityId && mediaList.length > 0) {
        const linked = await fetch(`/admin/api/properties/${savedId}/media`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media: mediaList.map((item) => ({ mediaId: item.mediaId, altText: item.altText })) }),
        });
        const linkedResult = await linked.json();
        if (!linked.ok || linkedResult.success !== true) throw new Error(linkedResult.error ?? 'Property saved, but its images could not be attached. Save again to retry.');
      }

      const notice = targetPublicationStatus === 'DRAFT' ? 'Property saved as draft.'
        : targetPublicationStatus === 'ARCHIVED' ? 'Property archived successfully.'
          : entityId ? 'Property updated successfully.' : 'Property published successfully.';
      router.push(`/admin/properties?notice=${encodeURIComponent(notice)}`);
      router.refresh();
    } catch {
      setError('Unable to save property right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl text-[#f5f1e8]">
      <Link href="/admin/properties" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#9caaa4] transition-colors hover:text-[#f5f1e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-5">
        <div><p className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">PROPERTY MANAGEMENT</p>
        <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">{isEditing ? 'Edit property' : duplicate ? 'Duplicate property' : 'Add property'}</h1>
        <p className="mt-2 text-sm text-[#9caaa4]">Add the essentials first. You can refine details and media as you go.</p></div>
        <span className="border border-white/15 px-3 py-2 text-xs text-[#c4cec8]">{isEditing ? formatLabel(values.publicationStatus) : 'New listing'}</span>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4 pb-28">
        <section className={`${panelClass} grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6`}>
          <div className="sm:col-span-2"><p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">START HERE</p><h2 className={`mt-1 ${panelHeadingClass}`}>Basic information</h2><p className="mt-1 text-xs text-[#9caaa4]">The title and location identify this property across JLUXE.</p></div>
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
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Property type *</span>
            <select required value={values.propertyType} onChange={(event) => update('propertyType', event.target.value)} className={inputClass}>
              <option value="">Select type</option>
              {propertyTypes.filter((value) => value !== 'LAND' && value !== 'OTHER').map((value) => <option key={value} value={value}>{propertyTypeLabels[value]}</option>)}
              {values.propertyType === 'LAND' && <option value="LAND">Plot / Land</option>}
              <option value="OTHER">Other</option>
            </select>
            {values.propertyType === 'COMMERCIAL' && <span className="mt-1 block text-[11px] text-[#9caaa4]">For office listings, set subtype to Office Space.</span>}
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Subtype</span><input maxLength={100} value={values.subtype} onChange={(event) => update('subtype', event.target.value)} placeholder={values.propertyType === 'APARTMENT' ? 'Flat, studio, penthouse' : values.propertyType === 'PLOT' ? 'Residential plot, commercial plot' : 'Independent house, office…'} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Project / development name</span><input maxLength={200} value={values.projectName} onChange={(event) => update('projectName', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
            <span className="mb-1.5 block">Location</span>
            <input
              maxLength={255}
              value={values.location}
              onChange={(event) => update('location', event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2"><span className="mb-1.5 block">Street address</span><input maxLength={500} value={values.address} onChange={(event) => update('address', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Locality</span><input maxLength={150} value={values.locality} onChange={(event) => update('locality', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">City</span><input maxLength={150} value={values.city} onChange={(event) => update('city', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">State</span><input maxLength={150} value={values.state} onChange={(event) => update('state', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Map or location link</span><input type="url" maxLength={1000} value={values.locationUrl} onChange={(event) => update('locationUrl', event.target.value)} className={inputClass} /></label>
          <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Availability</span><select value={values.availability} onChange={(event) => update('availability', event.target.value)} className={inputClass}>{['AVAILABLE','LIMITED','COMING_SOON','RESERVED','SOLD_OUT','UNAVAILABLE'].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></label>
           {(showTypeField(['APARTMENT', 'VILLA', 'OTHER'].includes(values.propertyType), values.bedrooms) || showTypeField(['APARTMENT', 'VILLA', 'OTHER'].includes(values.propertyType), values.bathrooms)) && <><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Bedrooms / BHK</span><input type="number" min="0" max="100" value={values.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} className={inputClass} /></label><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Bathrooms</span><input type="number" min="0" max="100" value={values.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} className={inputClass} /></label></>}
           {showTypeField(!['PLOT','LAND'].includes(values.propertyType), values.builtUpArea) && <><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Built-up area</span><input type="number" min="0.01" step="0.01" value={values.builtUpArea} onChange={(event) => update('builtUpArea', event.target.value)} className={inputClass} /></label><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Area unit</span><select value={values.builtUpAreaUnit} onChange={(event) => update('builtUpAreaUnit', event.target.value)} className={inputClass}><option value="">Select unit</option>{plotSizeUnits.map((unit) => <option key={unit} value={unit}>{formatLabel(unit)}</option>)}</select></label></>}
           {showTypeField(['APARTMENT', 'VILLA', 'COMMERCIAL', 'OTHER'].includes(values.propertyType), values.floorCount) && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Floors</span><input type="number" min="0" max="500" value={values.floorCount} onChange={(event) => update('floorCount', event.target.value)} className={inputClass} /></label>}
           {showTypeField(['APARTMENT', 'VILLA', 'COMMERCIAL', 'OTHER'].includes(values.propertyType), values.parkingSpaces) && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Parking spaces</span><input type="number" min="0" max="1000" value={values.parkingSpaces} onChange={(event) => update('parkingSpaces', event.target.value)} className={inputClass} /></label>}
           {showTypeField(['PLOT','LAND','COMMERCIAL','OTHER'].includes(values.propertyType), values.roadAccess) && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Road access</span><input maxLength={255} value={values.roadAccess} onChange={(event) => update('roadAccess', event.target.value)} className={inputClass} /></label>}
           {showTypeField(['PLOT','LAND','COMMERCIAL','OTHER'].includes(values.propertyType), values.approvalInfo) && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Approval details</span><input maxLength={500} value={values.approvalInfo} onChange={(event) => update('approvalInfo', event.target.value)} className={inputClass} /></label>}
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

        <section className={`${panelClass} p-4 sm:p-6`}>
          <div className="mb-4"><p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">PROPERTY STORY</p><h2 className={`mt-1 ${panelHeadingClass}`}>Description</h2><p className="mt-1 text-xs text-[#9caaa4]">Describe the opportunity in plain language. Existing text remains as entered.</p></div>
          <PropertyDescriptionEditor value={values.description} onChange={(description) => update('description', description)} maxLength={20000} />
        </section>

        <section className={`${panelClass} p-4 sm:p-6`}>
          <h2 className={panelHeadingClass}>Parent price and size</h2>
          <p className="mt-1 text-xs text-[#9caaa4]">Use this as the standalone price or a project-wide starting point. Option-specific prices belong below.</p>
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
            {showTypeField(['PLOT', 'LAND', 'VILLA'].includes(values.propertyType), values.plotSize) && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Plot size</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={values.plotSize}
                onChange={(event) => update('plotSize', event.target.value)}
                className={inputClass}
              />
            </label>}
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
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Minimum price (INR)</span><input type="number" min="0" step="0.01" value={values.priceMinimum} onChange={(event) => update('priceMinimum', event.target.value)} className={inputClass} /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Maximum price (INR)</span><input type="number" min="0" step="0.01" value={values.priceMaximum} onChange={(event) => update('priceMaximum', event.target.value)} className={inputClass} /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Price basis</span><select value={values.priceBasis} onChange={(event) => update('priceBasis', event.target.value)} className={inputClass}>{[['TOTAL','Total'],['PER_UNIT','Per unit'],['PER_SQFT','Per sq ft'],['PER_SQM','Per sq m'],['PER_ACRE','Per acre']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </section>

        <section className={`${panelClass} p-4 sm:p-6`}>
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">OPTIONAL</p><h2 className={`mt-1 ${panelHeadingClass}`}>Configurations &amp; pricing</h2><p className="mt-1 text-xs text-[#9caaa4]">Add options when a project has different sizes, layouts, prices, or availability.</p></div><button type="button" onClick={() => { const id = crypto.randomUUID(); setConfigurations((current) => [...current, { id, name: '', area: null, areaUnit: null, bedrooms: null, bathrooms: null, floor: null, block: null, priceMode: 'ON_REQUEST', priceAmount: null, priceMinimum: null, priceMaximum: null, priceCurrency: null, priceBasis: 'TOTAL', availability: 'AVAILABLE', availableUnits: null, features: [] }]); setExpandedConfiguration(id); }} className="inline-flex min-h-10 items-center gap-2 border border-[var(--gold)]/60 px-3 text-sm text-white transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Plus className="h-4 w-4" /> Add configuration</button></div>
          {configurations.length === 0 && <div className="mt-5 border border-dashed border-white/20 px-4 py-5 text-sm text-[#c4cec8]"><p className="font-medium text-white">One price is enough for a standalone property.</p><p className="mt-1 text-xs text-[#9caaa4]">Add configurations only when buyers need to choose between multiple options.</p></div>}
          <div className="mt-4 space-y-3">{configurations.map((configuration, index) => <details key={configuration.id ?? index} open={expandedConfiguration === configuration.id} onToggle={(event) => { if (configuration.id) setExpandedConfiguration(event.currentTarget.open ? configuration.id : (current) => current === configuration.id ? null : current); }} className="overflow-hidden border border-white/15 bg-[#071a16]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--gold)] [&::-webkit-details-marker]:hidden">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{configuration.name.trim() || `Configuration ${index + 1}`}</span><span className="mt-1 block truncate text-xs text-[#9caaa4]">{[configuration.area ? `${configuration.area} ${configuration.areaUnit ?? ''}`.trim() : null, configurationPriceLabel(configuration), formatLabel(configuration.availability)].filter(Boolean).join(' · ')}</span></span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--gold)]"><span className="hidden sm:inline">{expandedConfiguration === configuration.id ? 'Close' : 'Edit'}</span><ChevronDown className={`h-4 w-4 transition-transform ${expandedConfiguration === configuration.id ? 'rotate-180' : ''}`} /></span>
            </summary>
            <fieldset className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2"><legend className="sr-only">Configuration {index + 1} details</legend>
            <label className="text-xs text-[#9caaa4]">{values.propertyType === 'APARTMENT' ? 'Configuration name / BHK' : values.propertyType === 'VILLA' ? 'Villa model' : values.propertyType === 'PLOT' || values.propertyType === 'LAND' ? 'Plot size / group name' : values.propertyType === 'COMMERCIAL' ? 'Space / office name' : 'Configuration name'}<input required value={configuration.name} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,name:e.target.value} : item))} maxLength={150} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">{values.propertyType === 'PLOT' || values.propertyType === 'LAND' ? 'Plot area' : 'Area'}<input type="number" min="0.01" step="0.01" value={configuration.area ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,area:e.target.value || null, areaUnit:e.target.value ? item.areaUnit : null} : item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Area unit<select value={configuration.areaUnit ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,areaUnit:e.target.value || null} : item))} className={`${inputClass} mt-1`}><option value="">Select unit</option>{plotSizeUnits.map((unit)=><option key={unit} value={unit}>{formatLabel(unit)}</option>)}</select></label>
            {(['APARTMENT', 'VILLA'].includes(values.propertyType) || configuration.bedrooms !== null) && <label className="text-xs text-[#9caaa4]">Bedrooms / BHK<input type="number" min="0" max="100" value={configuration.bedrooms ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,bedrooms:e.target.value ? Number(e.target.value) : null} : item))} className={`${inputClass} mt-1`} /></label>}
            {(['APARTMENT', 'VILLA'].includes(values.propertyType) || configuration.bathrooms !== null) && <label className="text-xs text-[#9caaa4]">Bathrooms<input type="number" min="0" max="100" value={configuration.bathrooms ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,bathrooms:e.target.value ? Number(e.target.value) : null} : item))} className={`${inputClass} mt-1`} /></label>}
            <label className="text-xs text-[#9caaa4]">Floor<input value={configuration.floor ?? ''} maxLength={80} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,floor:e.target.value || null} : item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Block / tower<input value={configuration.block ?? ''} maxLength={100} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,block:e.target.value || null} : item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Pricing mode<select value={configuration.priceMode} onChange={(e) => setConfigurations((all) => all.map((item,i) => { if (i !== index) return item; const priceMode = e.target.value as Configuration['priceMode']; return priceMode === 'RANGE' ? {...item,priceMode,priceAmount:null} : priceMode === 'ON_REQUEST' ? {...item,priceMode,priceAmount:null,priceMinimum:null,priceMaximum:null,priceCurrency:null} : {...item,priceMode,priceMinimum:null,priceMaximum:null,priceBasis:priceMode === 'PER_UNIT' && item.priceBasis === 'TOTAL' ? 'PER_UNIT' : item.priceBasis}; }))} className={`${inputClass} mt-1`}>{['EXACT','RANGE','PER_UNIT','ON_REQUEST'].map((mode)=><option key={mode} value={mode}>{formatLabel(mode)}</option>)}</select></label>
            {['EXACT', 'PER_UNIT'].includes(configuration.priceMode) && <label className="text-xs text-[#9caaa4]">Fixed price (INR)<input type="number" min="0" step="0.01" value={configuration.priceAmount ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,priceAmount:e.target.value || null,priceCurrency:e.target.value ? 'INR' : null} : item))} className={`${inputClass} mt-1`} /></label>}
            {configuration.priceMode === 'RANGE' && <><label className="text-xs text-[#9caaa4]">From (INR)<input type="number" min="0" step="0.01" value={configuration.priceMinimum ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,priceMinimum:e.target.value || null,priceCurrency:e.target.value ? 'INR' : item.priceCurrency} : item))} className={`${inputClass} mt-1`} /></label><label className="text-xs text-[#9caaa4]">To (INR)<input type="number" min="0" step="0.01" value={configuration.priceMaximum ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,priceMaximum:e.target.value || null,priceCurrency:e.target.value ? 'INR' : item.priceCurrency} : item))} className={`${inputClass} mt-1`} /></label></>}
            <label className="text-xs text-[#9caaa4]">Availability<select value={configuration.availability} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,availability:e.target.value} : item))} className={`${inputClass} mt-1`}>{['AVAILABLE','LIMITED','COMING_SOON','RESERVED','SOLD_OUT','UNAVAILABLE'].map((value)=><option key={value} value={value}>{formatLabel(value)}</option>)}</select></label>
            {configuration.priceMode !== 'ON_REQUEST' && <label className="text-xs text-[#9caaa4]">Price basis<select value={configuration.priceBasis} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,priceBasis:e.target.value} : item))} className={`${inputClass} mt-1`}>{[['TOTAL','Total'],['PER_UNIT','Per unit'],['PER_SQFT','Per sq ft'],['PER_SQM','Per sq m'],['PER_ACRE','Per acre']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
            <label className="text-xs text-[#9caaa4]">Available unit count<input type="number" min="0" value={configuration.availableUnits ?? ''} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,availableUnits:e.target.value ? Number(e.target.value) : null} : item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4] sm:col-span-2">Configuration features (comma-separated)<input value={configuration.features.join(', ')} onChange={(e) => setConfigurations((all) => all.map((item,i) => i===index ? {...item,features:e.target.value.split(',').map((feature)=>feature.trim()).filter(Boolean).slice(0,50)} : item))} className={`${inputClass} mt-1`} /></label>
            <div className="sm:col-span-2"><p className="text-xs text-[#9caaa4]">Configuration images {configuration.id ? '(choose up to 12)' : '(save the property, then reopen to assign images)'}</p>{configuration.id && <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{mediaOptions.filter((media)=>media.mimeType.startsWith('image/')).map((media)=><label key={`${configuration.id}-${media.id}`} className="flex min-w-0 items-center gap-2 border border-white/10 p-2 text-[10px] text-[#f5f1e8]"><input type="checkbox" checked={(configurationMediaIds[configuration.id!] ?? []).includes(media.id)} disabled={!(configurationMediaIds[configuration.id!] ?? []).includes(media.id) && (configurationMediaIds[configuration.id!] ?? []).length >= 12} onChange={()=>setConfigurationMediaIds((current)=>{const selected=current[configuration.id!] ?? [];return {...current,[configuration.id!]:selected.includes(media.id)?selected.filter((id)=>id!==media.id):[...selected,media.id]};})} /><span className="truncate">{media.storageKey.split('/').pop()}</span></label>)}</div>}</div>
            <div className="flex flex-wrap items-end justify-between gap-3 sm:col-span-2"><div className="flex gap-2"><button type="button" onClick={() => { const id = crypto.randomUUID(); setConfigurations((all) => [...all.slice(0, index + 1), { ...configuration, id, name: `${configuration.name || 'Configuration'} copy`, media: [] }, ...all.slice(index + 1)]); setExpandedConfiguration(id); }} className="inline-flex min-h-10 items-center gap-2 border border-white/15 px-3 text-xs text-[#c4cec8] hover:border-[var(--gold)]"><Copy className="h-3.5 w-3.5" /> Duplicate</button><button type="button" onClick={() => { if (!window.confirm('Remove this configuration? Existing enquiries keep their saved configuration name and price.')) return; const removedId = configuration.id; setConfigurations((all)=>all.filter((_,i)=>i!==index)); if (removedId) { setInventory((all)=>all.map((unit)=>unit.configurationId === removedId ? {...unit,configurationId:null} : unit)); setConfigurationMediaIds((all)=>{const next={...all};delete next[removedId];return next;}); } setExpandedConfiguration(configurations.find((item, i) => i !== index)?.id ?? null); }} className="inline-flex min-h-10 items-center gap-2 px-2 text-xs text-red-300 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Remove</button></div></div>
            </fieldset></details>)}</div>
          <details open={inventoryDetailsOpen} onToggle={(event) => setInventoryDetailsOpen(event.currentTarget.open)} className="mt-6 border border-white/10 bg-[#071a16]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[#c4cec8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">Advanced: individual units / plots <span className="ml-2 text-xs text-[#9caaa4]">{inventory.length ? `${inventory.length} added` : 'Optional'}</span></summary>
          <div className="border-t border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg text-white">Unit-level availability</h3><p className="mt-1 text-xs text-[#9caaa4]">Use these records only when each unit or plot needs its own reference or availability.</p></div><button type="button" onClick={() => setInventory((current) => [...current, { reference: '', configurationId: null, availability: 'AVAILABLE', priceAmount: null, priceCurrency: null, area: null, areaUnit: null }])} className="min-h-10 border border-white/20 px-3 text-sm text-white hover:border-[var(--gold)]"><Plus className="mr-1 inline h-4 w-4" /> Add unit / plot</button></div>
          <div className="mt-4 space-y-3">{inventory.map((unit,index)=><fieldset key={unit.id ?? `new-${index}`} className="grid gap-3 border border-white/10 bg-[#061a16] p-4 sm:grid-cols-2"><legend className="px-2 text-xs text-[#9caaa4]">Inventory {index+1}</legend>
            <label className="text-xs text-[#9caaa4]">Reference / plot number<input required value={unit.reference} maxLength={120} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,reference:e.target.value}:item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Configuration<select value={unit.configurationId ?? ''} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,configurationId:e.target.value || null}:item))} className={`${inputClass} mt-1`}><option value="">Project-wide / ungrouped</option>{configurations.filter((configuration)=>configuration.id).map((configuration)=><option key={configuration.id} value={configuration.id}>{configuration.name}</option>)}</select></label>
            <label className="text-xs text-[#9caaa4]">Availability<select value={unit.availability} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,availability:e.target.value}:item))} className={`${inputClass} mt-1`}>{['AVAILABLE','LIMITED','COMING_SOON','RESERVED','SOLD_OUT','UNAVAILABLE'].map((value)=><option key={value} value={value}>{formatLabel(value)}</option>)}</select></label>
            <label className="text-xs text-[#9caaa4]">Price (INR)<input type="number" min="0" step="0.01" value={unit.priceAmount ?? ''} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,priceAmount:e.target.value || null,priceCurrency:e.target.value?'INR':null}:item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Area<input type="number" min="0.01" step="0.01" value={unit.area ?? ''} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,area:e.target.value || null,areaUnit:e.target.value?item.areaUnit:null}:item))} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-[#9caaa4]">Area unit<select value={unit.areaUnit ?? ''} onChange={(e)=>setInventory((all)=>all.map((item,i)=>i===index?{...item,areaUnit:e.target.value || null}:item))} className={`${inputClass} mt-1`}><option value="">Select unit</option>{plotSizeUnits.map((value)=><option key={value} value={value}>{formatLabel(value)}</option>)}</select></label>
            <div className="flex items-end justify-end"><button type="button" onClick={()=>{ if (window.confirm('Remove this individual unit or plot from the property?')) setInventory((all)=>all.filter((_,i)=>i!==index)); }} className="min-h-10 text-xs text-red-300 hover:underline"><Trash2 className="mr-1 inline h-4 w-4" /> Remove record</button></div>
          </fieldset>)}</div></div></details>
        </section>

        <section className={`${panelClass} p-4 sm:p-6`}>
          <h2 className={panelHeadingClass}>Representation &amp; publication</h2>
          <p className="mt-1 text-xs text-[#9caaa4]">Choose how JLUXE represents this opportunity and when it appears publicly.</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2"><span className="mb-1.5 block">Features &amp; amenities (comma-separated)</span><textarea rows={3} maxLength={5000} value={values.featuresText} onChange={(event)=>update('featuresText',event.target.value)} placeholder="Only enter verified features" className={`${inputClass} py-3`} /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">SEO title</span><input maxLength={200} value={values.seoTitle} onChange={(event)=>update('seoTitle',event.target.value)} className={inputClass} /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">SEO description</span><textarea rows={2} maxLength={320} value={values.seoDescription} onChange={(event)=>update('seoDescription',event.target.value)} className={`${inputClass} py-3`} /></label>
          </div>
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
          <div role="alert" className="border-l-2 border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
            {validationDetails.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{validationDetails.map((detail, index) => <li key={`${detail.field}-${index}`}><span className="font-medium">{detail.field}:</span> {detail.message}</li>)}</ul>}
          </div>
        )}

        <div className="sticky bottom-3 z-30 -mx-2 flex flex-wrap items-center justify-between gap-3 border border-white/15 bg-[#061815]/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur sm:mx-0 sm:px-4">
          <Link href="/admin/properties" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-medium text-[#c4cec8] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">Cancel</Link>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="saveAction" value="draft" disabled={saving} className="inline-flex min-h-11 items-center justify-center border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-60">{saving ? 'Saving…' : 'Save draft'}</button>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90 disabled:opacity-60">{saving ? 'Saving…' : values.publicationStatus === 'PUBLISHED' ? isEditing ? 'Update property' : duplicate ? 'Create & publish' : 'Publish property' : values.publicationStatus === 'ARCHIVED' ? 'Save archive status' : isEditing ? 'Save changes' : duplicate ? 'Create duplicate' : 'Create property'}</button>
          </div>
        </div>
      {/* Media Management Section for existing property */}
      {(
        <section className={`${panelClass} mt-5 p-4 sm:p-6`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">MEDIA &amp; GALLERY</p>
              <h2 className="mt-1 font-display text-2xl text-white">Property media</h2>
              <p className="mt-1 text-xs text-[#9caaa4]">
                The image marked Cover Image is used on property cards. Reorder images or choose a new cover at any time.
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
          <div className="mt-5 flex flex-wrap gap-2">
            <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded bg-[var(--viridian-800)] px-4 text-sm font-medium text-white ${uploading || mediaActionPending ? 'cursor-not-allowed opacity-50' : ''}`}>
              {uploading ? 'Uploading…' : '+ Upload Images'}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading || mediaActionPending || mediaList.length >= 12} className="sr-only" onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = ''; }} />
            </label>
            <span className="text-xs self-center text-[#9caaa4]">Or choose an image from the existing Media list below.</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    className={`flex min-w-0 flex-col gap-3 border p-3 ${
                      isCover
                        ? 'border-[var(--gold)]/60 bg-[#0c2a23]'
                        : 'border-white/10 bg-[#08201b]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border border-white/10 bg-[var(--sand)]">
                        <img
                          src={item.deliveryUrl ?? getMediaImageUrl(item.storageKey, 'property')}
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
                        <p className="mt-1 truncate text-xs text-white/70">{item.storageKey.split('/').pop()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
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

          <div className="mt-6">
            <button type="button" onClick={() => setMediaPickerOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 rounded border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/5">
              <Plus className="h-4 w-4" /> Choose from Media
            </button>
            {mediaPickerOpen && <div role="dialog" aria-label="Choose existing media" className="mt-3 rounded-lg border border-white/15 bg-[#08201b] p-4">
              <p className="text-xs text-[#9caaa4]">Choose one or more existing images. Selecting them creates only a PropertyMedia relationship.</p>
              {mediaLoading ? <p className="py-5 text-sm text-[#9caaa4]">Loading media…</p> : mediaOptions.length === 0 ? <p className="py-5 text-sm text-[#9caaa4]">No media available in the library.</p> : <div className="mt-3 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                {mediaOptions.map((media) => {
                  const attached = mediaList.some((item) => item.mediaId === media.id);
                  const selected = selectedMediaIdsToAdd.includes(media.id);
                  return <label key={media.id} className={`cursor-pointer overflow-hidden rounded border ${attached ? 'border-emerald-500/50 opacity-60' : selected ? 'border-[var(--gold)]' : 'border-white/10'}`}>
                    <img src={media.deliveryUrl ?? getMediaImageUrl(media.storageKey, 'property')} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="flex items-start gap-2 p-2"><input type="checkbox" checked={attached || selected} disabled={attached || mediaActionPending} onChange={() => setSelectedMediaIdsToAdd((current) => selected ? current.filter((id) => id !== media.id) : [...current, media.id])} className="mt-0.5 accent-[var(--gold)]" />
                      <span className="min-w-0"><span className="block truncate text-xs text-white">{media.storageKey.split('/').pop()}</span><span className="block text-[10px] text-[#9caaa4]">{media.mimeType}{media.byteSize ? ` · ${(Number(media.byteSize) / 1024).toFixed(0)} KB` : ''}{attached ? ' · Attached' : ''}</span></span>
                    </div>
                  </label>;
                })}
              </div>}
              <div className="mt-3 flex gap-2"><button type="button" onClick={handleAddMedia} disabled={!selectedMediaIdsToAdd.length || mediaActionPending} className="min-h-10 rounded bg-[var(--viridian-800)] px-4 text-sm text-white disabled:opacity-40">Add selected ({selectedMediaIdsToAdd.length})</button><button type="button" onClick={() => setMediaPickerOpen(false)} className="min-h-10 px-3 text-sm text-[#9caaa4]">Close</button></div>
            </div>}
          </div>
        </section>
      )}

      <details className="mt-5 border border-white/10 bg-[#08201b]/70">
      <summary className="cursor-pointer px-4 py-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">Additional details <span className="ml-2 text-xs font-normal text-[#9caaa4]">Documents, plans and promotional images</span></summary>
      <div className="space-y-5 border-t border-white/10 p-4 sm:p-6">
      <section className="pt-1">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">DOCUMENTS</p>
        <h2 className="mt-1 font-display text-2xl text-white">Plans &amp; property documents</h2>
        <p className="mt-1 text-xs text-[#9caaa4]">PDF uploads are restricted to 25 MB and verified in the property documents folder.</p>
        {property ? <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-[#9caaa4]">Document type<select value={documentKind} onChange={(event)=>setDocumentKind(event.target.value as PropertyDocumentKind)} className={`${inputClass} mt-1`}><option value="FLOOR_PLAN">Floor plan</option><option value="BROCHURE">Brochure</option><option value="PRICE_DOCUMENT">Pricing document</option></select></label>
          <label className={`inline-flex min-h-11 cursor-pointer items-center border border-white/20 px-4 text-sm text-white hover:border-[var(--gold)] ${documentBusy ? 'pointer-events-none opacity-50' : ''}`}>{documentBusy ? 'Working…' : 'Upload PDF'}<input type="file" accept="application/pdf,.pdf" disabled={documentBusy} className="sr-only" onChange={(event)=>{void uploadDocument(event.currentTarget.files?.[0]);event.currentTarget.value='';}} /></label>
        </div> : <p className="mt-4 text-sm text-[#9caaa4]">Save this property first to attach supporting documents.</p>}
        {documentMessage && <p role="status" className="mt-3 text-sm text-[#f5f1e8]">{documentMessage}</p>}
        {documents.length > 0 && <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">{documents.map((document)=><li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><span className="text-white">{formatLabel(document.kind)}</span><span className="ml-2 text-xs text-[#9caaa4]">{document.title} · {(Number(document.byteSize)/1024).toFixed(0)} KB</span></span><span className="flex gap-4"><a href={document.url} target="_blank" rel="noreferrer" className="text-[var(--gold)] hover:underline">Open</a><button type="button" onClick={()=>void removeDocument(document.id)} disabled={documentBusy} className="text-red-300 hover:underline disabled:opacity-50">Remove</button></span></li>)}</ul>}
      </section>

      <section className="border-t border-white/10 pt-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROMOTIONAL MEDIA</p><h2 className="mt-1 font-display text-2xl text-white">Banners &amp; creatives</h2><p className="mt-1 text-xs text-[#9caaa4]">Choose existing property images. Landscape and portrait assignments are validated from the stored image dimensions and remain separate from the gallery.</p>
        {property ? <><label className="mt-4 block max-w-xs text-xs text-[#9caaa4]">Asset orientation<select value={promoKind} onChange={(event)=>setPromoKind(event.target.value as typeof promoKind)} className={`${inputClass} mt-1`}><option value="PROMO_LANDSCAPE">Landscape banner</option><option value="PROMO_PORTRAIT">Portrait creative</option></select></label>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{mediaOptions.filter((media)=>media.mimeType.startsWith('image/') && (promoKind === 'PROMO_LANDSCAPE' ? !media.width || !media.height || media.width > media.height : !media.width || !media.height || media.height > media.width)).map((media)=>{const selected=promoSelection.some((item)=>item.mediaId===media.id&&item.kind===promoKind);return <label key={`${promoKind}-${media.id}`} className={`cursor-pointer overflow-hidden border ${selected?'border-[var(--gold)]':'border-white/15'}`}><img src={media.deliveryUrl ?? getMediaImageUrl(media.storageKey,'property')} alt="" className="aspect-[4/3] w-full object-cover"/><span className="flex items-center gap-2 p-2 text-xs text-white"><input type="checkbox" checked={selected} onChange={()=>setPromoSelection((current)=>selected?current.filter((item)=>item.mediaId!==media.id||item.kind!==promoKind):[...current,{mediaId:media.id,kind:promoKind}])} />{media.storageKey.split('/').pop()}</span></label>;})}</div>
          {promoMessage && <p role="status" className="mt-3 text-sm text-[#f5f1e8]">{promoMessage}</p>}<button type="button" disabled={mediaActionPending} onClick={()=>void savePromotionalAssets()} className="mt-4 min-h-10 border border-[var(--gold)] px-4 text-sm font-semibold text-[var(--gold)] disabled:opacity-50">{mediaActionPending?'Saving…':'Save promotional selections'}</button>
        </> : <p className="mt-4 text-sm text-[#9caaa4]">Save this property first to assign promotional images.</p>}
      </section>
      </div>
      </details>
      </form>
    </div>
  );
}
