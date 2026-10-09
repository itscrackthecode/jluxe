import TrainingCategoryCard, {
  type TrainingCategory,
} from '@/components/services/talent-training/training-category-card';

type TrainingSection = {
  number: string;
  title: string;
  description: string;
  categories: TrainingCategory[];
};

const sections: TrainingSection[] = [
  {
    number: '01',
    title: 'Recruitment & Staffing',
    description: 'Connecting businesses with the right talent and flexible workforce solutions.',
    categories: [
      {
        title: 'Recruitment',
        description: 'Finding the right talent for the right opportunity.',
        items: [
          'Permanent Recruitment',
          'Executive Search',
          'Sales Recruitment',
          'CRM & Banking Recruitment',
          'Customer Relationship Management',
          'Real Estate Recruitment',
          'Corporate & HR Recruitment',
          'HR & Administration',
          'Finance & Accounts',
          'Engineering & Project',
        ],
      },
      {
        title: 'Staffing',
        description: 'Flexible workforce solutions for evolving business requirements.',
        items: [
          'Contract & Temporary Staffing',
          'Sales & Field Workforce',
          'CRM & Customer Teams',
          'Banking & Real Estate Teams',
          'Support & Project Staffing',
          'Support Staff',
        ],
      },
    ],
  },
  {
    number: '02',
    title: 'Corporate Training',
    description: 'Practical training programs designed around organizational needs, employee capabilities and business goals.',
    categories: [
      {
        title: 'Sales & Negotiation',
        description: 'Build confidence and capability across the customer conversation.',
        items: ['Sales Skills', 'Negotiation', 'Closing', 'Lead Conversion', 'Customer Handling'],
      },
      {
        title: 'CRM',
        description: 'Strengthen customer relationships and everyday team practices.',
        items: ['Customer Experience', 'Lead Management', 'Follow-up', 'Retention'],
      },
      {
        title: 'Leadership',
        description: 'Support capable teams through clear, confident leadership.',
        items: ['Team Management', 'Leadership', 'Decision Making', 'Performance Management'],
      },
      {
        title: 'Professional Skills',
        description: 'Develop practical skills for effective, professional workplaces.',
        items: ['Business Communication', 'Presentation Skills', 'Time Management', 'Workplace Etiquette', 'Team Building'],
      },
    ],
  },
  {
    number: '03',
    title: 'College & Institutional Training',
    description: 'Preparing students with the skills, confidence and industry awareness needed to transition from campus to career.',
    categories: [
      {
        title: 'Soft Skills',
        description: 'Build communication, confidence and professional presence.',
        items: [
          'Communication',
          'Spoken English',
          'Personality Development',
          'Presentation & Public Speaking',
          'Interview Skills',
          'Professional Etiquette',
        ],
      },
      {
        title: 'Technical Skills',
        description: 'Explore practical training across core engineering and technology fields.',
        items: [
          { field: 'CSE & IT', examples: 'Java · Python · Full Stack Development' },
          { field: 'AI & Data', examples: 'Machine Learning · Data Analytics · Generative AI' },
          { field: 'ECE', examples: 'Embedded Systems · IoT · VLSI' },
          { field: 'EEE', examples: 'Power Systems · PLC · Renewable Energy' },
          { field: 'Mechanical', examples: 'AutoCAD · SolidWorks · CAD/CAM' },
          { field: 'Civil', examples: 'AutoCAD · Revit · STAAD.Pro' },
        ],
      },
      {
        title: 'Career & Placement',
        description: 'Help students prepare for the transition from campus to career.',
        items: [
          'Aptitude',
          'Interview Preparation',
          'Resume Building',
          'Group Discussion',
          'Career Guidance',
          'Placement Readiness',
        ],
      },
    ],
  },
];

function TrainingSection({ section, isFirst }: { section: TrainingSection; isFirst: boolean }) {
  const headingId = `training-section-${section.number}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`bg-[var(--viridian-950)] py-12 text-white sm:py-16 ${isFirst ? '' : 'border-t border-white/10'}`}
      data-reveal
    >
      <div className="container-xl grid items-center gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 xl:gap-16">
        <div className="h-fit border border-white/15 bg-white/[0.04] p-6 sm:p-7">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">{section.number}</p>
          <h2 id={headingId} className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
            {section.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">{section.description}</p>
        </div>

        <div className="grid content-start gap-3" data-reveal-stagger>
          {section.categories.map((category) => (
            <TrainingCategoryCard key={category.title} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TalentTrainingServices() {
  return (
    <div>
      {sections.map((section, index) => (
        <TrainingSection key={section.number} section={section} isFirst={index === 0} />
      ))}
    </div>
  );
}
