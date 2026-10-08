'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isConfiguredContact, siteConfig } from '@/lib/data';
import PropertyImageGallery from '@/components/property-image-gallery';

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

type ApiProperty = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  propertyType: string;
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST';
  plotSize: string | null;
  plotSizeUnit: string | null;
  status: string;
  representationType: 'CHANNEL_PARTNER' | 'AUTHORIZED_REPRESENTATIVE' | 'OTHER';
  createdAt: string;
  images: PropertyImage[];
};

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPrice(property: ApiProperty) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : null;

  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return null;

  let formatted = new Intl.NumberFormat().format(amount);
  if (property.priceCurrency) {
    try {
      formatted = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: property.priceCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      formatted = `${formatted} ${property.priceCurrency}`;
    }
  }

  return property.priceMode === 'STARTING_FROM' ? `From ${formatted}` : formatted;
}

function getPlotSize(property: ApiProperty) {
  if (!property.plotSize) return null;

  const units: Record<string, string> = { SQFT: 'sq ft', SQM: 'sq m', ACRE: 'acre', HECTARE: 'hectare' };
  const amount = new Intl.NumberFormat().format(Number(property.plotSize));
  return property.plotSizeUnit ? `${amount} ${units[property.plotSizeUnit] ?? property.plotSizeUnit}` : amount;
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
  const contactParams = new URLSearchParams({ interest: 'Real Estate', property: property.title });
  const contactHref = `${siteConfig.nav.contact}?${contactParams.toString()}`;
  const hasWhatsApp = isConfiguredContact(siteConfig.contact.whatsapp);

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
                <span>{formatLabel(property.propertyType)}</span>
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
                <div><dt className="text-[11px] text-[var(--muted)]">Property type</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.propertyType)}</dd></div>
                <div><dt className="text-[11px] text-[var(--muted)]">Status</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.status)}</dd></div>
                {plotSize && <div><dt className="text-[11px] text-[var(--muted)]">Plot size</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{plotSize}</dd></div>}
                <div className="col-span-2 border-t border-[var(--viridian-950)]/10 pt-3"><dt className="text-[11px] text-[var(--muted)]">Representation</dt><dd className="mt-1 text-sm font-medium text-[var(--viridian-950)]">{formatLabel(property.representationType)}</dd></div>
              </dl>

              <div className="mt-5 border-t border-[var(--viridian-950)]/10 pt-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)]">PRICE</p>
                <p className="mt-1 font-display text-2xl leading-tight text-[var(--viridian-950)]">{price ?? 'Contact for details'}</p>
                <Link href={contactHref} className="touch-press mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--viridian-950)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-950)]">
                  Enquire with JLUXE <ArrowRight className="h-4 w-4" />
                </Link>
                {hasWhatsApp && <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              </div>
            </aside>
          </div>

          {property.description && <section className="mt-7 max-w-4xl border-t border-[var(--viridian-950)]/15 pt-5 sm:mt-9 sm:pt-6">
            <h2 className="font-display text-2xl text-[var(--viridian-950)]">Property description</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">{property.description}</p>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{representationCopy(property.representationType)}</p>
          </section>}
        </div>
      </section>
    </>
  );
}
