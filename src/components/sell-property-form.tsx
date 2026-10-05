'use client';

import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { plotSizeUnits, propertyTypes } from '@/lib/db/types';

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

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
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
        }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean } | null;

      if (!response.ok || result?.success !== true) {
        setStatus('error');
        setError(response.status === 400 ? 'Please review the required details and try again.' : 'We could not submit your property details right now. Please try again.');
        return;
      }

      setValues(initialValues);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('We could not submit your property details right now. Please try again.');
    }
  };

  const inputClass = 'min-h-11 w-full rounded-2xl border border-black/10 bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px]';

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_55px_rgba(6,47,41,0.08)] sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

        <p className="text-sm leading-6 text-[var(--muted)]">Property media is optional and can be shared later if required.</p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={status === 'submitting'} className="touch-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--viridian-800)] disabled:cursor-not-allowed disabled:opacity-70">
            {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <>Submit Property Details<ArrowRight className="h-4 w-4" /></>}
          </button>
          {status === 'success' && <div role="status" aria-live="polite" className="form-status flex items-start gap-2 border-l-2 border-[var(--gold)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--viridian-950)]"><CheckCircle2 className="h-4 w-4" />Your property details have been received. Our team will review your listing and contact you.</div>}
          {status === 'error' && <p role="alert" className="form-status border-l-2 border-red-600 bg-[var(--cream)] px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </div>
  );
}
