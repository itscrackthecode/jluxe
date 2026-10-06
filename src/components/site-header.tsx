'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  PhoneCall,
  X,
} from 'lucide-react';
import { services, siteConfig } from '@/lib/data';
import MobileReveal from '@/components/mobile-reveal';

const isPlaceholderContact = (value: string) => /your-|000000|\.example/.test(value);

const contactItems = [
  {
    label: 'Email',
    href: isPlaceholderContact(siteConfig.contact.email) ? siteConfig.nav.contact : `mailto:${siteConfig.contact.email}`,
    icon: Mail,
  },
  {
    label: 'Instagram',
    href: isPlaceholderContact(siteConfig.contact.instagram) ? siteConfig.nav.contact : siteConfig.contact.instagram,
    icon: Instagram,
  },
  {
    label: 'WhatsApp',
    href: isPlaceholderContact(siteConfig.contact.whatsapp) ? siteConfig.nav.contact : siteConfig.contact.whatsapp,
    icon: MessageCircle,
  },
];

export default function SiteHeader() {
  const [openDropdown, setOpenDropdown] = useState<'services' | 'contact' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const servicesButtonRef = useRef<HTMLButtonElement | null>(null);
  const contactButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (openDropdown === 'services') servicesButtonRef.current?.focus();
      if (openDropdown === 'contact') contactButtonRef.current?.focus();
      if (mobileOpen) window.requestAnimationFrame(() => mobileButtonRef.current?.focus());
      setOpenDropdown(null);
      setMobileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, openDropdown]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-black/5 bg-[var(--cream)]/90 backdrop-blur-sm">
      <MobileReveal />
      <div className="container-xl relative" ref={ref}>
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="touch-press flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
            <img
              src="/assets/images/jluxe-monogram.png"
              alt=""
              width={1312}
              height={1199}
              className="h-7 w-auto md:h-8"
            />
            <span className="font-display text-3xl tracking-tight text-[var(--viridian-950)]">{siteConfig.brand}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--viridian-950)] md:flex">
            <Link href={siteConfig.nav.about} className="transition hover:text-[var(--gold)]">About</Link>
            <div className="relative">
              <button
                ref={servicesButtonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'services'}
                aria-controls="services-menu"
                className="flex items-center gap-1 transition hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]"
                onClick={() => setOpenDropdown(openDropdown === 'services' ? null : 'services')}
              >
                Our Services
                <ChevronDown className={`h-4 w-4 transition ${openDropdown === 'services' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'services' && (
                <div id="services-menu" className="absolute left-0 top-full mt-3 w-72 rounded-2xl border border-black/5 bg-white p-2 shadow-xl">
                  {services.map((service) => (
                    <Link
                      key={service.title}
                      href={service.href}
                      className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[var(--viridian-950)] transition hover:bg-[var(--cream)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span>{service.title}</span>
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">{service.kicker}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={siteConfig.nav.work} className="transition hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">Our Work</Link>

            <div className="relative">
              <button
                ref={contactButtonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'contact'}
                aria-controls="contact-menu"
                className="flex items-center gap-1 transition hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]"
                onClick={() => setOpenDropdown(openDropdown === 'contact' ? null : 'contact')}
              >
                Contact
                <ChevronDown className={`h-4 w-4 transition ${openDropdown === 'contact' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'contact' && (
                <div id="contact-menu" className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-black/5 bg-white p-2 shadow-xl">
                  {contactItems.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noreferrer' : undefined}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--viridian-950)] transition hover:bg-[var(--cream)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Icon className="h-4 w-4 text-[var(--gold)]" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:block">
            <Link
              href={siteConfig.nav.contact}
              aria-label="Let&apos;s Talk"
              className="jluxe-talk-button"
            >
              <span className="talk-text">Let&apos;s Talk</span>
              <span aria-hidden="true" className="talk-icon">
                <PhoneCall />
              </span>
            </Link>
          </div>

          <button
            ref={mobileButtonRef}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="touch-press relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
          >
            <span className="relative h-5 w-5">
              <Menu className={`absolute inset-0 h-5 w-5 transition-transform duration-300 ease-out ${mobileOpen ? 'rotate-90 opacity-0' : 'opacity-100'}`} />
              <X className={`absolute inset-0 h-5 w-5 transition-transform duration-300 ease-out ${mobileOpen ? 'opacity-100' : '-rotate-90 opacity-0'}`} />
            </span>
          </button>
        </div>

        <div className={`grid md:hidden ${mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'} transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none`}>
          <nav
            id="mobile-navigation"
            className={`overflow-hidden border-t bg-[var(--cream)] ${mobileOpen ? 'border-black/5' : 'border-transparent'}`}
            aria-hidden={!mobileOpen}
            inert={!mobileOpen}
          >
            <div className={`flex max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px))] flex-col gap-3 overflow-y-auto py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm font-medium text-[var(--viridian-950)] transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}>
              <Link href={siteConfig.nav.about} className="mobile-nav-link touch-press flex min-h-11 items-center rounded-xl px-3 py-2.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]" onClick={() => setMobileOpen(false)}>About</Link>
              <div className="rounded-xl border border-black/5 bg-white px-3 py-2">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-[var(--gold)]">Our Services</p>
                <div className="grid gap-2">
                  {services.map((service) => (
                    <Link key={service.title} href={service.href} className="mobile-nav-link touch-press flex min-h-11 items-center text-sm text-[var(--viridian-950)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]" onClick={() => setMobileOpen(false)}>
                      {service.title}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href={siteConfig.nav.work} className="mobile-nav-link touch-press flex min-h-11 items-center rounded-xl px-3 py-2.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]" onClick={() => setMobileOpen(false)}>Our Work</Link>
              <div className="rounded-xl border border-black/5 bg-white px-3 py-2">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-[var(--gold)]">Contact</p>
                <div className="grid gap-2 text-sm">
                  {contactItems.map(({ label, href, icon: Icon }) => (
                    <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="mobile-nav-link touch-press flex min-h-11 items-center gap-2 text-[var(--viridian-950)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]" onClick={() => setMobileOpen(false)}>
                      <Icon className="h-4 w-4 text-[var(--gold)]" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              </div>
              <Link href={siteConfig.nav.contact} className="touch-press inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]" onClick={() => setMobileOpen(false)}>
                Let&apos;s Talk
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
