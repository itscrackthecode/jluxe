import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';

export default function RealEstateHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--viridian-950)] text-white">
      <div className="container-xl grid min-h-[600px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">REAL ESTATE</p>
          <h1 className="mt-6 font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
            Find the right space.<br />Make the right move.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            JLUXE connects buyers, sellers and trusted partners with relevant property opportunities and real estate support.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="#buyer-seller"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-white"
            >
              I&apos;m Looking to Buy
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#buyer-seller"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              I Want to Sell
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="relative mx-auto hidden aspect-[1.15/1] w-full max-w-[520px] lg:block">
          <div className="absolute inset-[5%_3%_8%_10%] border border-white/20" />
          <div className="absolute inset-[14%_12%_17%_19%] border border-[var(--gold)]/50" />
          <div className="absolute bottom-[17%] left-[19%] right-[12%] top-1/2 border-y border-white/20" />
          <div className="absolute bottom-[17%] left-1/2 top-[14%] border-l border-white/20" />
          <div className="absolute bottom-[17%] right-[29%] top-[14%] border-l border-white/20" />
          <div className="absolute left-[19%] top-[28%] h-[16%] w-[18%] border border-white/25" />
          <div className="absolute bottom-[17%] right-[12%] h-[18%] w-[24%] border-l border-t border-white/25" />
          <div className="absolute bottom-[2%] left-[10%] flex items-center gap-3 text-[10px] font-medium tracking-[0.2em] text-white/55">
            <ArrowDown className="h-3.5 w-3.5 text-[var(--gold)]" />
            BUYERS / SELLERS / PARTNERS
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 -z-0 h-full w-[42%] border-l border-white/[0.06]" />
    </section>
  );
}