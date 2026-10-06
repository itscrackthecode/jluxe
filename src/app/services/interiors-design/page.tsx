import { Instagram, MessageCircle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import FaqSection, { type FaqItem } from '@/components/faq-section';
import { siteConfig } from '@/lib/data';

const interiorsFaq: FaqItem[] = [
  { question: 'What interior design services does JLUXE provide?', answer: 'JLUXE provides interior designing focused on functional, thoughtful and refined spaces.' },
  { question: 'Can JLUXE design interiors based on specific requirements?', answer: 'Yes. Interior design conversations can be shaped around the client\'s requirements, space and intended use.' },
  { question: 'Can I discuss an interior design requirement with JLUXE before starting?', answer: 'Yes. Contact JLUXE to discuss the requirement before deciding on the next step.' },
  { question: 'How can I enquire about an Interior & Design project?', answer: 'Use the Enquire Now action above to open the existing JLUXE contact and enquiry flow.' },
];

export const metadata: Metadata = {
  title: 'Interiors & Design',
  description: 'Interior designing focused on functional, thoughtful and refined spaces from JLUXE.',
};

export default function InteriorsDesignPage() {
  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="hero-viewport relative isolate min-h-[620px] overflow-hidden bg-[var(--viridian-950)] text-white sm:min-h-[680px]">
        <div aria-hidden="true" className="hero-media" style={{ backgroundImage: "url('/assets/images/interiors-designs.png')" }} />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,47,41,0.96)_0%,rgba(6,47,41,0.82)_42%,rgba(6,47,41,0.52)_74%,rgba(6,47,41,0.34)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(3,25,21,0.42)_100%)]" />
        <div className="hero-viewport-inner container-xl relative z-10 flex min-h-[620px] items-center py-20 sm:min-h-[680px] lg:py-24">
          <div className="hero-copy max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">INTERIORS &amp; DESIGN</p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.04] text-white sm:text-6xl lg:text-7xl">Interiors &amp; Design</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              Interior designing focused on creating functional, thoughtful and refined spaces shaped around each client&apos;s requirements.
            </p>
            <div className="mt-7">
              <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
                Enquire Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--cream)] py-20 sm:py-24" data-reveal>
        <div className="container-xl">
          <article className="premium-card max-w-4xl border border-[var(--viridian-950)]/10 bg-white p-7 sm:p-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">INTERIOR DESIGNING</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">Thoughtful spaces with purpose.</h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              JLUXE provides interior design solutions focused on functionality, aesthetics, thoughtful space planning and refined interiors, shaped around the client&apos;s requirements.
            </p>
          </article>
        </div>
      </section>

      <FaqSection eyebrow="INTERIORS & DESIGN FAQ" title="Questions, answered clearly." items={interiorsFaq} />

      <section className="bg-[var(--sand)]/35 py-14 sm:py-16" data-reveal>
        <div className="container-xl flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">DIRECT CONTACT</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">Still have questions?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Talk to us directly through the configured JLUXE channels.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--viridian-950)]">
            <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]"><MessageCircle className="h-4 w-4 text-[var(--gold)]" /> WhatsApp</a>
            <a href={siteConfig.contact.instagram} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]"><Instagram className="h-4 w-4 text-[var(--gold)]" /> Instagram</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
