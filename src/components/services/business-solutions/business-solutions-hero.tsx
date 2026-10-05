import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/data';

export default function BusinessSolutionsHero() {
  return (
    <section className="hero-viewport relative isolate min-h-[620px] overflow-hidden bg-[var(--viridian-950)] text-white sm:min-h-[680px]">
      <div
        aria-hidden="true"
        className="hero-media"
        style={{ backgroundImage: "url('/assets/images/business-solutions.png')" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,47,41,0.96)_0%,rgba(6,47,41,0.82)_42%,rgba(6,47,41,0.52)_74%,rgba(6,47,41,0.34)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(3,25,21,0.42)_100%)]" />
      <div className="hero-viewport-inner container-xl relative z-10 flex min-h-[620px] items-center py-20 sm:min-h-[680px] lg:py-24">
        <div className="hero-copy max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">BUSINESS SOLUTIONS</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            Practical solutions for growing businesses.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            JLUXE supports businesses with marketing, branding, lead generation, sales and business development solutions built around real requirements.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
              Discuss Your Requirement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}