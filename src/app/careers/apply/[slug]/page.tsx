import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import CareerApplicationForm from '@/components/careers/career-application-form';
import { careersBasePath, careersHref } from '@/lib/careers-navigation';
import { findPublicCareerJobBySlug } from '@/lib/db/queries/careers';

export const dynamic = 'force-dynamic';
type PageContext = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { slug } = await params;
  const job = await findPublicCareerJobBySlug(slug).catch(() => null);
  return { title: job ? `Apply: ${job.title}` : 'Apply for a position', robots: { index: false, follow: false } };
}

export default async function CareerApplyPage({ params }: PageContext) {
  const { slug } = await params;
  const job = await findPublicCareerJobBySlug(slug).catch(() => null);
  if (!job) notFound();
  const basePath = careersBasePath((await headers()).get('host'));

  return (
    <section className="mx-auto w-[min(900px,calc(100%-2rem))] py-12 sm:py-16">
      <Link href={careersHref(basePath, `/jobs/${job.slug}`)} className="text-sm font-semibold text-[#103D33] underline decoration-[#C5A46D] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Back to position</Link>
      <div className="mt-7 border-b border-[#103D33]/15 pb-7">
        <p className="text-sm font-semibold text-[#8a6a3c]">Application</p>
        <h1 className="mt-2 font-display text-4xl text-[#103D33] sm:text-5xl">Apply for {job.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52675f]">Complete the form below. Required fields are marked by the browser. Your resume is kept private and is available only to authorized JLUXE administrators.</p>
      </div>
      <div className="mt-8"><CareerApplicationForm jobSlug={job.slug} jobTitle={job.title} basePath={basePath} /></div>
    </section>
  );
}
