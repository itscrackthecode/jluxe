'use client';

import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import {
  buyerAreaUnitLabel,
  buyerAreaUnits,
  buyerBedroomOptions,
  buyerCategoryForPropertyType,
  buyerCommercialUseOptions,
  buyerConditionOptions,
  buyerContactMethods,
  buyerLandUseOptions,
  buyerSubtypeForPropertyType,
  buyerPropertyTypeLabels,
  buyerPropertyTypes,
  buyerPropertySubtypes,
  buyerReadinessOptions,
  type BuyerPropertyType,
} from '@/lib/buyer-property';

const MIN_BUDGET = 100_000;
const MAX_BUDGET = 1_000_000_000;
const BUDGET_STEP = 100_000;
const budgetFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

type FormValues = {
  propertyType: BuyerPropertyType;
  propertySubtype: string;
  preferredCity: string;
  preferredLocality: string;
  budgetMin: string;
  budgetMax: string;
  bedrooms: string;
  propertyCondition: string;
  preferredArea: string;
  areaUnit: string;
  intendedUse: string;
  otherIntendedUse: string;
  readiness: string;
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  additionalRequirements: string;
};

type SelectedProperty = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  propertyType: string;
};

function createInitialValues(property?: SelectedProperty): FormValues {
  return {
    propertyType: property ? buyerCategoryForPropertyType(property.propertyType) : 'RESIDENTIAL',
    propertySubtype: property ? buyerSubtypeForPropertyType(property.propertyType) : '',
    preferredCity: property?.location ?? '',
    preferredLocality: '',
    budgetMin: String(MIN_BUDGET),
    budgetMax: String(MAX_BUDGET),
    bedrooms: '',
    propertyCondition: '',
    preferredArea: '',
    areaUnit: 'SQFT',
    intendedUse: '',
    otherIntendedUse: '',
    readiness: '',
    name: '',
    email: '',
    phone: '',
    preferredContactMethod: 'Phone',
    additionalRequirements: '',
  };
}

const controlClass = 'min-h-12 w-full min-w-0 rounded-xl border border-[var(--viridian-950)]/15 bg-white px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--muted)]/80 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px]';
const labelClass = 'mb-2 block text-sm font-medium text-[var(--viridian-950)]';

