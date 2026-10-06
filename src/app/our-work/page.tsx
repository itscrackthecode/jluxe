import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorkPortfolio from '@/components/work-portfolio';
import { siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Our Work',
  description: 'Selected work, projects and capabilities across the JLUXE ecosystem.',
};

export default function OurWorkPage() {
  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

      <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24 lg:py-28">
        <div className="hero-copy container-xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">OUR WORK</p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
              Work that speaks for itself.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8 lg:justify-self-end">
            A space for selected work, projects and capabilities across the JLUXE ecosystem.
          </p>
        </div>
      </section>

      <WorkPortfolio />

      <section className="bg-[var(--sand)]/35 py-16 sm:py-20" data-reveal>
        <div className="container-xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Have something in mind?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
              Let&apos;s discuss your requirement, project or opportunity.
            </p>
          </div>
          <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
            Let&apos;s Talk <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}