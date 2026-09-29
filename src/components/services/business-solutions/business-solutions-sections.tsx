import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Landmark,
  Megaphone,
  Palette,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  businessSolutionsAudiences,
  businessSolutionsContact,
  businessSolutionsServices,
  siteConfig,
} from '@/lib/data';

const serviceIcons = [Megaphone, Palette, Target, TrendingUp, Landmark, CalendarDays];

export function BusinessSolutionsServices() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24">
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">BUSINESS SUPPORT</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
          </div>
          <BriefcaseBusiness aria-hidden="true" className="hidden h-7 w-7 text-[var(--gold)] md:block" strokeWidth={1.4} />
        </div>

        <div className="mt-10 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3">
          {businessSolutionsServices.map((service, index) => {
            const Icon = serviceIcons[index];

            return (
              <article key={service.number} className="min-w-0 bg-[var(--viridian-950)] p-6 transition-colors hover:bg-[var(--viridian-900)] sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{service.number}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <h3 className="mt-9 font-display text-2xl leading-snug">{service.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BusinessSolutionsAudience() {
  return (
    <section className="bg-[var(--sand)]/35 py-14 sm:py-16">
      <div className="container-xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <h2 className="font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">
          For businesses, corporates and organizations.
        </h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          {businessSolutionsAudiences.map((audience) => (
            <li key={audience} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              {audience}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BusinessSolutionsCta() {
  return (
    <section className="bg-[var(--viridian-900)] py-16 text-white sm:py-20">
      <div className="container-xl flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{businessSolutionsContact.heading}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">{businessSolutionsContact.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={businessSolutionsContact.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
            Let&apos;s Talk <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]">
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}