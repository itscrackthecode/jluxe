'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isConfiguredContact, siteConfig } from '@/lib/data';
import PropertyImageGallery from '@/components/property-image-gallery';
import PropertyEnquiryForm from '@/components/property-enquiry-form';
import MarkdownContent from '@/components/markdown-content';

type PropertyImage = {
  id: string;
  storageKey: string;
  deliveryUrl?: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  position: number;
  altText: string | null;
};

type ApiConfiguration = {
  id: string;
  position: number;
  optionName: string | null;
  areaValue: string | null;
  areaUnit: string | null;
  customAreaUnit: string | null;
  areaBasis: string | null;
  customAreaBasis: string | null;
  dimensionLength: string | null;
  dimensionWidth: string | null;
  notesMarkdown: string | null;
  plotNumber?: string | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  floorNumber?: string | null;
  carpetArea?: string | null;
  superBuiltUpArea?: string | null;
  roomConfiguration?: Array<{ name: string | null; count: number | null }>;
};
type ApiLayoutPlan = { id: string; fileName: string; mimeType: string; byteSize: number; url: string };

type ApiProperty = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortSummary: string | null;
  location: string | null;
  propertyType: string;
  propertyTypeOther: string | null;
  propertySubtype: string | null;
  propertySubtypeOther: string | null;
  mapLocation: string | null;
  latitude: string | null;
  longitude: string | null;
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  priceBasis?: 'TOTAL_PRICE' | 'PER_SQFT' | 'PER_CENT' | 'OTHER';
  customPriceBasis?: string | null;
  additionalCharges?: Array<{ label: string; amount: string }>;
  offerDetails?: string | null;
  configurations?: ApiConfiguration[];
  roadAccess?: string | null;
  proximityMarkdown?: string | null;
  landApprovedFor?: string | null;
  statutoryApprovals?: string[];
  otherStatutoryApprovals?: string | null;
  approvalReference?: string | null;
  approvalAuthority?: string | null;
  projectPhase?: number | null;
  constructionStatus?: string | null;
  handoverDate?: string | null;
  waterSources?: string[];
  otherWaterSource?: string | null;
  electricitySources?: string[];
  otherElectricitySource?: string | null;
  drainageOptions?: string[];
  otherDrainageOption?: string | null;
  layoutPlans?: ApiLayoutPlan[];
  furnishingStatus?: string | null;
  furnishingStatusOther?: string | null;
  amenitiesMarkdown?: string | null;
  facingDirection?: string | null;
  facingOther?: string | null;
  sunlightOrientation?: string | null;
  neighborhoodType?: string | null;
  neighborhoodTypeOther?: string | null;
  floorCount?: number | null;
  publicComplianceSummary?: string | null;
  commercialUse?: string | null;
  commercialUseOther?: string | null;
  yearBuilt?: number | null;
  recentUpgradesMarkdown?: string | null;
  transactionType?: string | null;
  leaseStructureMarkdown?: string | null;
  occupancyStatus?: string | null;
  leaseExpiryDate?: string | null;
  tenantProfileMarkdown?: string | null;
  plotSize: string | null;
  plotSizeUnit: string | null;
  status: string;
  availabilityOther?: string | null;
  enquiryEnabled?: boolean;
  representationType: 'CHANNEL_PARTNER' | 'AUTHORIZED_REPRESENTATIVE' | 'OTHER';
  createdAt: string;
  images: PropertyImage[];
};

function formatLabel(value: string) {
  if (value === 'LAND_PLOT') return 'Land / Plot';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function propertyTypeLabel(property: ApiProperty) {
  const category = property.propertyType === 'OTHER' && property.propertyTypeOther
    ? property.propertyTypeOther
    : formatLabel(property.propertyType);
  const subtype = property.propertySubtype === 'Other' && property.propertySubtypeOther
    ? property.propertySubtypeOther
    : property.propertySubtype;
  return subtype ? `${category} · ${subtype}` : category;
}

const projectPhaseLabels = [
  '',
  'Initiation & Conception',
  'Planning & Design',
  'Pre-Construction',
  'Procurement',
  'Construction',
  'Post-Construction / Closeout',
];

const landLabel = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function getPrice(property: ApiProperty) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : null;

  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return null;

  let formatted = new Intl.NumberFormat('en-IN').format(amount);
  if (property.priceCurrency) {
    try {
      formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: property.priceCurrency,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      formatted = `${formatted} ${property.priceCurrency}`;
    }
  }

  const basis = property.priceBasis === 'PER_SQFT' ? ' per sq. ft.'
    : property.priceBasis === 'PER_CENT' ? ' per cent'
      : property.priceBasis === 'OTHER' && property.customPriceBasis ? ` per ${property.customPriceBasis}` : '';
  return `${property.priceMode === 'STARTING_FROM' ? 'From ' : ''}${formatted}${basis}`;
}

