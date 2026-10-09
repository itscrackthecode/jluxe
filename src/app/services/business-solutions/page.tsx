import { Instagram, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import BusinessSolutionsHero from '@/components/services/business-solutions/business-solutions-hero';
import { BusinessSolutionsServices } from '@/components/services/business-solutions/business-solutions-sections';
import FaqSection, { type FaqItem } from '@/components/faq-section';
import { isConfiguredContact, siteConfig } from '@/lib/data';

const businessSolutionsFaq: FaqItem[] = [
  { question: 'What business solutions does JLUXE provide?', answer: 'JLUXE provides real estate, collection, and banking solutions for individuals, businesses, and financial institutions.' },
  { question: 'What is included in Real Estate Solutions?', answer: 'Property acquisition and sales support; property management; real estate investment solutions; due diligence and documentation support; commercial and residential property services; and asset valuation and advisory.' },
  { question: 'What is included in Collection Solutions?', answer: 'Receivables and payment collection; loan and debt collection support; customer payment follow-up; account reconciliation; recovery and settlement services; and collection reporting and monitoring.' },
  { question: 'What is included in Banking Solutions?', answer: 'Banking and financial service support; loan and credit-related services; account and payment solutions; financial documentation support; customer onboarding and verification; and transaction and payment management.' },
  { question: 'Can JLUXE combine multiple solutions for one requirement?', answer: 'Yes. JLUXE can discuss a requirement across relevant solutions and shape the conversation around what is needed.' },
  { question: 'How can I discuss my business requirement with JLUXE?', answer: 'Use the Discuss Your Requirement action above to open the JLUXE contact and enquiry flow.' },
];

export const metadata: Metadata = {
  title: 'Business Solutions',
  description: 'We provide integrated business solutions designed to help individuals, businesses, and financial institutions manage their real estate, collections, and banking requirements efficiently and securely.',
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
