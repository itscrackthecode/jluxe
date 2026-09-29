import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import RealEstateHero from '@/components/services/real-estate/real-estate-hero';
import {
  BuyerSellerSection,
  PropertyOpportunities,
  RealEstateCapabilities,
  RealEstateFinalCta,
} from '@/components/services/real-estate/real-estate-sections';

export const metadata: Metadata = {
  title: 'Real Estate | JLUXE',
  description: 'Explore real estate sales, property marketing and channel partnership support with JLUXE.',
};

export default function RealEstatePage() {
  return (
    <main className="text-[var(--viridian-950)]">
      <SiteHeader />
      <RealEstateHero />
      <RealEstateCapabilities />
      <BuyerSellerSection />
      <PropertyOpportunities />
      <RealEstateFinalCta />
      <SiteFooter />
    </main>
  );
}