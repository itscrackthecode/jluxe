import { BriefcaseBusiness, GraduationCap, UserRoundSearch } from 'lucide-react';

const pillars = [
  {
    number: '01',
    title: 'Recruitment & Staffing',
    description: 'Finding the right people for the right roles. JLUXE works closely with organizations to understand business requirements, role expectations and organizational culture before identifying suitable candidates.',
    icon: UserRoundSearch,
    areas: ['Sales Recruitment', 'Real Estate Recruitment', 'HR & Administration', 'Customer Relationship Management', 'Finance & Accounts', 'Engineering & Project', 'Support Staff'],
  },
  {
    number: '02',
    title: 'Corporate Training',
    description: 'Developing People. Strengthening Organizations. Customized programs designed to improve employee capabilities, professional effectiveness and workplace performance.',
    icon: BriefcaseBusiness,
    areas: ['Sales & Negotiation Skills', 'Customer Relationship Management', 'Leadership Development', 'Communication Skills', 'Business Etiquette', 'Team Building', 'Time Management', 'Presentation Skills', 'Interview & Hiring Skills', 'HR & People Management', 'Real Estate Sales Training', 'CRM & Lead Management', 'Professional Behaviour', 'Workplace Communication'],
  },
  {
    number: '03',
    title: 'College Training & Counselling',
    description: 'Preparing Students for Careers and the Real World. JLUXE helps colleges and educational institutions build employability, confidence, communication and professional skills.',
    icon: GraduationCap,
    areas: ['Soft Skills Training', 'Communication Skills', 'Spoken English', 'Interview Skills', 'Group Discussion', 'Resume Building', 'Aptitude & Employability Skills', 'Corporate Etiquette', 'Personality Development', 'Leadership Skills', 'Team Building', 'Career Readiness', 'Sales & Customer Service Skills', 'Career Opportunities', 'Industry Expectations', 'Job Roles & Responsibilities', 'Skill Requirements', 'Career Pathways', 'Higher Education Opportunities', 'Interview Preparation', 'Employability Development'],
  },
];

export function TalentTrainingServices() {
  return (
    <section className="bg-[var(--viridian-950)] py-20 text-white sm:py-24" data-reveal>
      <div className="container-xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">RECRUITMENT &amp; TRAINING</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">What We Offer</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3" data-reveal-stagger>
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article key={pillar.number} data-reveal className="premium-card min-w-0 bg-[var(--viridian-950)] p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{pillar.number}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <h3 className="mt-9 font-display text-2xl leading-snug">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{pillar.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {pillar.areas.map((area) => (
                    <span key={area} className="border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs leading-tight text-white/70">{area}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
