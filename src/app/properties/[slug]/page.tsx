import type { Metadata } from 'next';
import PropertyDetail from '@/components/property-detail';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { findPublishedPropertyBySlug } from '@/lib/db/queries/properties';

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await findPublishedPropertyBySlug(slug);
  if (!property) {
    return { title: 'Property Not Found', robots: { index: false, follow: false } };
  }

  return {
    title: property.title,
    description: property.description ?? 'Property opportunities represented by JLUXE and its partners.',
    alternates: { canonical: `/properties/${property.slug}` },
  };
}

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