export default function BuyerPropertyForm({ property }: { property?: SelectedProperty }) {
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [values, setValues] = useState(() => createInitialValues(property));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (status !== 'idle') setStatus('idle');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    if (Number(values.budgetMax) < Number(values.budgetMin)) {
      setStatus('error');
      setError('Maximum budget must be at least the minimum budget.');
      return;
    }

    let details: Record<string, string> = {};
    if (values.propertyType === 'RESIDENTIAL') {
      details = {
        bedrooms: values.bedrooms,
        propertyCondition: values.propertyCondition,
        preferredArea: values.preferredArea,
        ...(values.preferredArea ? { areaUnit: values.areaUnit } : {}),
      };
    } else if (values.propertyType === 'COMMERCIAL') {
      details = {
        intendedUse: values.intendedUse,
        otherIntendedUse: values.otherIntendedUse,
        requiredFloorArea: values.preferredArea,
        areaUnit: values.areaUnit,
        readiness: values.readiness,
      };
    } else if (values.propertyType === 'LAND_PLOT') {
      details = {
        preferredArea: values.preferredArea,
        areaUnit: values.areaUnit,
        intendedUse: values.intendedUse,
        otherIntendedUse: values.otherIntendedUse,
      };
    } else if (values.propertyType === 'OTHER') {
      details = {
        preferredArea: values.preferredArea,
        ...(values.preferredArea ? { areaUnit: values.areaUnit } : {}),
      };
    }

    try {
      const turnstileToken = await turnstileRef.current?.getToken();
      if (!turnstileToken) throw new Error('Security check unavailable.');
      const response = await fetch('/api/properties/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: values.propertyType,
          propertySubtype: values.propertySubtype,
          preferredCity: values.preferredCity.trim(),
          preferredLocality: values.preferredLocality.trim(),
          budgetMin: values.budgetMin,
          budgetMax: values.budgetMax,
          details,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          preferredContactMethod: values.preferredContactMethod,
          additionalRequirements: values.additionalRequirements.trim(),
          turnstileToken,
        }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;

      if (!response.ok || result?.success !== true) {
        setStatus('error');
        setError(response.status === 409
          ? result?.error ?? 'This property is no longer available for enquiry.'
          : response.status === 400
            ? 'Please review the required details and try again.'
            : 'We could not submit your property requirements right now. Please try again.');
        return;
      }

      setValues(createInitialValues(property));
      setStatus('success');
    } catch {
      setStatus('error');
      setError('We could not submit your property requirements right now. Please try again.');
    }
  };

  const areaRequired = values.propertyType === 'COMMERCIAL' || values.propertyType === 'LAND_PLOT';
  const areaLabel = values.propertyType === 'COMMERCIAL'
    ? 'Required floor area'
    : values.propertyType === 'LAND_PLOT'
      ? 'Preferred land area'
      : 'Preferred size or area';
  const minimumBudgetPosition = ((Number(values.budgetMin) - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;
  const maximumBudgetPosition = ((Number(values.budgetMax) - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--viridian-950)]/10 bg-[var(--cream)] shadow-[0_18px_55px_rgba(6,47,41,0.1)]">
      <div className="border-b border-white/10 bg-[var(--viridian-950)] px-6 py-7 text-white sm:px-9 sm:py-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY CONSULTATION</p>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl">Tell us your requirements</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">A few details will help us understand your property preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-5 sm:p-8 lg:p-9">
        <section aria-labelledby="buyer-preferences-title" className="space-y-5">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/60 text-xs font-semibold text-[var(--viridian-800)]">01</span>
            <div>
              <h3 id="buyer-preferences-title" className="font-display text-xl text-[var(--viridian-950)]">Property preferences</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Start with the kind of property and budget you have in mind.</p>
            </div>
          </div>

          {property && <div className="grid gap-4 rounded-2xl border border-[var(--viridian-950)]/10 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)]">SELECTED PROPERTY</p>
              <h4 className="mt-1 break-words font-display text-lg text-[var(--viridian-950)]">{property.title}</h4>
              {property.location && <p className="mt-1 text-sm text-[var(--muted)]">{property.location}</p>}
              <p className="mt-2 text-[10px] font-medium tracking-[0.08em] text-[var(--muted)]">PROPERTY REF · {property.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full border border-[var(--gold)]/45 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--viridian-800)]">{buyerPropertyTypeLabels[values.propertyType]}</span>
              <span className="rounded-full border border-[var(--viridian-950)]/10 px-3 py-1.5 text-xs font-medium text-[var(--muted)]">{buyerSubtypeForPropertyType(property.propertyType)}</span>
            </div>
          </div>}

          {!property && <fieldset>
            <legend className={labelClass}>What are you looking to buy? *</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {buyerPropertyTypes.map((type) => <button key={type} type="button" aria-pressed={values.propertyType === type} onClick={() => { update('propertyType', type); update('propertySubtype', ''); }} className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${values.propertyType === type ? 'border-[var(--viridian-950)] bg-[var(--viridian-950)] text-white' : 'border-[var(--viridian-950)]/15 bg-white text-[var(--viridian-950)] hover:border-[var(--gold)]'}`}>{buyerPropertyTypeLabels[type]}</button>)}
            </div>
          </fieldset>}

          {!property && <div>
            <label>
              <span className={labelClass}>Property Type *</span>
              {values.propertyType === 'OTHER' ? (
                <input className={controlClass} value={values.propertySubtype} onChange={(event) => update('propertySubtype', event.target.value)} required minLength={2} maxLength={150} placeholder="Enter the property type" />
              ) : (
                <select className={controlClass} value={values.propertySubtype} onChange={(event) => update('propertySubtype', event.target.value)} required>
                  <option value="">Select a property type</option>
                  {(buyerPropertySubtypes[values.propertyType as keyof typeof buyerPropertySubtypes] ?? ['Other']).map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
                </select>
              )}
            </label>
          </div>}

          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Preferred city or location *</span>
              <input className={controlClass} type="search" autoComplete="address-level2" value={values.preferredCity} onChange={(event) => update('preferredCity', event.target.value)} required minLength={2} maxLength={255} placeholder={property?.location ?? 'City, area or preferred location'} />
            </label>
            <label>
              <span className={labelClass}>Preferred locality <span className="font-normal text-[var(--muted)]">(optional)</span></span>
              <input className={controlClass} value={values.preferredLocality} onChange={(event) => update('preferredLocality', event.target.value)} maxLength={255} placeholder="Neighbourhood or locality" />
            </label>
          </div>

          <div>
            <p id="budget-range-label" className={labelClass}>Budget range <span className="ml-1 rounded-full bg-[var(--viridian-950)]/5 px-2 py-1 text-xs font-semibold text-[var(--viridian-800)]">INR</span> <span aria-hidden="true">*</span></p>
            <div role="group" aria-labelledby="budget-range-label" className="rounded-xl border border-[var(--viridian-950)]/10 bg-white px-4 pb-3 pt-4 sm:px-5">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-[var(--viridian-950)]" aria-live="polite">
                <output>Min {budgetFormatter.format(Number(values.budgetMin))}</output>
                <output className="text-right">Max {budgetFormatter.format(Number(values.budgetMax))}</output>
              </div>
              <div className="buyer-budget-range relative mt-3 h-7">
                <div aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--viridian-950)]/10" />
                <div aria-hidden="true" className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--gold)]" style={{ left: `${minimumBudgetPosition}%`, width: `${maximumBudgetPosition - minimumBudgetPosition}%` }} />
                <input className="buyer-budget-range-input" type="range" aria-label="Minimum budget in Indian rupees" aria-valuetext={budgetFormatter.format(Number(values.budgetMin))} min={MIN_BUDGET} max={Math.max(MIN_BUDGET, Number(values.budgetMax) - BUDGET_STEP)} step={BUDGET_STEP} value={values.budgetMin} onChange={(event) => update('budgetMin', event.target.value)} />
                <input className="buyer-budget-range-input" type="range" aria-label="Maximum budget in Indian rupees" aria-valuetext={budgetFormatter.format(Number(values.budgetMax))} min={Math.min(MAX_BUDGET, Number(values.budgetMin) + BUDGET_STEP)} max={MAX_BUDGET} step={BUDGET_STEP} value={values.budgetMax} onChange={(event) => update('budgetMax', event.target.value)} />
              </div>
              <span className="flex justify-between text-[10px] text-[var(--muted)]"><span>₹1 lakh</span><span>₹100 crore</span></span>
            </div>
          </div>
        </section>

        <section aria-labelledby="buyer-specific-title" className="space-y-5 border-t border-[var(--viridian-950)]/10 pt-7">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/60 text-xs font-semibold text-[var(--viridian-800)]">02</span>
            <div>
              <h3 id="buyer-specific-title" className="font-display text-xl text-[var(--viridian-950)]">Specific requirements</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">A little more detail helps us identify relevant opportunities.</p>
            </div>
          </div>

          {values.propertyType === 'RESIDENTIAL' && <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Preferred bedrooms *</span>
              <select className={controlClass} value={values.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} required>
                <option value="">Select bedrooms</option>
                {buyerBedroomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Property condition *</span>
              <select className={controlClass} value={values.propertyCondition} onChange={(event) => update('propertyCondition', event.target.value)} required>
                <option value="">Select a preference</option>
                {buyerConditionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>}

          {values.propertyType === 'COMMERCIAL' && <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Intended use *</span>
              <select className={controlClass} value={values.intendedUse} onChange={(event) => update('intendedUse', event.target.value)} required>
                <option value="">Select intended use</option>
                {buyerCommercialUseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            {values.intendedUse === 'Other' && <label>
              <span className={labelClass}>Please specify intended use *</span>
              <input className={controlClass} value={values.otherIntendedUse} onChange={(event) => update('otherIntendedUse', event.target.value)} required maxLength={120} placeholder="Describe the intended use" />
            </label>}
            <label>
              <span className={labelClass}>Ready-to-use preference *</span>
              <select className={controlClass} value={values.readiness} onChange={(event) => update('readiness', event.target.value)} required>
                <option value="">Select a preference</option>
                {buyerReadinessOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>}

          {values.propertyType === 'LAND_PLOT' && <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Intended use *</span>
              <select className={controlClass} value={values.intendedUse} onChange={(event) => update('intendedUse', event.target.value)} required>
                <option value="">Select intended use</option>
                {buyerLandUseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            {values.intendedUse === 'Other' && <label>
              <span className={labelClass}>Please specify intended use *</span>
              <input className={controlClass} value={values.otherIntendedUse} onChange={(event) => update('otherIntendedUse', event.target.value)} required maxLength={120} placeholder="Describe the intended use" />
            </label>}
          </div>}

          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>{areaLabel} {areaRequired ? <span aria-hidden="true">*</span> : <span className="font-normal text-[var(--muted)]">(optional)</span>}</span>
              <input className={controlClass} type="number" inputMode="decimal" min="0.01" step="0.01" value={values.preferredArea} onChange={(event) => update('preferredArea', event.target.value)} required={areaRequired} placeholder="Enter an area" />
            </label>
            <label>
              <span className={labelClass}>Area unit{areaRequired ? ' *' : ''}</span>
              <select className={controlClass} value={values.areaUnit} onChange={(event) => update('areaUnit', event.target.value)} required={areaRequired || Boolean(values.preferredArea)}>
                {buyerAreaUnits.map((unit) => <option key={unit} value={unit}>{buyerAreaUnitLabel(unit)}</option>)}
              </select>
            </label>
          </div>

          {values.propertyType === 'OTHER' && <p className="rounded-xl border border-[var(--gold)]/35 bg-[var(--gold)]/5 px-4 py-3 text-sm leading-6 text-[var(--muted)]">Use the additional requirements field to share any further details about this property.</p>}
        </section>

        <section aria-labelledby="buyer-contact-title" className="space-y-5 border-t border-[var(--viridian-950)]/10 pt-7">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/60 text-xs font-semibold text-[var(--viridian-800)]">03</span>
            <div>
              <h3 id="buyer-contact-title" className="font-display text-xl text-[var(--viridian-950)]">How can we reach you?</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Share your contact details so our team can follow up.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Full name *</span>
              <input className={controlClass} autoComplete="name" value={values.name} onChange={(event) => update('name', event.target.value)} required minLength={2} maxLength={150} placeholder="Your full name" />
            </label>
            <label>
              <span className={labelClass}>Email address *</span>
              <input className={controlClass} type="email" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} required maxLength={320} placeholder="you@example.com" />
            </label>
            <label>
              <span className={labelClass}>Phone / WhatsApp number *</span>
              <input className={controlClass} type="tel" autoComplete="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} required minLength={6} maxLength={32} placeholder="Your contact number" />
            </label>
            <label>
              <span className={labelClass}>Preferred contact method *</span>
              <select className={controlClass} value={values.preferredContactMethod} onChange={(event) => update('preferredContactMethod', event.target.value)} required>
                {buyerContactMethods.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Additional requirements <span className="font-normal text-[var(--muted)]">(optional)</span></span>
            <textarea className={controlClass} rows={4} maxLength={5000} value={values.additionalRequirements} onChange={(event) => update('additionalRequirements', event.target.value)} placeholder="Anything else you would like us to know?" />
          </label>
        </section>

        <TurnstileWidget ref={turnstileRef} action="buyer_requirements" />
        <div className="border-t border-[var(--viridian-950)]/10 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={status === 'submitting'} className="touch-press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--viridian-950)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(6,47,41,0.16)] transition-[background-color,transform,box-shadow] hover:bg-[var(--viridian-800)] hover:shadow-[0_10px_25px_rgba(6,47,41,0.2)] disabled:cursor-not-allowed disabled:opacity-70">
              {status === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <>Submit Property Requirement<ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="max-w-sm text-xs leading-5 text-[var(--muted)]">Your details will be used by JLUXE to follow up about your property requirements.</p>
          </div>
          {status === 'success' && <div role="status" aria-live="polite" className="mt-5 flex items-start gap-2 rounded-xl border border-[var(--gold)]/40 bg-white px-4 py-3 text-sm text-[var(--viridian-950)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--viridian-800)]" />Your property requirements have been submitted successfully. Our team will follow up with you.</div>}
          {status === 'error' && <p role="alert" className="mt-5 rounded-xl border border-red-600/20 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </div>
  );
}
