import { MessageCircle, PhoneCall } from 'lucide-react';
import { isConfiguredContact, realEstateCapabilities, siteConfig } from '@/lib/data';
import JluxeCtaLink from '@/components/jluxe-cta-link';
import RealEstateCapabilityCard from '@/components/services/real-estate/real-estate-capability-card';

export function RealEstateCapabilities() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24" data-reveal>
      <div className="container-xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
        </div>
        <div className="mt-10 grid auto-rows-[360px] gap-4 md:grid-cols-2 xl:auto-rows-[424px] xl:grid-cols-4" data-reveal-stagger>
          {realEstateCapabilities.map((capability) => (
            <RealEstateCapabilityCard key={capability.number} capability={capability} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function RealEstateFinalCta() {
  return (
    <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20" data-reveal>
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
          {isConfiguredContact(siteConfig.contact.whatsapp) && <JluxeCtaLink href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="w-full justify-center sm:w-auto" icon={<MessageCircle className="h-5 w-5" />}>
            WhatsApp
          </JluxeCtaLink>}
        </div>
      </div>
    </section>
  );
}
