import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import BusinessSolutionsHero from '@/components/services/business-solutions/business-solutions-hero';
import {
  BusinessSolutionsAudience,
  BusinessSolutionsCta,
  BusinessSolutionsServices,
} from '@/components/services/business-solutions/business-solutions-sections';

export const metadata: Metadata = {
  title: 'Business Solutions | JLUXE',
  description: 'Marketing, branding, lead generation, sales and business development support from JLUXE.',
};

export default function BusinessSolutionsPage() {
  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <BusinessSolutionsHero />
      <BusinessSolutionsServices />
      <BusinessSolutionsAudience />
      <BusinessSolutionsCta />
      <SiteFooter />
    </main>
  );
}