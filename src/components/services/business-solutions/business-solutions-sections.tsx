import {
  BriefcaseBusiness,
  CalendarDays,
  Landmark,
  Megaphone,
  Palette,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  businessSolutionsServices,
} from '@/lib/data';

const serviceIcons = [Megaphone, Palette, Target, TrendingUp, Landmark, CalendarDays];

export function BusinessSolutionsServices() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24" data-reveal>
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">BUSINESS SUPPORT</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
          </div>
          <BriefcaseBusiness aria-hidden="true" className="hidden h-7 w-7 text-[var(--gold)] md:block" strokeWidth={1.4} />
        </div>

        <div className="mt-10 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3" data-reveal-stagger>
          {businessSolutionsServices.map((service, index) => {
            const Icon = serviceIcons[index];

            return (
              <article key={service.number} data-reveal className="premium-card min-w-0 bg-[var(--viridian-950)] p-6 sm:p-7">
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

