import type { Metadata } from 'next';
import PropertyDetail from '@/components/property-detail';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: 'Property | JLUXE',
  description: 'Property opportunities represented by JLUXE and its partners.',
};

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  const { slug } = await params;

  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <PropertyDetail slug={slug} />
      <SiteFooter />
    </main>
  );
}