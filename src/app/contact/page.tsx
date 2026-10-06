import type { Metadata } from 'next';
import { ArrowRight, Instagram, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import EnquiryForm from '@/components/enquiry-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Let\'s Talk',
  description: 'Contact JLUXE about a property, business, training, interiors or other requirement.',
};

export default function ContactPage() {
  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

      <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24">
        <div className="hero-copy container-xl grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">LET&apos;S TALK</p>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Tell us what you&apos;re looking for.</h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8 lg:justify-self-end">
            Discuss a property requirement, business need, training requirement, interiors project or another enquiry.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-18 lg:py-20" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-16">
          <aside className="max-w-md lg:sticky lg:top-28">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">DIRECT CONTACT</p>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Prefer to reach out directly?</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Use the contact details configured for JLUXE.</p>
            <div className="mt-7 grid gap-5 border-t border-[var(--viridian-950)]/15 pt-5 text-sm">
              <a href={`mailto:${siteConfig.contact.email}`} className="touch-press flex min-w-0 items-start gap-3 break-all transition-colors hover:text-[var(--gold)]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>{siteConfig.contact.email}</span>
              </a>
              <a href={siteConfig.contact.instagram} target="_blank" rel="noreferrer" className="touch-press flex items-center gap-3 transition-colors hover:text-[var(--gold)]">
                <Instagram className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>Instagram</span>
              </a>
              <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press flex items-center gap-3 transition-colors hover:text-[var(--gold)]">
                <MessageCircle className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>{siteConfig.contact.whatsappNumber}</span>
              </a>
            </div>
          </aside>
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">ENQUIRY FORM</p>
              <h2 className="mt-3 font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">How can we help?</h2>
            </div>
            <EnquiryForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
