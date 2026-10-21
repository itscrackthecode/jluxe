import type { Metadata } from 'next';
import { headers } from 'next/headers';
import CareersJobList from '@/components/careers/careers-job-list';
import { listPublicCareerJobs } from '@/lib/db/queries/careers';
import { careersBasePath } from '@/lib/careers-navigation';
import type { CareerJob } from '@/lib/career-types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Careers and open positions',
  description: 'Find your next opportunity and explore current roles at JLUXE.',
  alternates: { canonical: 'https://careers.thejluxe.com/' },
};

export default async function CareersHomePage() {
  const host = (await headers()).get('host');
  const basePath = careersBasePath(host);
  let jobs: CareerJob[] = [];
  let unavailable = false;
  try {
    jobs = await listPublicCareerJobs();
  } catch (error) {
    unavailable = true;
    console.error('Careers vacancies are unavailable.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#103D33] text-white">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[48%] border-l border-[#C5A46D]/20 bg-[#0b332b]" />
        <div className="mx-auto grid min-h-[560px] w-[min(1180px,calc(100%-2rem))] items-center gap-12 py-20 md:grid-cols-[minmax(0,1.25fr)_minmax(250px,.55fr)] md:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#d8c39e]">Careers at JLUXE</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.65rem]">Find your next opportunity. Grow with JLUXE.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">Bring your experience, curiosity and care to work that connects people with opportunities across JLUXE.</p>
            <a href="#positions" className="mt-9 inline-flex min-h-12 items-center border border-[#C5A46D] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#C5A46D] hover:text-[#103D33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7F4EC]">Explore open positions</a>
          </div>
          <div className="hidden border-l border-[#C5A46D]/50 py-5 pl-8 md:block">
            <p className="max-w-xs font-display text-2xl leading-snug text-[#f7f4ec]">A place for focused work, thoughtful communication and steady follow-through.</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">Explore current roles in customer engagement and digital marketing.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-16 sm:py-20 md:grid-cols-[.65fr_1fr] md:gap-20">
        <div>
          <p className="text-sm font-semibold text-[#8a6a3c]">Work with purpose</p>
          <h2 className="mt-3 max-w-sm font-display text-3xl leading-tight sm:text-4xl">Many kinds of work. One connected team.</h2>
        </div>
        <div className="space-y-4 text-[15px] leading-7 text-[#405b51]">
          <p>JLUXE works across real estate, recruitment and staffing, business solutions, and training and consulting. Each opportunity calls for care in how we communicate, coordinate and serve people.</p>
          <p>We share roles when they are open and ready for applications. Review each description for the responsibilities and qualifications before applying.</p>
        </div>
      </section>

      <section id="positions" className="scroll-mt-10 bg-[#E9EEE9] py-16 sm:py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-2rem))]">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#8a6a3c]">Current opportunities</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Open positions</h2>
            </div>
            {jobs.length > 0 ? <p className="text-sm text-[#50675d]">{jobs.length} {jobs.length === 1 ? 'position' : 'positions'}</p> : null}
          </div>
          {unavailable ? (
            <div className="border-y border-[#103D33]/15 py-9 text-sm leading-6 text-[#52675f]">Positions are temporarily unavailable. Please contact <a className="font-semibold text-[#103D33] underline decoration-[#C5A46D] underline-offset-4" href="mailto:enquiry@thejluxe.com">enquiry@thejluxe.com</a> for recruitment enquiries.</div>
          ) : <CareersJobList jobs={jobs} basePath={basePath} />}
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-16 sm:py-20 md:grid-cols-[.65fr_1fr] md:gap-20">
        <div>
          <p className="text-sm font-semibold text-[#8a6a3c]">Why join</p>
          <h2 className="mt-3 max-w-sm font-display text-3xl leading-tight sm:text-4xl">Make your work count.</h2>
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <article className="border-t border-[#103D33]/25 pt-4">
            <h3 className="font-semibold">Stay close to the work</h3>
            <p className="mt-2 text-sm leading-6 text-[#52675f]">Each role describes the work, skills and experience needed so you can make an informed application.</p>
          </article>
          <article className="border-t border-[#103D33]/25 pt-4">
            <h3 className="font-semibold">Bring your perspective</h3>
            <p className="mt-2 text-sm leading-6 text-[#52675f]">JLUXE opportunities connect practical work with people, customers and organisations.</p>
          </article>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-col gap-4 border-l-2 border-[#C5A46D] pl-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pl-7">
          <div>
            <h2 className="font-display text-2xl text-[#103D33]">Recruitment enquiry?</h2>
            <p className="mt-1 text-sm text-[#52675f]">Contact the JLUXE team for recruitment-related enquiries.</p>
          </div>
          <a href="mailto:enquiry@thejluxe.com" className="inline-flex min-h-11 w-fit items-center bg-[#103D33] px-5 text-sm font-semibold text-white hover:bg-[#0a3028] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Email JLUXE</a>
        </div>
      </section>
    </>
  );
}
