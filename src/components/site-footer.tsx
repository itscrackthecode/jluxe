import Link from 'next/link';
import { services, siteConfig } from '@/lib/data';

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--viridian-950)] py-12 text-white">
      <div className="container-xl grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl">{siteConfig.brand}</div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
            Building relationships, creating opportunities and delivering results across our services.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Explore</p>
          <div className="mt-4 grid gap-3 text-sm text-white/55">
            <Link href={siteConfig.nav.about} className="transition hover:text-white">About</Link>
            <Link href="/#services" className="transition hover:text-white">Our Services</Link>
            <Link href={siteConfig.nav.work} className="transition hover:text-white">Our Work</Link>
            <Link href={siteConfig.nav.contact} className="transition hover:text-white">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Our Services</p>
          <div className="mt-4 grid gap-3 text-sm text-white/55">
            {services.map((service) => (
              <Link key={service.title} href={service.href} className="transition hover:text-white">
                {service.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="container-xl mt-10 border-t border-white/10 pt-6 text-xs text-white/35">
        © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
      </div>
    </footer>
  );
}