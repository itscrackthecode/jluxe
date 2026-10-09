import type { Metadata } from 'next';
import { Instagram, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import EnquiryForm from '@/components/enquiry-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { isConfiguredContact, siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Let\'s Talk',
  description: 'Contact JLUXE about a property, business, training, interiors or other requirement.',
};

const directContacts = [
  { label: 'Email', href: `mailto:${siteConfig.contact.email}`, value: siteConfig.contact.email, icon: Mail },
  { label: 'Instagram', href: siteConfig.contact.instagram, value: 'Instagram', icon: Instagram },
  { label: 'WhatsApp', href: siteConfig.contact.whatsapp, value: siteConfig.contact.whatsappNumber, icon: MessageCircle },
].filter((item) => isConfiguredContact(item.href) && isConfiguredContact(item.value));

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
        <div className="container-xl grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
          <aside className="relative overflow-hidden rounded-[28px] border border-[var(--viridian-950)]/10 bg-[var(--viridian-950)] p-7 text-white shadow-[0_18px_55px_rgba(6,47,41,0.1)] sm:p-9 lg:min-h-full">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">GET IN TOUCH</p>
              <h2 className="mt-4 max-w-md font-display text-3xl leading-tight sm:text-4xl">How can we help you?</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/75 sm:text-base">
                Tell us what you have in mind. Our team will be glad to understand your needs and help you find the right next step.
              </p>
              {directContacts.length > 0 && <div className="mt-8 grid gap-3 border-t border-white/15 pt-6">
                {directContacts.map(({ label, href, value, icon: Icon }) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="touch-press group flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition-colors hover:border-[var(--gold)]/50 hover:bg-white/[0.08] focus-visible:outline-offset-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block text-xs font-semibold tracking-[0.12em] text-white/55">{label}</span><span className="mt-1 block break-all text-sm font-medium text-white transition-colors group-hover:text-[var(--gold)]">{value}</span></span>
                </a>)}
              </div>}
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">ENQUIRY FORM</p>
              <h2 className="mt-3 font-display text-3xl text-[var(--viridian-950)] sm:text-4xl">Send us an enquiry</h2>
            </div>
            <EnquiryForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
