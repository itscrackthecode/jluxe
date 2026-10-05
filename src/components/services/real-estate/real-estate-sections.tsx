import { Building2, Handshake, Landmark, Megaphone, MessageCircle, PhoneCall } from 'lucide-react';
import { realEstateCapabilities, realEstateOpportunities, siteConfig } from '@/lib/data';
import JluxeCtaLink from '@/components/jluxe-cta-link';

const capabilityIcons = [Building2, Megaphone, Handshake, Landmark];

export function RealEstateCapabilities() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24" data-reveal>
      <div className="container-xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>
          {realEstateCapabilities.map((capability, index) => {
            const Icon = capabilityIcons[index];

            return (
              <article key={capability.number} data-reveal className="premium-card relative min-w-0 border border-white/15 bg-white/[0.035] p-6 sm:p-7">
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

export function PropertyOpportunities() {
  return (
    <section id="opportunities" className="scroll-mt-24 bg-[var(--cream)] py-20 sm:py-24" data-reveal>
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
              <article key={opportunity.id} data-reveal className="premium-card border border-black/10 bg-white p-6">
                <h3 className="font-display text-2xl text-[var(--viridian-950)]">{opportunity.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{opportunity.summary}</p>
                <JluxeCtaLink href={opportunity.href} className="mt-6">
                  View opportunity
                </JluxeCtaLink>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-6 border border-black/10 bg-white p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <p className="max-w-xl font-display text-2xl leading-snug text-[var(--viridian-950)] sm:text-3xl">
              New opportunities will appear here as they become available.
            </p>
            <JluxeCtaLink href={siteConfig.nav.contact} className="w-fit shrink-0">
              Talk to JLUXE
            </JluxeCtaLink>
          </div>
        )}
      </div>
    </section>
  );
}

export function RealEstateFinalCta() {
  return (
    <section className="bg-[var(--viridian-900)] py-16 text-white sm:py-20" data-reveal>
      <div className="container-xl flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">LET&apos;S TALK REAL ESTATE</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Looking for a property or have one to sell?</h2>
          <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">
            Whether you&apos;re looking to buy, sell or discuss a real estate opportunity, start a conversation with JLUXE.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <JluxeCtaLink href={siteConfig.nav.contact} className="w-full justify-center sm:w-auto" icon={<PhoneCall className="h-5 w-5" />}>
            Let&apos;s Talk
          </JluxeCtaLink>
          <JluxeCtaLink href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="w-full justify-center sm:w-auto" icon={<MessageCircle className="h-5 w-5" />}>
            WhatsApp
          </JluxeCtaLink>
        </div>
      </div>
    </section>
  );
}