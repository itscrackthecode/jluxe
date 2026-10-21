import Link from 'next/link';
import { headers } from 'next/headers';
import { careersBasePath, careersHref } from '@/lib/careers-navigation';

export const metadata = {
  title: 'Application received',
  robots: { index: false, follow: false },
};

export default async function ApplicationReceivedPage() {
  const basePath = careersBasePath((await headers()).get('host'));
  return (
    <section className="mx-auto flex min-h-[55vh] w-[min(760px,calc(100%-2rem))] flex-col justify-center py-14">
      <p className="text-sm font-semibold text-[#8a6a3c]">JLUXE Careers</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-[#103D33] sm:text-5xl">Thank you for your application.</h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-[#52675f]">Your application has been received. The JLUXE team can review your details and resume for the position.</p>
      <Link href={careersHref(basePath)} className="mt-8 inline-flex min-h-11 w-fit items-center border border-[#103D33]/30 px-5 text-sm font-semibold text-[#103D33] hover:bg-[#E9EEE9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Return to Careers</Link>
    </section>
  );
}
