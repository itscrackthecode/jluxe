'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/data';
import { getMediaImageUrl } from '@/lib/media';

type PropertyImage = {
  id: string;
  storageKey: string;
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
  const hasWhatsApp = Boolean(siteConfig.contact.whatsapp) && !siteConfig.contact.whatsapp.includes('000000');

  return (
    <>
      <section className="bg-[var(--viridian-950)] py-14 text-white sm:py-18">
        <div className="container-xl">
          <Link href="/properties" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Property opportunities
          </Link>
          <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">PROPERTY OPPORTUNITY</p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">{property.title}</h1>
            </div>
            <p className="w-fit border border-white/20 px-3 py-2 text-sm text-white/80">{formatLabel(property.status)}</p>
          </div>
        </div>
      </section>

      <section aria-label="Property images" className="bg-[var(--cream)] py-6 sm:py-8">
        <div className="container-xl grid gap-3 sm:grid-cols-2">
          {property.images.length > 0 ? property.images.map((image) => (
            <div key={image.id} className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] px-4 text-center text-sm text-[var(--muted)]">
              <img src={getMediaImageUrl(image.storageKey, 'property')} alt={image.altText ?? 'JLUXE property'} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getMediaImageUrl(null, 'property'); }} />
            </div>
          )) : (
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] text-sm text-[var(--muted)]">
              <img src={getMediaImageUrl(null, 'property')} alt="JLUXE property placeholder" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-xl grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            {property.description && (
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY DETAILS</p>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">{property.description}</p>
              </div>
            )}
            {(property.location || property.propertyType || price || plotSize) && (
              <dl className="mt-8 grid gap-5 border-t border-[var(--viridian-950)]/15 pt-6 sm:grid-cols-2">
                {property.location && <div><dt className="text-xs text-[var(--muted)]">Location</dt><dd className="mt-1 text-sm font-medium">{property.location}</dd></div>}
                {property.propertyType && <div><dt className="text-xs text-[var(--muted)]">Property type</dt><dd className="mt-1 text-sm font-medium">{formatLabel(property.propertyType)}</dd></div>}
                {price && <div><dt className="text-xs text-[var(--muted)]">Price</dt><dd className="mt-1 text-sm font-medium">{price}</dd></div>}
                {plotSize && <div><dt className="text-xs text-[var(--muted)]">Plot size</dt><dd className="mt-1 text-sm font-medium">{plotSize}</dd></div>}
              </dl>
            )}
            <p className="mt-6 max-w-2xl text-xs leading-5 text-[var(--muted)]">{representationCopy(property.representationType)}</p>
          </div>

          <aside className="h-fit border-t border-[var(--viridian-950)]/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">ENQUIRY</p>
            <h2 className="mt-3 font-display text-3xl">Interested in this property?</h2>
            <Link href={contactHref} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Contact JLUXE <ArrowRight className="h-4 w-4" />
            </Link>
            {hasWhatsApp && (
              <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}