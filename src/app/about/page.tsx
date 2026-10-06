import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import ManagingDirectorSlider from '@/components/managing-director-slider';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about JLUXE, a business ecosystem connecting people, properties, businesses, talent and opportunities.',
};

const principles = [
  { name: 'Trust', description: 'Building relationships grounded in confidence and reliability.' },
  { name: 'Transparency', description: 'Keeping communication clear and straightforward.' },
  { name: 'Professionalism', description: 'Approaching every requirement with care and responsibility.' },
  { name: 'Results', description: 'Focusing on meaningful outcomes, not unnecessary promises.' },
];

const connectedAreas = ['People', 'Properties', 'Businesses', 'Talent', 'Opportunities'];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

      <section className="relative isolate overflow-hidden bg-[var(--viridian-950)] py-20 text-white sm:py-24 lg:py-28">
        <div className="hero-copy container-xl relative z-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--gold)]">ABOUT JLUXE</p>
            <h1 className="mt-6 font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
              Building relationships.<br />Creating opportunities.<br />Delivering results.
            </h1>
          </div>
          <p className="max-w-lg text-base leading-7 text-white/70 sm:text-lg sm:leading-8 lg:justify-self-end">
            JLUXE is a business ecosystem connecting people, properties, businesses, talent, opportunities and growth.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-10 hidden h-[470px] w-[470px] rounded-full border border-white/[0.08] lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 top-32 hidden h-[330px] w-[330px] rounded-full border border-[var(--gold)]/20 lg:block" />
      </section>

      <section className="py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">THE COMPANY</p>
          <div className="max-w-3xl">
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">Who We Are</h2>
            <p className="mt-5 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              JLUXE brings multiple business capabilities together under one brand, supporting people and organisations across real estate, business solutions, talent and training, and interiors and design. Boutique is currently in development.
            </p>
          </div>
        </div>
      </section>
      <section
  className="border-y border-[var(--viridian-950)]/10 bg-[var(--sand)]/20 py-16 sm:py-20 lg:py-24"
  data-reveal
>
  <div className="container-xl grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">

    {/* Portrait */}
    <div className="relative">
      <div className="relative aspect-[4/5] overflow-hidden border border-[var(--viridian-950)]/15 bg-[var(--sand)]/35">
        <div
          aria-hidden="true"
          className="absolute inset-5 border border-[var(--viridian-950)]/10"
        />
      </div>
    </div>

    {/* Leadership content */}
    <ManagingDirectorSlider />
  </div>
</section>
      <section className="border-y border-[var(--viridian-950)]/10 bg-[var(--sand)]/35 py-16 sm:py-20" data-reveal>
        <div className="container-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">What JLUXE Represents</h2>
            <p className="text-xs font-medium tracking-[0.18em] text-[var(--muted)]">PRINCIPLES, NOT PROMISES</p>
          </div>
          <div className="mt-10 grid border-t border-[var(--viridian-950)]/15 sm:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>
            {principles.map((principle, index) => (
              <article key={principle.name} data-reveal className={`min-w-0 border-b border-[var(--viridian-950)]/15 py-5 sm:py-6 ${index % 2 === 1 ? 'sm:border-l sm:pl-6' : 'sm:pr-6'} ${index > 1 ? 'xl:border-l xl:pl-6' : ''}`}>
                <h3 className="font-display text-2xl text-[var(--viridian-950)]">{principle.name}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--cream)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">THE JLUXE ECOSYSTEM</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">One brand.<br />Multiple opportunities.</h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              Distinct capabilities sit under one brand, creating a clear point of entry for people and organisations with different requirements.
            </p>
            <ul className="mt-8 grid grid-cols-2 border-l border-t border-[var(--viridian-950)]/15 sm:grid-cols-3">
              {connectedAreas.map((area) => (
                <li key={area} className="flex min-h-16 items-center border-b border-r border-[var(--viridian-950)]/15 px-4 text-sm font-medium text-[var(--viridian-950)] sm:min-h-20 sm:px-5">
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[var(--viridian-900)] py-16 text-white sm:py-20" data-reveal>
        <div className="container-xl flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Let&apos;s start a conversation.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">Have a requirement, opportunity or idea you&apos;d like to discuss?</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
              Let&apos;s Talk <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
