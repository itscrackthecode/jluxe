import JluxeCtaLink from '@/components/jluxe-cta-link';

export default function RealEstateHero() {
  return (
    <section
      className="relative isolate min-h-[620px] overflow-hidden bg-[var(--viridian-950)] text-white sm:min-h-[680px]"
      style={{ backgroundImage: "url('/assets/images/real-estate.png')", backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,47,41,0.96)_0%,rgba(6,47,41,0.82)_42%,rgba(6,47,41,0.52)_74%,rgba(6,47,41,0.34)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(3,25,21,0.42)_100%)]" />
      <div className="container-xl relative z-10 flex min-h-[620px] items-center py-20 sm:min-h-[680px] lg:py-24">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">REAL ESTATE</p>
          <h1 className="mt-6 font-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
            Find the right space.<br />Make the right move.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            JLUXE connects buyers, sellers and trusted partners with relevant property opportunities and real estate support.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <JluxeCtaLink
              href="/properties"
              className="w-full justify-center sm:w-auto"
            >
              I&apos;m Looking to Buy
            </JluxeCtaLink>
            <JluxeCtaLink
              href="/contact/sell-property"
              className="w-full justify-center sm:w-auto"
            >
              I Want to Sell
            </JluxeCtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}