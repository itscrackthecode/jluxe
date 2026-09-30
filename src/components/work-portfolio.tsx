'use client';

import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/data';

const pageSize = 12;

type PortfolioService = { id: string; slug: string; title: string };
type PortfolioMedia = {
  id: string;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  position: number;
  altText: string | null;
};
type PortfolioItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string | null;
  year: number | null;
  featured: boolean;
  createdAt: string;
  service: PortfolioService;
  media: PortfolioMedia[];
};

export default function WorkPortfolio() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [services, setServices] = useState<PortfolioService[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort: 'latest' });
    if (activeService) params.set('service', activeService);

    setLoading(true);
    setError(false);

    async function loadWork() {
      try {
        const response = await fetch(`/api/portfolio?${params.toString()}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('Unable to load portfolio work.');

        const nextItems = result.data as PortfolioItem[];
        setItems(nextItems);
        setTotalPages(result.pagination.totalPages as number);
        setServices((current) => {
          const known = new Map(current.map((service) => [service.slug, service]));
          nextItems.forEach((item) => known.set(item.service.slug, item.service));
          return [...known.values()].sort((first, second) => first.title.localeCompare(second.title));
        });
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
          setItems([]);
          setTotalPages(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadWork();
    return () => controller.abort();
  }, [activeService, page, requestVersion]);

  const resetService = () => {
    setActiveService(null);
    setPage(1);
  };

  if (!loading && error) {
    return (
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container-xl border-y border-[var(--viridian-950)]/15 py-12 sm:py-16">
          <p role="alert" className="text-sm text-[var(--muted)]">We couldn’t load selected work right now. Please try again.</p>
          <button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      </section>
    );
  }

  if (!loading && items.length === 0 && !activeService) {
    return (
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container-xl">
          <div className="relative overflow-hidden border-y border-[var(--viridian-950)]/15 py-12 sm:py-16">
            <div aria-hidden="true" className="absolute bottom-0 right-0 top-0 hidden w-1/3 border-l border-[var(--viridian-950)]/10 md:block" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">SELECTED WORK</p>
              <h2 className="mt-5 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">
                Selected work will appear here as JLUXE projects and engagements are added.
              </h2>
              <Link href={siteConfig.nav.contact} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
                Let&apos;s Talk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container-xl">
        <div className="flex flex-col gap-5 border-b border-[var(--viridian-950)]/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">SELECTED WORK</p>
            <h2 className="mt-4 font-display text-4xl text-[var(--viridian-950)] sm:text-5xl">Projects &amp; engagements</h2>
          </div>
          {services.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Filter work by category">
              {[
                { slug: null, title: 'All' },
                ...services.map((service) => ({ slug: service.slug, title: service.title })),
              ].map((service) => (
                <button
                  key={service.slug ?? 'all'}
                  type="button"
                  aria-pressed={activeService === service.slug}
                  onClick={() => { setActiveService(service.slug); setPage(1); }}
                  className={`min-h-10 border px-3 py-2 text-xs font-medium transition-colors ${activeService === service.slug ? 'border-[var(--viridian-900)] bg-[var(--viridian-900)] text-white' : 'border-[var(--viridian-950)]/15 text-[var(--viridian-950)] hover:border-[var(--gold)]'}`}
                >
                  {service.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p role="status" className="mt-8 border-y border-[var(--viridian-950)]/15 py-8 text-sm text-[var(--muted)]">Loading selected work...</p>
        ) : items.length > 0 ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className={`min-w-0 ${item.featured ? 'md:col-span-2' : ''}`}>
                {item.media[0] && (
                  <div role="img" aria-label={item.media[0].altText ?? 'Project image preview unavailable'} className={`flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] px-4 text-center text-sm text-[var(--muted)] ${item.featured ? 'md:aspect-[2/1]' : ''}`}>
                    {item.media[0].altText ?? 'Project image preview unavailable'}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--muted)]">
                  <span className="text-[var(--gold)]">{item.service.title}</span>
                  {item.location && <span>{item.location}</span>}
                  {item.year !== null && <span>{item.year}</span>}
                  {item.featured && <span className="border-l border-[var(--viridian-950)]/20 pl-3">Featured</span>}
                </div>
                <h3 className="mt-3 font-display text-2xl text-[var(--viridian-950)] sm:text-3xl">{item.title}</h3>
                {item.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.description}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 border-b border-[var(--viridian-950)]/15 py-10">
            <p className="text-sm text-[var(--muted)]">No published work is available for this service.</p>
            <button type="button" onClick={resetService} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
              View all work <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Portfolio pages" className="mt-8 flex items-center justify-between border-b border-[var(--viridian-950)]/15 pb-5">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="min-h-10 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </nav>
        )}
      </div>
    </section>
  );
}