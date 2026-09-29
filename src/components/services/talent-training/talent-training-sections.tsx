import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  MessageCircle,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react';
import {
  siteConfig,
  talentOpportunities,
  talentTrainingAudiences,
  talentTrainingContact,
  talentTrainingServices,
} from '@/lib/data';

const serviceIcons = [UserRoundSearch, BriefcaseBusiness, GraduationCap, MessageCircle, ArrowRight];

export function TalentTrainingServices() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24">
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">TALENT &amp; TRAINING</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
          </div>
          <UsersRound aria-hidden="true" className="hidden h-7 w-7 text-[var(--gold)] sm:block" strokeWidth={1.4} />
        </div>
        <div className="mt-10 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3">
          {talentTrainingServices.map((service, index) => {
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

export function TalentTrainingAudience() {
  return (
    <section className="bg-[var(--sand)]/35 py-16 sm:py-20">
      <div className="container-xl">
        <h2 className="max-w-3xl font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">
          For Organisations. Institutions. Individuals.
        </h2>
        <div className="mt-9 grid border-t border-[var(--viridian-950)]/15 sm:grid-cols-3">
          {talentTrainingAudiences.map((audience, index) => (
            <article key={audience.title} className={`min-w-0 border-b border-[var(--viridian-950)]/15 py-5 sm:border-b-0 sm:py-6 ${index > 0 ? 'sm:border-l sm:pl-6' : ''} ${index < 2 ? 'sm:pr-6' : ''}`}>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">{audience.title.toUpperCase()}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">{audience.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TalentTrainingCareers() {
  return (
    <section id="career-opportunities" className="scroll-mt-24 bg-[var(--cream)] py-16 sm:py-20">
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-6 border-b border-[var(--viridian-950)]/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">CAREER OPPORTUNITIES</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">Looking for your next opportunity?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Explore opportunities with JLUXE when positions are available.
            </p>
          </div>
          <Link href="#career-opportunities" className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--viridian-950)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:border-[var(--gold)] hover:text-[var(--viridian-800)]">
            View Careers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {talentOpportunities.length > 0 ? (
          <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {talentOpportunities.map((opportunity) => (
              <article key={opportunity.id} className="border border-[var(--viridian-950)]/10 bg-white p-6">
                <h3 className="font-display text-2xl text-[var(--viridian-950)]">{opportunity.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{opportunity.summary}</p>
                <Link href={opportunity.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--viridian-950)]">
                  View opportunity <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="pt-6 text-sm leading-6 text-[var(--muted)]">
            Current opportunities will appear here when available.
          </p>
        )}
      </div>
    </section>
  );
}

export function TalentTrainingCta() {
  return (
    <section className="bg-[var(--viridian-900)] py-16 text-white sm:py-20">
      <div className="container-xl flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{talentTrainingContact.heading}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">{talentTrainingContact.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={talentTrainingContact.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white">
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