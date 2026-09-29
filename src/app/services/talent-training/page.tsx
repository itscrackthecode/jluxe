import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import TalentTrainingHero from '@/components/services/talent-training/talent-training-hero';
import {
  TalentTrainingAudience,
  TalentTrainingCareers,
  TalentTrainingCta,
  TalentTrainingServices,
} from '@/components/services/talent-training/talent-training-sections';

export const metadata: Metadata = {
  title: 'Talent & Training | JLUXE',
  description: 'Recruitment, staffing, training and career-focused services from JLUXE.',
};

export default function TalentTrainingPage() {
  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <TalentTrainingHero />
      <TalentTrainingServices />
      <TalentTrainingAudience />
      <TalentTrainingCareers />
      <TalentTrainingCta />
      <SiteFooter />
    </main>
  );
}