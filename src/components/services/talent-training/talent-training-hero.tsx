import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/data';

export default function TalentTrainingHero() {
  return (
    <section className="border-b border-[var(--viridian-950)]/10 bg-[var(--cream)] py-20 sm:py-24 lg:py-28">
      <div className="container-xl grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">TALENT &amp; TRAINING</p>
          <h1 className="mt-6 max-w-2xl font-display text-5xl leading-[1.04] text-[var(--viridian-950)] sm:text-6xl lg:text-7xl">
            Connecting talent<br className="hidden sm:block" /> with opportunity.
          </h1>
        </div>
        <div className="max-w-xl lg:justify-self-end">
          <p className="text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
            JLUXE supports organisations and individuals through recruitment, staffing, training and career-focused services.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={siteConfig.nav.contact} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Discuss Your Requirement <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={siteConfig.nav.contact} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--viridian-950)]/20 px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:border-[var(--gold)] hover:text-[var(--viridian-800)]">
              Let&apos;s Talk <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="container-xl mt-14 hidden grid-cols-3 border-y border-[var(--viridian-950)]/10 sm:grid">
        <div className="border-r border-[var(--viridian-950)]/10 py-4 text-xs font-medium tracking-[0.12em] text-[var(--muted)]">TALENT</div>
        <div className="border-r border-[var(--viridian-950)]/10 px-5 py-4 text-xs font-medium tracking-[0.12em] text-[var(--muted)]">LEARNING</div>
        <div className="px-5 py-4 text-xs font-medium tracking-[0.12em] text-[var(--muted)]">CAREERS</div>
      </div>
    </section>
  );
}