import Link from 'next/link';
import { ArrowRight, Building2, Handshake, Landmark, Megaphone, MessageCircle } from 'lucide-react';
import { realEstateCapabilities, realEstateOpportunities, siteConfig } from '@/lib/data';

const capabilityIcons = [Building2, Megaphone, Handshake, Landmark];

export function RealEstateCapabilities() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24">
      <div className="container-xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {realEstateCapabilities.map((capability, index) => {
            const Icon = capabilityIcons[index];

            return (
              <article key={capability.number} className="relative min-w-0 border border-white/15 bg-white/[0.035] p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{capability.number}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <h3 className="mt-10 font-display text-2xl">{capability.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{capability.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BuyerSellerSection() {
  return (
    <section id="buyer-seller" className="scroll-mt-24 bg-[var(--sand)]/35 py-20 sm:py-24">
      <div className="container-xl grid gap-4 lg:grid-cols-2">
        <article className="flex min-h-[330px] flex-col items-start border border-[var(--viridian-900)]/10 bg-[var(--viridian-900)] p-7 text-white sm:p-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">LOOKING TO BUY?</p>
          <h2 className="mt-7 max-w-md font-display text-3xl leading-tight sm:text-4xl">Looking for the right property?</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Tell us what you&apos;re looking for and explore relevant property opportunities.
          </p>
          <Link href="/properties" className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-white transition-colors hover:text-[var(--gold)]">
            Explore Opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <article className="flex min-h-[330px] flex-col items-start border border-black/10 bg-[var(--cream)] p-7 text-[var(--viridian-950)] sm:p-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">LOOKING TO SELL?</p>
          <h2 className="mt-7 max-w-md font-display text-3xl leading-tight sm:text-4xl">Have a property to sell?</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
            Tell us about your property and discuss how JLUXE can support its marketing and sale.
          </p>
          <Link href={siteConfig.nav.contact} className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
            Sell With JLUXE <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </div>
    </section>
  );
}

export function PropertyOpportunities() {
  return (
    <section id="opportunities" className="scroll-mt-24 bg-[var(--cream)] py-20 sm:py-24">
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">PROPERTY OPPORTUNITIES</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">Available Opportunities</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
            Explore property opportunities currently represented by JLUXE.
          </p>
        </div>

        {realEstateOpportunities.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {realEstateOpportunities.map((opportunity) => (
              <article key={opportunity.id} className="border border-black/10 bg-white p-6">
                <h3 className="font-display text-2xl text-[var(--viridian-950)]">{opportunity.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{opportunity.summary}</p>
                <Link href={opportunity.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--viridian-950)]">
                  View opportunity <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-6 border border-black/10 bg-white p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <p className="max-w-xl font-display text-2xl leading-snug text-[var(--viridian-950)] sm:text-3xl">
              New opportunities will appear here as they become available.
            </p>
            <Link href={siteConfig.nav.contact} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
              Talk to JLUXE <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function RealEstateFinalCta() {
  return (
    <section className="bg-[var(--viridian-900)] py-16 text-white sm:py-20">
      <div className="container-xl flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">LET&apos;S TALK REAL ESTATE</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Looking for a property or have one to sell?</h2>
          <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">
            Whether you&apos;re looking to buy, sell or discuss a real estate opportunity, start a conversation with JLUXE.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={siteConfig.nav.contact} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
            Let&apos;s Talk <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}