function getWhatsAppPrice(property: ApiProperty) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'price on request' : null;
  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return null;
  const formattedAmount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount);
  const prefix = property.priceMode === 'STARTING_FROM' ? 'starting from ' : '';
  const basis = property.priceBasis === 'PER_SQFT' ? ' per sq. ft.'
    : property.priceBasis === 'PER_CENT' ? ' per cent'
      : property.priceBasis === 'OTHER' && property.customPriceBasis ? ` per ${property.customPriceBasis}` : '';
  return `${prefix}Rs. ${formattedAmount}${basis}`;
}

function getPlotSize(property: ApiProperty) {
  if (!property.plotSize) return null;

  const units: Record<string, string> = { SQFT: 'sq ft', SQM: 'sq m', ACRE: 'acre', HECTARE: 'hectare' };
  const amount = new Intl.NumberFormat().format(Number(property.plotSize));
  return property.plotSizeUnit ? `${amount} ${units[property.plotSizeUnit] ?? property.plotSizeUnit}` : amount;
}

function formatConfigurationNumber(value: string | null) {
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(numeric) : null;
}

function configurationUnit(configuration: ApiConfiguration) {
  if (configuration.areaUnit === 'OTHER') return configuration.customAreaUnit || 'Other unit';
  return ({ SQ_FT: 'sq. ft.', SQ_M: 'sq. m.', CENT: 'cent', ACRE: 'acre' } as Record<string, string>)[configuration.areaUnit ?? ''] ?? null;
}

function configurationBasis(configuration: ApiConfiguration) {
  if (configuration.areaBasis === 'OTHER') return configuration.customAreaBasis || 'Other area basis';
  return ({ PLOT_AREA: 'Plot area', BUILT_UP_AREA: 'Built-up area', CARPET_AREA: 'Carpet area' } as Record<string, string>)[configuration.areaBasis ?? ''] ?? null;
}

function representationCopy(type: ApiProperty['representationType']) {
  if (type === 'CHANNEL_PARTNER') {
    return 'JLUXE may represent this opportunity as a channel partner; ownership remains with the relevant property owner or partner.';
  }
  if (type === 'AUTHORIZED_REPRESENTATIVE') {
    return 'JLUXE may represent this opportunity as an authorized representative; ownership remains with the relevant property owner or partner.';
  }
  return 'This opportunity is presented by JLUXE. Contact us for details about its representation.';
}

