'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/data';
import { getMediaImageUrl } from '@/lib/media';

type WorkMedia = {
  id: string;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  position: number;
  altText: string | null;
};

type ApiWork = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string | null;
  year: number | null;
  featured: boolean;
  createdAt: string;
  service: { id: string; slug: string; title: string };
  media: WorkMedia[];
};

export default function WorkDetail({ slug }: { slug: string }) {
  const [work, setWork] = useState<ApiWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWork() {
      setLoading(true);
      setNotFound(false);
      setError(false);

      try {
        const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, { signal: controller.signal });
        const result = await response.json();

        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok || result.success !== true) throw new Error('Unable to load work.');

        setWork(result.data as ApiWork);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadWork();
    return () => controller.abort();
  }, [requestVersion, slug]);

  if (loading) {
    return <p role="status" className="container-xl py-16 text-sm text-[var(--muted)]">Loading work...</p>;
  }

  if (notFound) {
    return (
      <section className="py-16 sm:py-20">
        <div className="container-xl border-y border-[var(--viridian-950)]/15 py-10">
          <h1 className="font-display text-3xl text-[var(--viridian-950)]">Work not found</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">This project may no longer be available.</p>
          <Link href="/our-work" className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
            <ArrowLeft className="h-4 w-4" /> Our work
          </Link>
        </div>
      </section>
    );
  }

  if (error || !work) {
    return (
      <section role="alert" className="py-16 sm:py-20">
        <div className="container-xl border-y border-[var(--viridian-950)]/15 py-10">
          <h1 className="font-display text-3xl text-[var(--viridian-950)]">Work unavailable</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">We couldn’t load this work right now. Please try again.</p>
          <button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] hover:text-[var(--gold)]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[var(--viridian-950)] py-14 text-white sm:py-18">
        <div className="hero-copy container-xl">
          <Link href="/our-work" className="touch-press inline-flex min-h-11 items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Our work
          </Link>
          <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">SELECTED WORK</p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">{work.title}</h1>
            </div>
            <p className="w-fit border border-white/20 px-3 py-2 text-sm text-white/80">{work.service.title}</p>
          </div>
        </div>
      </section>

      <section aria-label="Work images" className="bg-[var(--cream)] py-6 sm:py-8" data-reveal>
        <div className="container-xl grid gap-3 sm:grid-cols-2">
          {work.media.length > 0 ? work.media.map((image) => (
            <div key={image.id} className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] px-4 text-center text-sm text-[var(--muted)]">
              <img src={getMediaImageUrl(image.storageKey, 'portfolio')} alt={image.altText ?? 'JLUXE work'} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getMediaImageUrl(null, 'portfolio'); }} />
            </div>
          )) : (
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--sand)] text-sm text-[var(--muted)]">
              <img src={getMediaImageUrl(null, 'portfolio')} alt="JLUXE work placeholder" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            {work.description && (
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROJECT DETAILS</p>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">{work.description}</p>
              </div>
            )}
            {(work.location || work.year !== null) && (
              <dl className="mt-8 grid gap-5 border-t border-[var(--viridian-950)]/15 pt-6 sm:grid-cols-2">
                {work.location && <div><dt className="text-xs text-[var(--muted)]">Location</dt><dd className="mt-1 text-sm font-medium">{work.location}</dd></div>}
                {work.year !== null && <div><dt className="text-xs text-[var(--muted)]">Year</dt><dd className="mt-1 text-sm font-medium">{work.year}</dd></div>}
              </dl>
            )}
          </div>

          <aside className="h-fit border-t border-[var(--viridian-950)]/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">ENQUIRY</p>
            <h2 className="mt-3 font-display text-3xl">Interested in similar work?</h2>
            <Link href={siteConfig.nav.contact} className="touch-press mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Contact JLUXE <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
