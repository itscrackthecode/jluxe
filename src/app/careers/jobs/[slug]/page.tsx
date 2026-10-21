import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { careersHref } from '@/lib/careers-navigation';
import { careersBasePath } from '@/lib/careers-navigation';
import { findPublicCareerJobBySlug } from '@/lib/db/queries/careers';

export const dynamic = 'force-dynamic';
type PageContext = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { slug } = await params;
  const job = await findPublicCareerJobBySlug(slug).catch(() => null);
  if (!job) return { title: 'Position not found' };
  return {
    title: job.title,
    description: job.summary,
    alternates: { canonical: `https://careers.thejluxe.com/jobs/${job.slug}` },
    openGraph: { title: `${job.title} | JLUXE Careers`, description: job.summary, url: `https://careers.thejluxe.com/jobs/${job.slug}` },
  };
}

function experienceLabel(minimum: number, maximum: number) {
  if (minimum === 0 && maximum === 0) return 'Experience not specified';
  return minimum === maximum ? `${minimum} ${minimum === 1 ? 'year' : 'years'}` : `${minimum}–${maximum} years`;
}

export default async function CareerJobDetailPage({ params }: PageContext) {
  const { slug } = await params;
  const job = await findPublicCareerJobBySlug(slug).catch(() => null);
  if (!job) notFound();
  const basePath = careersBasePath((await headers()).get('host'));
  const employmentType = job.employmentType.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <article className="mx-auto w-[min(1000px,calc(100%-2rem))] py-12 sm:py-16">
      <Link href={careersHref(basePath, '/#positions')} className="text-sm font-semibold text-[#103D33] underline decoration-[#C5A46D] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">All open positions</Link>
      <header className="mt-8 border-b border-[#103D33]/15 pb-8 sm:pb-10">
        <p className="text-sm font-semibold text-[#8a6a3c]">{job.department}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-[#103D33] sm:text-5xl">{job.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#496259]">{job.summary}</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#52675f]">
          <li>{job.openings} {job.openings === 1 ? 'opening' : 'openings'}</li>
          <li>{experienceLabel(job.experienceMinYears, job.experienceMaxYears)}</li>
          <li>{employmentType}</li>
          {job.location ? <li>{job.location}</li> : null}
          {job.workArrangement ? <li>{job.workArrangement}</li> : null}
          {job.salaryRange ? <li>{job.salaryRange}</li> : null}
          {job.deadline ? <li>Apply by {job.deadline}</li> : null}
        </ul>
        <Link href={careersHref(basePath, `/apply/${job.slug}`)} className="mt-7 inline-flex min-h-12 items-center bg-[#103D33] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a3028] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Apply now</Link>
      </header>

      <div className="grid gap-10 py-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_250px] md:gap-16">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl text-[#103D33]">About the role</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#496259]">{job.description}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-[#103D33]">Responsibilities</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#496259]">{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h2 className="font-display text-2xl text-[#103D33]">Qualifications</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#496259]">{job.qualifications.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>
        <aside className="h-fit border-t border-[#C5A46D] bg-[#E9EEE9] p-5 sm:p-6">
          <h2 className="font-display text-xl text-[#103D33]">Interested?</h2>
          <p className="mt-2 text-sm leading-6 text-[#52675f]">Share your experience and resume through the application form.</p>
          <Link href={careersHref(basePath, `/apply/${job.slug}`)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center bg-[#103D33] px-4 text-sm font-semibold text-white hover:bg-[#0a3028] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Apply for this role</Link>
        </aside>
      </div>
    </article>
  );
}
