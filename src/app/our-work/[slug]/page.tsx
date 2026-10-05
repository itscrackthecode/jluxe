import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorkDetail from '@/components/work-detail';

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: 'Our Work | JLUXE',
  description: 'Selected work, projects and capabilities across the JLUXE ecosystem.',
};

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
