import type { Metadata } from 'next';
import BuyerPropertyForm from '@/components/buyer-property-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Buyer Requirements | JLUXE',
  description: 'Share your property requirements with the JLUXE Real Estate team.',
};

export default function BuyPropertyPage() {
  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="container-xl py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">REAL ESTATE · BUYER ENQUIRY</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Find a property that fits your plans.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Tell us what you are looking for. Our team will understand your requirements and help you explore suitable opportunities.</p>
          <div className="mt-8"><BuyerPropertyForm /></div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
