import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { siteConfig } from '@/lib/data';
import { propertyListings } from '@/lib/properties';

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

async function findProperty(params: PropertyPageProps['params']) {
  const { slug } = await params;
  return propertyListings.find((property) => property.slug === slug);
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const property = await findProperty(params);

  return {
    title: property ? `${property.title} | JLUXE` : 'Property | JLUXE',
    description: property?.description ?? 'Property opportunities represented by JLUXE and its partners.',
  };
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  const property = await findProperty(params);
  if (!property) notFound();

  const contactParams = new URLSearchParams({
    interest: 'Real Estate',
    property: property.title,
  });
  const contactHref = `${siteConfig.nav.contact}?${contactParams.toString()}`;
  const hasWhatsApp = Boolean(siteConfig.contact.whatsapp) && !siteConfig.contact.whatsapp.includes('000000');

  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

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
            {property.status && <p className="w-fit border border-white/20 px-3 py-2 text-sm text-white/80">{property.status}</p>}
          </div>
        </div>
      </section>

      {property.images && property.images.length > 0 && (
        <section aria-label="Property images" className="bg-[var(--cream)] py-6 sm:py-8">
          <div className="container-xl grid gap-3 sm:grid-cols-2">
            {property.images.map((image, index) => (
              <div key={`${image.src}-${index}`} className={`relative aspect-[4/3] overflow-hidden bg-[var(--sand)] ${index === 0 && property.images && property.images.length > 2 ? 'sm:row-span-2 sm:aspect-auto' : ''}`}>
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16">
        <div className="container-xl grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            {property.description && (
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY DETAILS</p>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">{property.description}</p>
              </div>
            )}
            {(property.location || property.propertyType || property.price || property.plotSize) && (
              <dl className="mt-8 grid gap-5 border-t border-[var(--viridian-950)]/15 pt-6 sm:grid-cols-2">
                {property.location && <div><dt className="text-xs text-[var(--muted)]">Location</dt><dd className="mt-1 text-sm font-medium">{property.location}</dd></div>}
                {property.propertyType && <div><dt className="text-xs text-[var(--muted)]">Property type</dt><dd className="mt-1 text-sm font-medium">{property.propertyType}</dd></div>}
                {property.price && <div><dt className="text-xs text-[var(--muted)]">Price</dt><dd className="mt-1 text-sm font-medium">{property.price}</dd></div>}
                {property.plotSize && <div><dt className="text-xs text-[var(--muted)]">Plot size</dt><dd className="mt-1 text-sm font-medium">{property.plotSize}</dd></div>}
              </dl>
            )}
            <p className="mt-6 max-w-2xl text-xs leading-5 text-[var(--muted)]">
              JLUXE may represent this opportunity as a channel partner; ownership remains with the relevant property owner or partner.
            </p>
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

      <SiteFooter />
    </main>
  );
}