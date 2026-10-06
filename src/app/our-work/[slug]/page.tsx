import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorkDetail from '@/components/work-detail';
import { findPublishedPortfolioBySlug } from '@/lib/db/queries/portfolio';

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const work = await findPublishedPortfolioBySlug(slug);
  if (!work) {
    return { title: 'Work Not Found', robots: { index: false, follow: false } };
  }

  return {
    title: work.title,
    description: work.description ?? 'Selected work, projects and capabilities across the JLUXE ecosystem.',
    alternates: { canonical: `/our-work/${work.slug}` },
  };
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const { slug } = await params;

  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <WorkDetail slug={slug} />
      <SiteFooter />
    </main>
  );
}
