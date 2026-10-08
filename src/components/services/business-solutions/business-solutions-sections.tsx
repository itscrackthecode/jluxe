'use client';

import { useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
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

const serviceItems: Record<string, string[]> = {
  'Marketing Solutions': [
    'Digital Marketing',
    'Social Media Marketing',
    'Property Marketing',
    'Campaign Planning',
    'Marketing Content',
    'Promotional Activities',
    'Event & Launch Support',
  ],
  'Branding Solutions': [
    'Brand Strategy',
    'Corporate Branding',
    'Marketing Content',
    'Campaign Support',
    'Event & Launch Support',
  ],
  'Lead Generation': [
    'Lead Generation Campaigns',
    'Customer Acquisition',
    'Lead Management',
    'Customer Enquiry Support',
    'Lead Follow-up',
    'Business Development',
  ],
  'Sales & Business Development': [
    'Sales Strategy & Planning',
    'Lead Management',
    'Sales Team Support',
    'Sales Process Development',
    'Customer Conversion',
    'Sales Pipeline Management',
    'Field Sales Support',
  ],
  'Banking Services': [
    'Banking Support',
    'Customer Acquisition',
    'Relationship Management',
    'Business Development Support',
    'Banking Process Training',
  ],
  'Event Management': [
    'Event & Launch Support',
    'Promotional Activities',
    'Event-Based Promotions',
    'Corporate Events',
  ],
};

function BusinessSolutionCard({
  service,
  Icon,
}: {
  service: (typeof businessSolutionsServices)[number];
  Icon: typeof Megaphone;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const isOpen = isHovered || isActivated;
  const panelId = `business-solution-${service.number}`;

  const toggle = () => setIsActivated((current) => !current);
  const close = () => {
    setIsHovered(false);
    setIsActivated(false);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    } else if (event.key === 'Escape') {
      close();
    }
  };
  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') setIsHovered(true);
  };
  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') setIsHovered(false);
  };
  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') toggle();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-controls={panelId}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className="premium-card min-w-0 cursor-pointer bg-[var(--viridian-950)] p-6 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)] sm:p-7"
      data-reveal
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{service.number}</span>
        <Icon aria-hidden="true" className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.5} />
      </div>
      <h3 className="mt-9 font-display text-2xl leading-snug">{service.title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">{service.description}</p>

      <div
        id={panelId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {serviceItems[service.title].map((item) => (
              <li key={item} className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs leading-tight text-white/75">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

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
              <BusinessSolutionCard key={service.number} service={service} Icon={Icon} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

