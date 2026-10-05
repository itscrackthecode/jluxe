'use client';
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, House, ShoppingBag } from 'lucide-react';
import { services } from '@/lib/data';

const icons = [House, BriefcaseBusiness, GraduationCap, Building2, ShoppingBag];

export default function ServicesCarousel() {
  return (
    <section id="services" className="bg-[var(--cream)] py-24" data-reveal>
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[.25em] text-[var(--gold)]">OUR SERVICES</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">
              Different capabilities.<br />One JLUXE.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
            From property opportunities to business growth, people development and design, each service is built around a clear purpose.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>
          {services.slice(0, 4).map((s, i) => {
            const Icon = icons[i];

            return (
              <a
                key={s.title}
                href={s.href}
                data-reveal
                className="premium-card group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,58,51,0.94),rgba(6,47,41,0.96))] p-7 text-white shadow-[0_20px_40px_rgba(6,47,41,0.12)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(197,164,109,0.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.05),transparent_35%)]" />
                <div className="absolute -right-12 top-6 h-24 w-24 rounded-full bg-[var(--gold)]/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs tracking-[.2em] text-[var(--gold)]">{s.kicker}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-inner shadow-white/5">
                      <Icon className="h-5 w-5 text-[var(--gold)] transition-transform duration-300 group-hover:scale-105" strokeWidth={1.6} />
                    </div>
                  </div>

                  <div className="mt-24">
                    <h3 className="font-display text-3xl leading-none">{s.title}</h3>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-white/70">{s.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