export default function PropertyDetail({ slug }: { slug: string }) {
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperty() {
      setLoading(true);
      setNotFound(false);
      setError(false);

      try {
        const response = await fetch(`/api/properties/${encodeURIComponent(slug)}`, { signal: controller.signal });
        const result = await response.json();

        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok || result.success !== true) throw new Error('Unable to load property.');

        setProperty(result.data as ApiProperty);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProperty();
    return () => controller.abort();
  }, [requestVersion, slug]);

  if (loading) {
    return <p role="status" className="container-xl py-16 text-sm text-[var(--muted)]">Loading property...</p>;
  }

  if (notFound) {
    return (
      <section className="py-16 sm:py-20">
        <div className="container-xl border-y border-[var(--viridian-950)]/15 py-10">
          <h1 className="font-display text-3xl text-[var(--viridian-950)]">Property not found</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">This property opportunity may no longer be available.</p>
          <Link href="/properties" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
            <ArrowLeft className="h-4 w-4" /> Property opportunities
          </Link>
        </div>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section role="alert" className="py-16 sm:py-20">
        <div className="container-xl border-y border-[var(--viridian-950)]/15 py-10">
          <h1 className="font-display text-3xl text-[var(--viridian-950)]">Property unavailable</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">We couldn’t load this property right now. Please try again.</p>
          <button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      </section>
    );
  }

  const price = getPrice(property);
  const plotSize = getPlotSize(property);
  const canEnquire = property.enquiryEnabled !== false
    && !['SOLD', 'LEASED', 'WITHDRAWN'].includes(property.status);
  const hasWhatsApp = isConfiguredContact(siteConfig.contact.whatsapp);
  const propertyWhatsAppPrice = getWhatsAppPrice(property);
  const propertyPublicUrl = `${siteConfig.url}/properties/${encodeURIComponent(property.slug)}`;
  const propertyWhatsAppMessage = [
    'Hello JLUXE Team!',
    '',
    "I'm interested in the following property listed on your website.",
    '',
    `Property: ${property.title}`,
    ...(property.location ? [`Location: ${property.location}`] : []),
    ...(propertyWhatsAppPrice ? [`Price: ${propertyWhatsAppPrice}`] : []),
    `Property Link: ${propertyPublicUrl}`,
    '',
    'I would like to know more about its availability, plot details, pricing, and site visit options.',
    '',
    'Could you please share more information?',
    '',
    'Thank you!',
  ].join('\n');
  const propertyWhatsAppHref = `${siteConfig.contact.whatsapp}?text=${encodeURIComponent(propertyWhatsAppMessage)}`;

  return (
    <>
      <header className="bg-[var(--viridian-950)] py-6 text-white sm:py-8">
        <div className="container-xl">
          <Link href="/properties" className="touch-press inline-flex min-h-10 items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Property opportunities
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY OPPORTUNITY</p>
              <h1 className="mt-2 max-w-4xl font-display text-2xl leading-tight sm:text-3xl lg:text-4xl">{property.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                {property.location && <span>{property.location}</span>}
                <span>{propertyTypeLabel(property)}</span>
              </div>
            </div>
            <p className="w-fit border border-white/20 px-2.5 py-1.5 text-xs text-white/80">{formatLabel(property.status)}</p>
          </div>
        </div>
      </header>

      <section className="py-5 sm:py-7" data-reveal>
        <div className="container-xl">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:gap-8">
            <section aria-label="Property images" className="min-w-0">
              <PropertyImageGallery images={property.images} />
            </section>

            <aside className="min-w-0 border border-[var(--viridian-950)]/12 bg-white p-4 sm:p-5">
              <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--viridian-800)]">PROPERTY FACTS</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                <div><dt className="text-[11px] text-[var(--muted)]">Property type</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{propertyTypeLabel(property)}</dd></div>
                <div><dt className="text-[11px] text-[var(--muted)]">Status</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.status === 'OTHER' ? property.availabilityOther || 'Other' : formatLabel(property.status)}</dd></div>
                {plotSize && <div><dt className="text-[11px] text-[var(--muted)]">Plot size</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{plotSize}</dd></div>}
                <div className="col-span-2 border-t border-[var(--viridian-950)]/10 pt-3"><dt className="text-[11px] text-[var(--muted)]">Representation</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.representationType)}</dd></div>
              </dl>

              <div className="mt-5 border-t border-[var(--viridian-950)]/10 pt-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)]">PRICE</p>
                <p className="mt-1 font-display text-2xl leading-tight text-[var(--viridian-950)]">{price ?? 'Contact for details'}</p>
                {canEnquire && <a href="#property-enquiry" className="touch-press mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--viridian-950)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
                  Enquire About This Property <ArrowRight className="h-4 w-4" />
                </a>}
                {canEnquire && hasWhatsApp && <a href={propertyWhatsAppHref} target="_blank" rel="noreferrer" className="touch-press mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              </div>
              {property.additionalCharges?.length ? <div className="mt-4 border-t border-[var(--viridian-950)]/10 pt-4">
                <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)]">ADDITIONAL CHARGES</h3>
                <dl className="mt-2 space-y-2">{property.additionalCharges.map((charge, index) => <div key={`${charge.label}-${index}`} className="flex justify-between gap-3 text-sm"><dt className="text-[var(--muted)]">{charge.label}</dt><dd className="shrink-0 font-medium text-[var(--viridian-950)]">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(charge.amount))}</dd></div>)}</dl>
              </div> : null}
              {property.offerDetails && <div className="mt-4 border-t border-[var(--viridian-950)]/10 pt-4"><h3 className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)]">OFFER DETAILS</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--viridian-950)]">{property.offerDetails}</p></div>}
            </aside>
          </div>

          {(property.shortSummary || property.description || property.mapLocation || property.latitude || property.longitude) && <section className="mt-7 max-w-4xl border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            {property.shortSummary && <div className="mb-6 text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7"><MarkdownContent value={property.shortSummary} /></div>}
            {property.description && <>
              <h2 className="font-display text-2xl text-[var(--viridian-950)]">Property description</h2>
              <div className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7"><MarkdownContent value={property.description} /></div>
            </>}
            {(property.mapLocation || property.latitude || property.longitude) && <div className="mt-5 border-t border-[var(--viridian-950)]/10 pt-4">
              <h3 className="text-sm font-semibold text-[var(--viridian-950)]">Map location</h3>
              {property.mapLocation && /^https?:\/\//i.test(property.mapLocation) ? <a href={property.mapLocation} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-10 items-center text-sm font-medium text-[var(--viridian-800)] underline underline-offset-4 hover:text-[var(--gold)]">Open map location</a> : property.mapLocation && <p className="mt-1 text-sm text-[var(--muted)]">{property.mapLocation}</p>}
              {(property.latitude || property.longitude) && <p className="mt-1 text-xs text-[var(--muted)]">Coordinates: {[property.latitude, property.longitude].filter(Boolean).join(', ')}</p>}
            </div>}
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{representationCopy(property.representationType)}</p>
          </section>}
          {property.configurations && property.configurations.length > 0 && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">AVAILABLE OPTIONS</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Areas and configurations</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">{property.configurations.map((configuration, index) => {
              const area = formatConfigurationNumber(configuration.areaValue);
              const length = formatConfigurationNumber(configuration.dimensionLength);
              const width = formatConfigurationNumber(configuration.dimensionWidth);
              const unit = configurationUnit(configuration);
              const basis = configurationBasis(configuration);
              const houseConfiguration = property.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(property.propertySubtype ?? '');
              return <article key={configuration.id} className="min-w-0 border border-[var(--viridian-950)]/12 bg-white p-4 sm:p-5">
                <h3 className="font-display text-xl text-[var(--viridian-950)]">{configuration.optionName || `Option ${index + 1}`}</h3>
                {(area || unit || basis || length || width || configuration.plotNumber || configuration.bedroomCount != null || configuration.bathroomCount != null || configuration.floorNumber || configuration.carpetArea || configuration.superBuiltUpArea) && <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {configuration.plotNumber && <div><dt className="text-[11px] text-[var(--muted)]">Plot number</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{configuration.plotNumber}</dd></div>}
                  {configuration.bedroomCount != null && <div><dt className="text-[11px] text-[var(--muted)]">Bedrooms</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{configuration.bedroomCount}</dd></div>}
                  {configuration.bathroomCount != null && <div><dt className="text-[11px] text-[var(--muted)]">Bathrooms</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{configuration.bathroomCount}</dd></div>}
                  {configuration.floorNumber && <div><dt className="text-[11px] text-[var(--muted)]">Floor</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{configuration.floorNumber}</dd></div>}
                  {area && <div><dt className="text-[11px] text-[var(--muted)]">{houseConfiguration ? 'Built-up area' : 'Area'}</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{area}{unit ? ` ${unit}` : ''}</dd></div>}
                  {basis && !houseConfiguration && <div><dt className="text-[11px] text-[var(--muted)]">Area basis</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{basis}</dd></div>}
                  {configuration.carpetArea && <div><dt className="text-[11px] text-[var(--muted)]">Carpet area</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{formatConfigurationNumber(configuration.carpetArea)}{unit ? ` ${unit}` : ''}</dd></div>}
                  {configuration.superBuiltUpArea && <div><dt className="text-[11px] text-[var(--muted)]">Super built-up area</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{formatConfigurationNumber(configuration.superBuiltUpArea)}{unit ? ` ${unit}` : ''}</dd></div>}
                  {length && <div><dt className="text-[11px] text-[var(--muted)]">Length</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{length}</dd></div>}
                  {width && <div><dt className="text-[11px] text-[var(--muted)]">Width</dt><dd className="mt-1 font-medium text-[var(--viridian-950)]">{width}</dd></div>}
                </dl>}
                {configuration.roomConfiguration?.some((room) => room.name && room.count != null) ? <div className="mt-3 border-t border-[var(--viridian-950)]/10 pt-3"><h4 className="text-[11px] text-[var(--muted)]">Room configuration</h4><ul className="mt-1 space-y-1 text-sm text-[var(--viridian-950)]">{configuration.roomConfiguration.map((room, roomIndex) => room.name && room.count != null ? <li key={`${room.name}-${roomIndex}`}>{room.name}: {room.count}</li> : null)}</ul></div> : null}
                {configuration.notesMarkdown && <div className="mt-4 border-t border-[var(--viridian-950)]/10 pt-3 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={configuration.notesMarkdown} /></div>}
              </article>;
            })}</div>
          </section>}
          {property.propertyType === 'RESIDENTIAL' && property.propertySubtype === 'Apartment' && (property.furnishingStatus || property.proximityMarkdown) && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">APARTMENT DETAILS</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Apartment information</h2>
            {property.furnishingStatus && <p className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4 text-sm"><span className="text-[var(--muted)]">Furnishing status: </span><span className="font-medium text-[var(--viridian-950)]">{property.furnishingStatus === 'OTHER' ? property.furnishingStatusOther || 'Other' : landLabel(property.furnishingStatus)}</span></p>}
            {property.proximityMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Proximity to key landmarks</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.proximityMarkdown} /></div></div>}
          </section>}
          {property.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(property.propertySubtype ?? '') && (property.facingDirection || property.sunlightOrientation || property.neighborhoodType || property.floorCount != null || property.publicComplianceSummary || property.proximityMarkdown) && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">HOME DETAILS</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Villa and independent-house information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {property.facingDirection && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Facing direction</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.facingDirection === 'OTHER' ? property.facingOther || 'Other' : landLabel(property.facingDirection)}</dd></div>}
              {property.sunlightOrientation && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Sunlight orientation</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.sunlightOrientation}</dd></div>}
              {property.neighborhoodType && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Neighborhood</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.neighborhoodType === 'OTHER' ? property.neighborhoodTypeOther || 'Other' : landLabel(property.neighborhoodType)}</dd></div>}
              {property.floorCount != null && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Number of floors</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.floorCount}</dd></div>}
            </dl>
            {property.publicComplianceSummary && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Approval details</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{property.publicComplianceSummary}</p></div>}
            {property.proximityMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Proximity to key landmarks</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.proximityMarkdown} /></div></div>}
          </section>}
          {property.propertyType === 'COMMERCIAL' && (property.commercialUse || property.yearBuilt != null || property.transactionType || property.leaseStructureMarkdown || property.occupancyStatus || property.leaseExpiryDate || property.tenantProfileMarkdown || property.recentUpgradesMarkdown || property.proximityMarkdown) && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">COMMERCIAL DETAILS</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Commercial property information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {property.commercialUse && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Commercial use</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.commercialUse === 'OTHER' ? property.commercialUseOther || 'Other' : formatLabel(property.commercialUse)}</dd></div>}
              {property.transactionType && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Available for</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.transactionType)}</dd></div>}
              {property.yearBuilt != null && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Year built</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.yearBuilt}</dd></div>}
              {property.occupancyStatus && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Occupancy</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.occupancyStatus)}</dd></div>}
              {property.leaseExpiryDate && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Lease expiry</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.leaseExpiryDate}</dd></div>}
            </dl>
            {property.leaseStructureMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Lease structure</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.leaseStructureMarkdown} /></div></div>}
            {property.tenantProfileMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Tenant and occupancy details</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.tenantProfileMarkdown} /></div></div>}
            {property.recentUpgradesMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Recent upgrades</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.recentUpgradesMarkdown} /></div></div>}
            {property.proximityMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Proximity to key landmarks</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.proximityMarkdown} /></div></div>}
          </section>}
          {(property.approvalReference || property.approvalAuthority || property.projectPhase != null || property.constructionStatus || property.handoverDate || property.amenitiesMarkdown) && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">APPROVALS &amp; PROJECT DETAILS</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Project information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {property.approvalReference && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Approval / registration number</dt><dd className="mt-1 break-words text-sm font-medium text-[var(--viridian-950)]">{property.approvalReference}</dd></div>}
              {property.approvalAuthority && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Approving authority</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.approvalAuthority}</dd></div>}
              {property.projectPhase != null && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Current project phase</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.projectPhase} · {projectPhaseLabels[property.projectPhase] ?? ''}</dd></div>}
              {property.constructionStatus && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Construction / development status</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.constructionStatus}</dd></div>}
              {property.handoverDate && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Expected handover</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date(`${property.handoverDate}T00:00:00`))}</dd></div>}
            </dl>
            {property.amenitiesMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Amenities and facilities</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.amenitiesMarkdown} /></div></div>}
          </section>}
          {['LAND_PLOT', 'PLOT', 'LAND'].includes(property.propertyType) && (property.roadAccess || property.landApprovedFor || property.statutoryApprovals?.length || property.waterSources?.length || property.electricitySources?.length || property.drainageOptions?.length || property.proximityMarkdown || property.layoutPlans?.length) && <section className="mt-7 border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--gold)]">PLOT &amp; LAND INFORMATION</p>
            <h2 className="mt-1 font-display text-2xl text-[var(--viridian-950)]">Land details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {property.roadAccess && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Road access</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.roadAccess}</dd></div>}
              {property.landApprovedFor && <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Land approved for</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{landLabel(property.landApprovedFor)}</dd></div>}
              {property.statutoryApprovals?.length ? <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Statutory approvals</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.statutoryApprovals.map((item) => item === 'OTHER' ? property.otherStatutoryApprovals || 'Other' : item).join(', ')}</dd></div> : null}
              {property.waterSources?.length ? <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Water supply</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.waterSources.map((item) => item === 'OTHER' ? property.otherWaterSource || 'Other' : landLabel(item)).join(', ')}</dd></div> : null}
              {property.electricitySources?.length ? <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Electricity</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.electricitySources.map((item) => item === 'OTHER' ? property.otherElectricitySource || 'Other' : landLabel(item)).join(', ')}</dd></div> : null}
              {property.drainageOptions?.length ? <div className="border border-[var(--viridian-950)]/10 bg-white p-4"><dt className="text-xs text-[var(--muted)]">Drainage and sewage</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{property.drainageOptions.map((item) => item === 'OTHER' ? property.otherDrainageOption || 'Other' : landLabel(item)).join(', ')}</dd></div> : null}
            </dl>
            {property.proximityMarkdown && <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Proximity to key landmarks</h3><div className="mt-2 text-sm leading-6 text-[var(--muted)]"><MarkdownContent value={property.proximityMarkdown} /></div></div>}
            {property.layoutPlans?.length ? <div className="mt-4 border border-[var(--viridian-950)]/10 bg-white p-4"><h3 className="text-sm font-semibold text-[var(--viridian-950)]">Layout plans</h3><ul className="mt-2 space-y-2">{property.layoutPlans.map((file) => <li key={file.id}><a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--viridian-800)] underline underline-offset-4 hover:text-[var(--gold)]">{file.fileName} · {file.mimeType === 'application/pdf' ? 'PDF' : 'Image'}</a></li>)}</ul></div> : null}
          </section>}
        </div>
      </section>
      {canEnquire && <section id="property-enquiry" className="scroll-mt-24 border-t border-[var(--viridian-950)]/10 bg-[var(--cream)] py-10 sm:py-14" data-reveal>
        <div className="container-xl mx-auto max-w-4xl">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY ENQUIRY</p>
            <h2 className="mt-3 font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">Interested in this property?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Share a few details and the JLUXE team will follow up about this opportunity.</p>
          </div>
          <PropertyEnquiryForm key={property.id} property={property} />
        </div>
      </section>}
    </>
  );
}
