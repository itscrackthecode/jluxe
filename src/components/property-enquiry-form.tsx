'use client';

import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/turnstile-widget';

type PropertySummary = {
  id: string; slug: string; title: string; location: string | null; propertyType: string;
  priceAmount: string | null; priceCurrency: string | null; priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  priceMinimum: string | null; priceMaximum: string | null; priceBasis: string;
  images: Array<{ id: string; deliveryUrl?: string | null; altText: string | null }>;
};
type ConfigurationSummary = { id: string; name: string; priceMode: string; priceAmount: string | null; priceMinimum: string | null; priceMaximum: string | null; priceCurrency: string | null; priceBasis: string; availability: string };
type InventorySummary = { id: string; reference: string; priceAmount: string | null; priceCurrency: string | null; availability: string };

const controlClass = 'min-h-12 w-full min-w-0 rounded-xl border border-[var(--viridian-950)]/15 bg-white px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--muted)]/80 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px]';
const labelClass = 'mb-2 block text-sm font-medium text-[var(--viridian-950)]';

function formatPrice(property: PropertySummary) {
  if (property.priceMinimum || property.priceMaximum) {
    const money = (value: string | null) => {
      if (!value) return '—';
      const amount = Number(value);
      if (!Number.isFinite(amount)) return '—';
      try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: property.priceCurrency ?? 'INR', maximumFractionDigits: 2 }).format(amount); }
      catch { return `${new Intl.NumberFormat().format(amount)} ${property.priceCurrency ?? 'INR'}`; }
    };
    return `${money(property.priceMinimum)} – ${money(property.priceMaximum)}${property.priceBasis !== 'TOTAL' ? ` / ${property.priceBasis.toLowerCase().replaceAll('_', ' ')}` : ''}`;
  }
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'Price on request' : null;
  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return null;
  let formatted = new Intl.NumberFormat().format(amount);
  if (property.priceCurrency) {
    try { formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: property.priceCurrency, maximumFractionDigits: 2 }).format(amount); }
    catch { formatted = `${formatted} ${property.priceCurrency}`; }
  }
  return property.priceMode === 'STARTING_FROM' ? `From ${formatted}` : formatted;
}

export default function PropertyEnquiryForm({ property, configuration, inventory }: { property: PropertySummary; configuration?: ConfigurationSummary | null; inventory?: InventorySummary | null }) {
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [values, setValues] = useState({ name: '', phone: '', email: '', message: '' });
  const price = configuration ? configuration.priceMode === 'ON_REQUEST' ? 'Price on request' : configuration.priceMode === 'RANGE' ? `${configuration.priceCurrency ?? 'INR'} ${configuration.priceMinimum ?? '—'} – ${configuration.priceMaximum ?? '—'}` : configuration.priceAmount ? `${configuration.priceCurrency ?? 'INR'} ${configuration.priceAmount}${configuration.priceBasis !== 'TOTAL' ? ` / ${configuration.priceBasis.toLowerCase()}` : ''}` : null : inventory ? inventory.priceAmount ? `${inventory.priceCurrency ?? 'INR'} ${inventory.priceAmount}` : null : formatPrice(property);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError('');
    try {
      const turnstileToken = await turnstileRef.current?.getToken();
      if (!turnstileToken) throw new Error('Security check unavailable.');
      const response = await fetch(`/api/properties/${encodeURIComponent(property.slug)}/enquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, ...(configuration ? { configurationId: configuration.id } : {}), ...(inventory ? { inventoryId: inventory.id } : {}), turnstileToken }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
      if (!response.ok || result?.success !== true) {
        setError(response.status === 409 ? result?.error ?? 'This property is no longer available for enquiry.' : response.status === 400 ? 'Please check your details and try again.' : 'We could not submit your enquiry right now. Please try again.');
        setStatus('error');
        return;
      }
      setValues({ name: '', phone: '', email: '', message: '' });
      setStatus('success');
    } catch {
      setError('We could not submit your enquiry right now. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--viridian-950)]/10 bg-white shadow-[0_18px_55px_rgba(6,47,41,0.08)]">
      <div className="grid min-w-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <aside className="min-w-0 bg-[var(--viridian-950)] p-5 text-white sm:p-7">
          {property.images[0]?.deliveryUrl && <img src={property.images[0].deliveryUrl} alt={property.images[0].altText || property.title} className="mb-5 aspect-[16/10] w-full rounded-xl object-cover" />}
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">SELECTED PROPERTY</p>
          <h3 className="mt-2 break-words font-display text-2xl leading-tight">{property.title}</h3>
          {property.location && <p className="mt-2 text-sm text-white/70">{property.location}</p>}
          <dl className="mt-5 space-y-3 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-white/60">Reference</dt><dd className="break-all text-right">{property.slug}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-white/60">Property type</dt><dd className="text-right">{property.propertyType.replaceAll('_', ' ')}</dd></div>
            {price && <div className="flex justify-between gap-4"><dt className="text-white/60">Listed price</dt><dd className="text-right">{price}</dd></div>}
            {configuration && <div className="flex justify-between gap-4"><dt className="text-white/60">Configuration</dt><dd className="text-right">{configuration.name}</dd></div>}
            {inventory && <div className="flex justify-between gap-4"><dt className="text-white/60">Unit / plot</dt><dd className="text-right">{inventory.reference}</dd></div>}
          </dl>
        </aside>
        <form onSubmit={submit} className="min-w-0 space-y-5 p-5 sm:p-7">
          <div><h3 className="font-display text-2xl text-[var(--viridian-950)]">Enquire about this property</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Share your contact details and a short message. Our team will be in touch.</p></div>
          <label className="block"><span className={labelClass}>Full name *</span><input className={controlClass} autoComplete="name" value={values.name} onChange={(e) => { setValues({ ...values, name: e.target.value }); setStatus('idle'); }} minLength={2} maxLength={150} required /></label>
          <div className="grid min-w-0 gap-5 sm:grid-cols-2">
            <label className="min-w-0"><span className={labelClass}>Mobile / WhatsApp number *</span><input className={controlClass} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => { setValues({ ...values, phone: e.target.value }); setStatus('idle'); }} minLength={6} maxLength={32} required /></label>
            <label className="min-w-0"><span className={labelClass}>Email address *</span><input className={controlClass} type="email" autoComplete="email" value={values.email} onChange={(e) => { setValues({ ...values, email: e.target.value }); setStatus('idle'); }} maxLength={320} required /></label>
          </div>
          <label className="block"><span className={labelClass}>Message *</span><textarea className={controlClass} rows={4} value={values.message} onChange={(e) => { setValues({ ...values, message: e.target.value }); setStatus('idle'); }} minLength={5} maxLength={5000} required placeholder="Tell us what you would like to know about this property." /></label>
          <TurnstileWidget ref={turnstileRef} action="property_enquiry" />
          <button type="submit" disabled={status === 'submitting'} className="touch-press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--viridian-950)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(6,47,41,0.15)] transition-colors hover:bg-[var(--viridian-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
            {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <>Send property enquiry <ArrowRight className="h-4 w-4" /></>}
          </button>
          {status === 'success' && <p role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--cream)] px-4 py-3 text-sm text-[var(--viridian-950)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Your enquiry has been submitted. Our team will follow up shortly.</p>}
          {status === 'error' && <p role="alert" className="rounded-xl border border-red-600/20 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </form>
      </div>
    </div>
  );
}
