import { Instagram, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import BusinessSolutionsHero from '@/components/services/business-solutions/business-solutions-hero';
import { BusinessSolutionsServices } from '@/components/services/business-solutions/business-solutions-sections';
import FaqSection, { type FaqItem } from '@/components/faq-section';
import { isConfiguredContact, siteConfig } from '@/lib/data';

const businessSolutionsFaq: FaqItem[] = [
  { question: 'What business solutions does JLUXE provide?', answer: 'JLUXE provides marketing, branding, lead generation, sales and business development, banking services, and event management support.' },
  { question: 'Can I approach JLUXE for only one service?', answer: 'Yes. You can approach JLUXE with a focused requirement for any one of the listed Business Solutions services.' },
  { question: 'Can JLUXE combine multiple services for one business requirement?', answer: 'Yes. JLUXE can discuss a requirement across multiple services and shape the conversation around what the business needs.' },
  { question: 'Do you provide both branding and marketing support?', answer: 'Yes. Branding and marketing are both part of the Business Solutions offering.' },
  { question: 'Can JLUXE help with lead generation?', answer: 'Yes. Lead generation support is available as part of the Business Solutions offering.' },
  { question: 'Do you provide sales and business development support?', answer: 'Yes. JLUXE provides sales and business development support for relevant business requirements.' },
  { question: 'Can JLUXE help with business events?', answer: 'Yes. Event management support is available for corporate, business and promotional events.' },
  { question: 'How can I discuss my business requirement with JLUXE?', answer: 'Use the Discuss Your Requirement action above to open the JLUXE contact and enquiry flow.' },
];

export const metadata: Metadata = {
  title: 'Business Solutions',
  description: 'Marketing, branding, lead generation, sales and business development support from JLUXE.',
};

export default function BusinessSolutionsPage() {
  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <BusinessSolutionsHero />
      <BusinessSolutionsServices />
      <FaqSection eyebrow="BUSINESS SOLUTIONS FAQ" title="Questions, answered clearly." items={businessSolutionsFaq} />
      <section className="bg-[var(--sand)]/35 py-14 sm:py-16" data-reveal>
        <div className="container-xl flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">DIRECT CONTACT</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">Still have questions?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Talk to us directly through the configured JLUXE channels.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--viridian-950)]">
            {isConfiguredContact(siteConfig.contact.whatsapp) ? <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]">
              <MessageCircle className="h-4 w-4 text-[var(--gold)]" /> WhatsApp
            </a> : <a href={siteConfig.nav.contact} className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]">Enquiry form</a>}
            {isConfiguredContact(siteConfig.contact.instagram) && <a href={siteConfig.contact.instagram} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]">
              <Instagram className="h-4 w-4 text-[var(--gold)]" /> Instagram
            </a>}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
