'use client';

import { useState } from 'react';
import { Building2, Handshake, Landmark, Megaphone } from 'lucide-react';

type Capability = {
  number: string;
  title: string;
  description: string;
};

type Props = {
  capability: Capability;
};

const capabilityIcons = [Building2, Megaphone, Handshake, Landmark];

const capabilityServices: Record<string, string[]> = {
  'Real Estate Sales': [
    'Property Sales & Marketing',
    'Lead Generation',
    'Customer Acquisition',
    'Project Promotion',
    'Sales Support',
    'Buyer & Seller Connect',
    'Plots',
    'Villas',
    'Apartments',
    'Commercial Properties',
  ],
  'Real Estate Marketing': [
    'Property Marketing',
    'Brand Strategy',
    'Digital Marketing',
    'Social Media Marketing',
    'Campaign Planning',
    'Lead Generation Campaigns',
    'Marketing Content',
    'Promotional Activities',
    'Corporate Branding',
    'Event & Launch Support',
  ],
  'Channel Partner': [
    'Real Estate Channel Partner Services',
    'Property Sales & Marketing',
    'Lead Generation',
    'Customer Acquisition',
    'Project Promotion',
    'Channel Network Development',
    'Sales Support',
    'Buyer & Seller Connect',
    'Corporate & Institutional Business Development',
  ],
};

const crmServices = [
  'Customer Relationship Management',
  'Lead Management',
  'Collection Strategy & Achievement',
  'Lead Follow-up Techniques',
  'Customer Communication',
  'Sales Pipeline Management',
  'CRM Reporting',
  'Customer Retention',
  'Complaint & Escalation Management',
  'Post-Sales Customer Service',
  'CRM Team Performance',
];

const bankingServices = [
  'Banking Support',
  'Customer Acquisition',
  'Relationship Management',
  'Business Development Support',
  'Banking Process Training',
];

function ServiceChips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap content-start gap-1.5">
      {items.map((item) => (
        <li key={item} className="max-w-full">
          <span className="inline-flex max-w-full whitespace-normal break-words rounded-md border border-white/15 bg-white/[0.035] px-2.5 py-1 text-[11px] leading-4 text-white/75">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function RealEstateCapabilityCard({ capability }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const isCrmAndBanking = capability.title === 'Banking Services';
  const title = isCrmAndBanking ? 'CRM & Banking Services' : capability.title;
  const Icon = capabilityIcons[Number(capability.number) - 1] ?? Building2;
  const serviceItems = isCrmAndBanking
    ? [...crmServices, ...bankingServices]
    : capabilityServices[capability.title] ?? [];
  const isFlipped = isHovered || isActivated;

  const activate = () => setIsActivated((current) => !current);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    } else if (event.key === 'Escape') {
      setIsHovered(false);
      setIsActivated(false);
    }
  };

  return (
    <article
      data-reveal
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={isFlipped
        ? `${title}. Services: ${serviceItems.join(', ')}`
        : `${capability.number}. ${title}. ${capability.description} Hover or activate to view services.`}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setIsHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') setIsHovered(false); }}
      onPointerUp={(event) => { if (event.pointerType === 'touch') activate(); }}
      onClick={(event) => { if (event.detail === 0) activate(); }}
      onKeyDown={handleKeyDown}
      className="premium-card relative h-full min-w-0 cursor-pointer overflow-hidden border border-white/15 bg-white/[0.035] text-left text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative h-full [transform-style:preserve-3d] transition-transform duration-700 motion-reduce:transition-none"
        style={{ transform: isFlipped ? 'rotateY(180deg)' : undefined }}
      >
        <div
          aria-hidden={isFlipped}
          inert={isFlipped}
          className="absolute inset-0 flex h-full flex-col p-6 [backface-visibility:hidden] sm:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{capability.number}</span>
            <Icon aria-hidden="true" className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h3 className="mt-8 font-display text-2xl leading-tight">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/65">{capability.description}</p>
          <p className="mt-auto flex items-center gap-2 pt-5 text-[11px] font-medium tracking-wide text-white/55">
            <span>Hover or tap to explore</span>
            <span aria-hidden="true" className="text-[var(--gold)]">↗</span>
          </p>
        </div>

        <div
          aria-hidden={!isFlipped}
          inert={!isFlipped}
          className="absolute inset-0 flex h-full min-h-0 flex-col p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6"
        >
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/15 pb-3">
            <h3 className="font-display text-lg leading-tight">{title}</h3>
            <span aria-hidden="true" className="shrink-0 text-lg leading-none text-[var(--gold)]">↶</span>
          </div>
          <div className={`min-h-0 flex-1 ${isCrmAndBanking ? 'real-estate-capability-scroll overflow-y-auto overscroll-contain pr-1' : 'overflow-hidden'}`}>
            {isCrmAndBanking ? (
              <>
                <h4 className="text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">CRM</h4>
                <ServiceChips items={crmServices} />
                <h4 className="mt-3 border-t border-white/15 pt-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">BANKING</h4>
                <ServiceChips items={bankingServices} />
              </>
            ) : (
              <ServiceChips items={serviceItems} />
            )}
          </div>
          <p className="mt-2 shrink-0 pt-1 text-[10px] text-white/45">Tap or press Enter to return</p>
        </div>
      </div>
    </article>
  );
}
