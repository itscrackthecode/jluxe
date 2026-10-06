import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import TalentTrainingHero from '@/components/services/talent-training/talent-training-hero';
import { TalentTrainingServices } from '@/components/services/talent-training/talent-training-sections';
import FaqSection, { type FaqItem } from '@/components/faq-section';
import { Instagram, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Recruitment & Training',
  description: 'Recruitment, staffing, training and career-focused services from JLUXE.',
};

export default function TalentTrainingPage() {
  const faqItems: FaqItem[] = [
    { question: 'What recruitment and staffing roles does JLUXE support?', answer: 'JLUXE supports organizations with recruitment and staffing requirements across suitable roles and business needs.' },
    { question: 'How does JLUXE understand an organization\'s hiring requirements?', answer: 'JLUXE works with organizations to understand their business requirements, role expectations and organizational context before identifying suitable candidates.' },
    { question: 'Can organizations approach JLUXE for specific staffing requirements?', answer: 'Yes. Organizations can approach JLUXE with a specific staffing requirement for discussion.' },
    { question: 'What corporate training programs does JLUXE provide?', answer: 'JLUXE provides customized corporate training focused on employee capabilities, professional effectiveness and workplace performance.' },
    { question: 'Can corporate training be customized for an organization\'s requirements?', answer: 'Yes. Corporate training can be discussed and shaped around the organization\'s requirements.' },
    { question: 'Which employee skills can be addressed through corporate training?', answer: 'Training may address sales, negotiation, communication, leadership, customer relationships, professional behaviour and other confirmed training areas.' },
    { question: 'What training programs does JLUXE provide for colleges?', answer: 'JLUXE supports colleges and educational institutions with soft skills, communication, interview, employability and career-readiness training.' },
    { question: 'What does career counselling cover?', answer: 'Career counselling covers opportunities, industry expectations, roles, skill requirements, pathways, higher education options and interview preparation.' },
    { question: 'Can colleges or educational institutions approach JLUXE directly?', answer: 'Yes. Colleges and educational institutions can contact JLUXE to discuss training and counselling requirements.' },
    { question: 'How can I discuss a Recruitment & Training requirement with JLUXE?', answer: 'Use the Enquire Now action above to open the existing JLUXE contact and enquiry flow.' },
  ];

  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <TalentTrainingHero />
      <TalentTrainingServices />
      <FaqSection eyebrow="RECRUITMENT & TRAINING FAQ" title="Questions, answered clearly." items={faqItems} />
      <section className="bg-[var(--sand)]/35 py-14 sm:py-16" data-reveal>
        <div className="container-xl flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">DIRECT CONTACT</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">Still have questions?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Talk to us directly through the configured JLUXE channels.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--viridian-950)]">
            <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]"><MessageCircle className="h-4 w-4 text-[var(--gold)]" /> WhatsApp</a>
            <a href={siteConfig.contact.instagram} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)]/60 pb-1 transition-colors hover:text-[var(--gold)]"><Instagram className="h-4 w-4 text-[var(--gold)]" /> Instagram</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}