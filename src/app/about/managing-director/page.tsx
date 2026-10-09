import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import JluxeCtaLink from '@/components/jluxe-cta-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Managing Director',
  description: 'Meet Sarvesh Karthik N, Managing Director of JLUXE, and learn about the principles and areas of experience behind the JLUXE ecosystem.',
};

const areas = ['Real Estate', 'Sales & Marketing', 'Business Consulting', 'Recruitment', 'Training', 'Corporate Services', 'Education-focused initiatives'];
const principles = [
  ['TRUST', 'Trust creates relationships.'],
  ['TRANSPARENCY', 'Transparency creates confidence.'],
  ['PROFESSIONALISM', 'Professionalism creates credibility.'],
  ['RESULTS', 'Results create long-term partnerships.'],
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[11px] font-semibold tracking-[0.22em] ${light ? 'text-[var(--gold)]' : 'text-[var(--viridian-700)]'}`}>{children}</p>;
}

export default function ManagingDirectorPage() {
  return (
    <main className="overflow-hidden bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

      <section className="hero-glow relative isolate overflow-hidden bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16">
          <div className="relative mx-auto w-full max-w-[390px] lg:mx-0">
            <div className="about-portrait-frame aspect-[4/5] border border-white/25 bg-[var(--viridian-950)] p-4 sm:p-5"><div className="flex h-full items-end border border-white/15 p-5 sm:p-7"><p className="max-w-[15rem] text-xs leading-5 text-white/65">Managing Director portrait</p></div></div>
            <p className="mt-3 text-[10px] tracking-[0.16em] text-[var(--gold)]">JLUXE LEADERSHIP</p>
          </div>
          <div className="relative z-10 max-w-3xl">
            <Eyebrow light>MEET OUR MANAGING DIRECTOR</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-[1.04] tracking-[-0.03em] text-[var(--cream)]">Sarvesh Karthik N</h1>
            <p className="mt-4 text-sm font-medium tracking-[0.08em] text-white/75">Managing Director — JLUXE</p>
            <p className="mt-8 max-w-2xl font-display text-2xl leading-relaxed text-[var(--cream)] sm:text-3xl">Building Businesses.<br />Developing People.<br />Creating Opportunities.</p>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-10 hidden h-[470px] w-[470px] rounded-full border border-white/[0.08] lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-32 hidden h-[330px] w-[330px] rounded-full border border-[var(--gold)]/20 lg:block" />
      </section>

      <section className="bg-[var(--cream)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <article className="about-depth-card grid gap-5 p-6 sm:p-9 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12 lg:p-12">
            <div><Eyebrow light>WHO HE IS</Eyebrow><h2 className="mt-4 max-w-md font-display text-3xl leading-tight text-[var(--cream)] sm:text-4xl">Experience across people, business and opportunity.</h2><span aria-hidden="true" className="mt-6 block h-px w-12 bg-[var(--gold)]" /></div>
            <p className="self-center text-base leading-7 text-white/85 sm:text-lg sm:leading-8">Sarvesh Karthik N is a business professional and entrepreneur with experience across Real Estate, Sales &amp; Marketing, Business Consulting, Recruitment, Training, Corporate Services and Education-focused initiatives.</p>
          </article>
        </div>
      </section>

      <section className="bg-[var(--viridian-950)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="about-depth-card-dark p-6 sm:p-9 lg:p-12">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-12">
              <div><Eyebrow>LEADERSHIP PERSPECTIVE</Eyebrow><h2 className="mt-4 max-w-md font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">The principles behind JLUXE.</h2></div>
              <p className="max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">Trust, transparency, professionalism and results guide the way JLUXE works.</p>
            </div>
            <div className="mt-8 grid gap-5 border-t border-[var(--viridian-950)]/15 pt-6 sm:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>
              {principles.map(([title, description], index) => <article key={title} data-reveal className="border-l border-[var(--gold)]/70 pl-4"><p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--viridian-700)]">0{index + 1}</p><h3 className="mt-3 font-display text-xl text-[var(--viridian-950)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--cream)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><Eyebrow>AREAS OF EXPERIENCE</Eyebrow><h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">Where experience meets opportunity.</h2></div>
          <ul className="grid gap-2 sm:grid-cols-2" data-reveal-stagger>{areas.map((area, index) => <li key={area} data-reveal className="premium-card about-depth-card flex min-h-16 items-center gap-4 px-4 py-4 sm:px-5"><span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--gold)]">{String(index + 1).padStart(2, '0')}</span><span className="text-sm font-medium text-[var(--cream)]">{area}</span></li>)}</ul>
        </div>
      </section>

      <section className="bg-[var(--viridian-950)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div><Eyebrow light>BUILDING JLUXE</Eyebrow><h2 className="mt-4 font-display text-4xl leading-tight text-[var(--cream)] sm:text-5xl">Connecting people.<br />Creating opportunities.<br />Building growth.</h2></div>
          <div className="about-depth-card-dark max-w-2xl p-6 sm:p-8"><p className="text-base leading-7 text-[var(--viridian-950)] sm:text-lg sm:leading-8">JLUXE brings together business capabilities and professional networks across real estate, corporate, banking, talent and education ecosystems.</p><Link href="/about" className="touch-press mt-7 inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)] pb-1 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--viridian-700)]">Explore About JLUXE <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="bg-[var(--cream)] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-12"><div><Eyebrow>LEADERSHIP PRINCIPLES</Eyebrow><h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">How we work.</h2></div><p className="max-w-lg text-sm leading-7 text-[var(--muted)] md:justify-self-end">These shared principles shape JLUXE&apos;s relationships and professional approach.</p></div>
          <div className="mt-9 grid gap-px bg-[var(--viridian-950)]/15 sm:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>{principles.map(([title, description], index) => <article key={title} data-reveal className="border-l-2 border-[var(--gold)] bg-[var(--viridian-950)] px-4 py-5 sm:px-5"><p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">0{index + 1}</p><h3 className="mt-3 font-display text-xl text-[var(--cream)]">{title}</h3><p className="mt-2 text-sm leading-6 text-white/75">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="hero-glow bg-[var(--viridian-950)] py-14 text-white sm:py-16" data-reveal>
        <div className="container-xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><Eyebrow light>LET&apos;S TALK</Eyebrow><h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-[var(--cream)] sm:text-4xl">Building relationships.<br className="sm:hidden" /> Creating opportunities.<br className="sm:hidden" /> Delivering results.</h2></div><JluxeCtaLink href={siteConfig.nav.contact}>Let&apos;s Talk</JluxeCtaLink></div>
      </section>
      <SiteFooter />
    </main>
  );
}
