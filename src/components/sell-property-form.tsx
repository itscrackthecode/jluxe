'use client';

import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { plotSizeUnits, propertyTypes } from '@/lib/db/types';
import { MAX_IMAGE_COUNT, uploadImage, validateImageFile, type UploadedCloudinaryImage } from '@/lib/cloudinary-client';

type FormValues = {
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  location: string;
  startingPrice: string;
  plotSize: string;
  plotSizeUnit: string;
  description: string;
};

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  propertyType: '',
  location: '',
  startingPrice: '',
  plotSize: '',
  plotSizeUnit: '',
  description: '',
};

const formatLabel = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SellPropertyForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<Array<{ image: UploadedCloudinaryImage; preview: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (photos.length + selected.length > MAX_IMAGE_COUNT) {
      setError(`You can add up to ${MAX_IMAGE_COUNT} photos.`);
      return;
    }
    const issue = selected.map(validateImageFile).find(Boolean);
    if (issue) { setError(issue); return; }
    setError('');
    setUploading(true);
    try {
      for (const file of selected) {
        const image = await uploadImage(file, '/api/properties/sell/media');
        const verify = await fetch('/api/properties/sell/media', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'verify', ...image }),
        });
        const result = await verify.json();
        if (!verify.ok || !result.success) throw new Error(result.error ?? 'Unable to verify this photo.');
        setPhotos((current) => [...current, { image, preview: URL.createObjectURL(file), name: file.name }]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (!photo) return;
    setUploading(true);
    try {
      const response = await fetch('/api/properties/sell/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'discard', ...photo.image }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to remove this photo.');
      URL.revokeObjectURL(photo.preview);
      setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove this photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/properties/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          propertyType: values.propertyType,
          location: values.location.trim(),
          startingPrice: values.startingPrice.trim(),
          plotSize: values.plotSize.trim(),
          plotSizeUnit: values.plotSizeUnit,
          description: values.description.trim(),
          images: photos.map(({ image }) => image),
        }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean } | null;

      if (!response.ok || result?.success !== true) {
        setStatus('error');
        setError(response.status === 400 ? 'Please review the required details and try again.' : 'We could not submit your property details right now. Please try again.');
        return;
      }

      setValues(initialValues);
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('We could not submit your property details right now. Please try again.');
    }
  };

  const inputClass = 'min-h-11 w-full rounded-2xl border border-black/10 bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px]';

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_55px_rgba(6,47,41,0.08)] sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Name *</span>
            <input className={inputClass} value={values.name} onChange={(event) => update('name', event.target.value)} required minLength={2} maxLength={150} placeholder="Your name" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Email *</span>
            <input className={inputClass} type="email" value={values.email} onChange={(event) => update('email', event.target.value)} required maxLength={320} placeholder="you@example.com" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">WhatsApp / Contact Number *</span>
            <input className={inputClass} value={values.phone} onChange={(event) => update('phone', event.target.value)} required minLength={6} maxLength={32} placeholder="+00 00000 00000" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Property Type *</span>
            <select className={inputClass} value={values.propertyType} onChange={(event) => update('propertyType', event.target.value)} required>
              <option value="">Select property type</option>
              {propertyTypes.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Location *</span>
            <input className={inputClass} value={values.location} onChange={(event) => update('location', event.target.value)} required maxLength={255} placeholder="City, area or address" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Starting Price *</span>
            <input className={inputClass} value={values.startingPrice} onChange={(event) => update('startingPrice', event.target.value)} required maxLength={100} placeholder="e.g. From 50 lakh" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Plot / Land Area</span>
            <input className={inputClass} value={values.plotSize} onChange={(event) => update('plotSize', event.target.value)} maxLength={50} placeholder="Optional" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Area Unit</span>
            <select className={inputClass} value={values.plotSizeUnit} onChange={(event) => update('plotSizeUnit', event.target.value)}>
              <option value="">Select unit</option>
              {plotSizeUnits.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Additional Description</span>
          <textarea className={inputClass} value={values.description} onChange={(event) => update('description', event.target.value)} rows={6} maxLength={10000} placeholder="Tell us anything else about the property or opportunity." />
        </label>

        <section className="space-y-3 border-t border-black/10 pt-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--viridian-950)]">Property Photos</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Up to {MAX_IMAGE_COUNT} JPG, PNG, WebP, or AVIF photos. Maximum 10 MB each.</p>
          </div>
          <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--viridian-950)]/20 px-4 text-sm font-semibold text-[var(--viridian-950)] ${uploading || status === 'submitting' ? 'cursor-not-allowed opacity-50' : ''}`}>
            {uploading ? 'Uploading photos…' : '+ Add Photos'}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading || status === 'submitting' || photos.length >= MAX_IMAGE_COUNT} className="sr-only" onChange={(event) => { void addPhotos(event.target.files); event.currentTarget.value = ''; }} />
          </label>
          {photos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <div key={`${photo.image.publicId}-${index}`} className="relative overflow-hidden rounded-lg border border-black/10">
            <img src={photo.preview} alt={photo.name} className="aspect-[4/3] w-full object-cover" />
            <button type="button" onClick={() => void removePhoto(index)} disabled={uploading || status === 'submitting'} className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-red-700">Remove</button>
            <p className="truncate px-2 py-1 text-xs text-[var(--muted)]">{photo.name}</p>
          </div>)}</div>}
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={status === 'submitting' || uploading} className="touch-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--viridian-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--viridian-950)] disabled:cursor-not-allowed disabled:opacity-70">
            {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <>Submit Property Details<ArrowRight className="h-4 w-4" /></>}
          </button>
          {status === 'success' && <div role="status" aria-live="polite" className="form-status flex items-start gap-2 border-l-2 border-[var(--gold)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--viridian-950)]"><CheckCircle2 className="h-4 w-4" />Property submitted successfully. Our team will review your submission.</div>}
          {status === 'error' && <p role="alert" className="form-status border-l-2 border-red-600 bg-[var(--cream)] px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </div>
  );
}
