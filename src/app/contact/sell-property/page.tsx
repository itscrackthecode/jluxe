import type { Metadata } from 'next';
import SellPropertyForm from '@/components/sell-property-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Submit a Property | JLUXE',
  description: 'Share a property opportunity with JLUXE for consideration, marketing or channel partnership.',
};

export default function SellPropertyPage() {
  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24">
        <div className="hero-copy container-xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">LOOKING TO SELL?</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Share a property opportunity with JLUXE.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Tell us about the property and how we can explore representation, marketing or channel partnership support.
          </p>
        </div>
      </section>
      <section className="py-14 sm:py-18 lg:py-20" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-16">
          <aside className="max-w-md">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PROPERTY SUBMISSION</p>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">A few details to begin.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Media is optional. A JLUXE representative will review the information and follow up if the opportunity is relevant.</p>
          </aside>
          <SellPropertyForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
