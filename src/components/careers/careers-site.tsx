import Link from 'next/link';
import { careersHref } from '@/lib/careers-navigation';

export function CareersHeader({ basePath }: { basePath: string }) {
  return (
    <header className="border-b border-[#103D33]/10 bg-[#F7F4EC]">
      <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-2rem))] items-center justify-between gap-5">
        <Link href={careersHref(basePath)} aria-label="JLUXE Careers home" className="flex items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C5A46D]">
          <img src="/assets/images/jluxe-monogram.png" alt="" width={1312} height={1199} className="h-10 w-auto" />
          <span className="font-display text-[1.65rem] tracking-tight text-[#103D33]">JLUXE <span className="text-sm font-medium tracking-[0.14em] text-[#58736a]">CAREERS</span></span>
        </Link>
        <nav aria-label="Careers navigation" className="flex items-center gap-4 text-sm font-medium text-[#103D33] sm:gap-7">
          <Link className="rounded-sm hover:text-[#8a6a3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C5A46D]" href={careersHref(basePath, '/#positions')}>Open positions</Link>
          <a className="hidden rounded-sm hover:text-[#8a6a3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C5A46D] sm:inline" href="https://www.thejluxe.com/">JLUXE main site</a>
        </nav>
      </div>
    </header>
  );
}

export function CareersFooter({ basePath }: { basePath: string }) {
  return (
    <footer className="bg-[#103D33] text-white">
      <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-display text-2xl">JLUXE Careers</p>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">Explore current opportunities and contact our team with recruitment enquiries.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
          <Link className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]" href={careersHref(basePath)}>Careers home</Link>
          <a className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]" href="https://www.thejluxe.com/">Main website</a>
          <a className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]" href="mailto:enquiry@thejluxe.com">Recruitment enquiries</a>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} JLUXE. All rights reserved.</div>
    </footer>
  );
}
