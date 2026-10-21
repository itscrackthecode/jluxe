'use client';

import Link from 'next/link';
import { ArrowRight, House, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import JluxeCtaLink from '@/components/jluxe-cta-link';
import { getMediaImageUrl } from '@/lib/media';
import { services } from '@/lib/data';

const realEstateService = services.find((service) => service.title === 'Real Estate');

type FeaturedProject = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  priceAmount: string | null;
  priceCurrency: string | null;
  priceMode: 'EXACT' | 'STARTING_FROM' | 'ON_REQUEST' | 'EARLY_BIRD';
  priceBasis?: 'TOTAL_PRICE' | 'PER_SQFT' | 'PER_CENT' | 'OTHER';
  customPriceBasis?: string | null;
  coverImage?: { storageKey: string; deliveryUrl?: string | null; altText: string | null } | null;
};

type FeaturedProjectsResponse = {
  success: boolean;
  data: FeaturedProject[];
};

function formatPrice(project: FeaturedProject) {
  if (!project.priceAmount) return project.priceMode === 'ON_REQUEST' ? 'Price on request' : null;

  const amount = Number(project.priceAmount);
  if (!Number.isFinite(amount)) return null;

  let formattedAmount = new Intl.NumberFormat('en-IN').format(amount);
  if (project.priceCurrency) {
    try {
      formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: project.priceCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      formattedAmount = `${formattedAmount} ${project.priceCurrency}`;
    }
  }

  const basis = project.priceBasis === 'PER_SQFT' ? ' per sq. ft.'
    : project.priceBasis === 'PER_CENT' ? ' per cent'
      : project.priceBasis === 'OTHER' && project.customPriceBasis ? ` per ${project.customPriceBasis}` : '';
  const prefix = project.priceMode === 'STARTING_FROM' ? 'From '
    : project.priceMode === 'EARLY_BIRD' ? 'Early Bird ' : '';
  return `${prefix}${formattedAmount}${basis}`;
}

function ProjectCard({ project }: { project: FeaturedProject }) {
  const image = project.coverImage?.deliveryUrl
    ?? getMediaImageUrl(project.coverImage?.storageKey, 'property');
  const price = formatPrice(project) ?? 'Contact us for pricing';

  return (
    <article data-reveal className="featured-project-card premium-card group min-w-0 overflow-hidden rounded-lg border border-white/15 bg-white/[0.04]">
      <div className="featured-project-image relative aspect-[5/4] overflow-hidden bg-[var(--viridian-900)]">
        <img
          src={image}
          alt={project.coverImage?.altText || project.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getMediaImageUrl(null, 'property');
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--viridian-950)] via-[var(--viridian-950)]/15 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
          <h3 className="line-clamp-2 break-words font-display text-xl leading-tight text-white sm:text-2xl">{project.title}</h3>
          <div className="featured-project-hover-details mt-2 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none">
            <p className="flex items-start gap-2 text-sm leading-5 text-white/80">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
              <span className="line-clamp-1 break-all">{project.location || 'Location details available on enquiry'}</span>
            </p>
            <p className="mt-1.5 line-clamp-1 break-words text-base font-semibold text-[var(--gold)]">{price}</p>
            <Link href={`/properties/${project.slug}`} className="touch-press mt-2 inline-flex min-h-9 items-center gap-2 border-b border-[var(--gold)]/70 pb-1 text-sm font-semibold text-white transition-colors hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
              See more <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="featured-project-mobile-details p-4">
        <p className="flex items-start gap-2 text-sm leading-5 text-white/70">
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
          <span>{project.location || 'Location details available on enquiry'}</span>
        </p>
        <p className="mt-2 text-base font-semibold text-[var(--gold)]">{price}</p>
        <Link href={`/properties/${project.slug}`} className="touch-press mt-3 inline-flex min-h-10 items-center gap-2 border-b border-[var(--gold)]/70 pb-1 text-sm font-semibold text-white transition-colors hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
          See more <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/properties?status=AVAILABLE&sort=latest&limit=4&page=1', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load featured projects.');
        const result = await response.json() as FeaturedProjectsResponse;
        if (!result.success) throw new Error('Unable to load featured projects.');
        setProjects(result.data.slice(0, 4));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setProjects([]);
        setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="overflow-hidden bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-10 bg-[var(--gold)]/60" />
              <p className="text-xs font-bold tracking-[.25em] text-[var(--gold)]">REAL ESTATE · BUYING OPPORTUNITIES</p>
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Featured Projects @ JLuxe</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/65 sm:text-base">
            Explore a handpicked selection of available properties and find a place that feels like your next move.
          </p>
        </div>

        <div className="mt-9 grid gap-7 lg:mt-12 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)] lg:items-start lg:gap-9">
          {realEstateService && (
            <a href={realEstateService.href} data-reveal className="premium-card group relative overflow-hidden rounded-[28px] border border-white/10 bg-[var(--viridian-950)] p-7 text-white shadow-[0_20px_40px_rgba(6,47,41,0.12)] lg:self-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(197,164,109,0.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.05),transparent_35%)]" />
              <div className="absolute -right-12 top-6 h-24 w-24 rounded-full bg-[var(--gold)]/10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs tracking-[.2em] text-[var(--gold)]"></span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-inner shadow-white/5">
                    <House aria-hidden="true" className="h-5 w-5 text-[var(--gold)] transition-transform duration-300 group-hover:scale-105" strokeWidth={1.6} />
                  </div>
                </div>
                <div className="mt-24">
                  <h3 className="font-display text-3xl leading-none">{realEstateService.title}</h3>
                  <p className="mt-3 min-h-14 line-clamp-3 text-sm leading-6 text-white/70">{realEstateService.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Explore <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </a>
          )}

          <div className="min-w-0">
            {loaded && projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2" data-reveal-stagger>
                {projects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            ) : loaded ? (
              <p role={loadError ? 'status' : undefined} className="flex min-h-40 items-center border-y border-white/15 py-6 text-sm leading-6 text-white/70">
                {loadError ? 'Featured property listings are temporarily unavailable. Explore all properties to see current opportunities.' : 'No featured properties are available right now. Explore all properties to see current opportunities.'}
              </p>
            ) : (
              <div role="status" aria-label="Loading featured projects" className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => <div key={index} aria-hidden="true" className="aspect-[5/4] animate-pulse rounded-lg border border-white/10 bg-white/[0.06] motion-reduce:animate-none" />)}
              </div>
            )}

            <div className="mt-7 flex justify-center">
              <JluxeCtaLink href="/properties">Want to Explore more...?</JluxeCtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
