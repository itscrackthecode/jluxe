'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { heroSlides } from '@/lib/data';
import JluxeCtaLink from '@/components/jluxe-cta-link';

const themes: Record<string, string> = {
  land: 'linear-gradient(115deg,#042e28 0%,#0b4b40 42%,#496a59 70%,#c4a56e 100%)',
  business: 'linear-gradient(115deg,#062e29 0%,#123f39 45%,#50675e 70%,#c9ad7c 100%)',
  training: 'linear-gradient(115deg,#082f2a 0%,#174e45 42%,#6c776b 70%,#d1bc95 100%)',
  interior: 'linear-gradient(115deg,#062e29 0%,#234c43 45%,#8b7c69 75%,#dfcfb2 100%)',
  boutique: 'linear-gradient(115deg,#062f29 0%,#0b463d 50%,#174f44 100%)',
};

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const slide = heroSlides[index];
  const displayIndex = index === 0 ? null : index;
  const displayNumber = displayIndex === null ? null : String(displayIndex).padStart(2, '0');
  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroSlides.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [isPaused, index]);

  useEffect(() => {
    heroSlides.forEach((heroSlide) => {
      const image = new Image();
      image.src = heroSlide.backgroundImage;
    });
  }, []);

  const move = (dir: number) => {
    setIndex((current) => (current + dir + heroSlides.length) % heroSlides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX === null) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      move(deltaX < 0 ? 1 : -1);
    }

    setTouchStartX(null);
  };

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="hero-viewport relative min-h-[640px] overflow-hidden text-white sm:min-h-[720px]"
      style={{ background: themes[slide.theme] }}
    >
      <div
        key={slide.backgroundImage}
        aria-hidden="true"
        className="hero-background hero-background-blend hero-background-transition absolute inset-0"
        style={{ backgroundImage: `url("${slide.backgroundImage}")` }}
      />
      <div aria-hidden="true" className="hero-brand-wash absolute inset-0" />
      <div aria-hidden="true" className="hero-vignette absolute inset-0" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,22,19,0.18),rgba(3,22,19,0.32))]" />
      <div className="absolute inset-0 opacity-60 foliage" />
      <div className="absolute -right-24 top-20 h-[420px] w-[420px] rounded-full border border-white/10" />
      <div className="absolute right-[8%] top-[22%] hidden h-48 w-48 rounded-full border border-[var(--gold)]/30 lg:block" />

      <div className="hero-viewport-inner container-xl relative z-10 flex min-h-[640px] flex-col justify-end py-16 sm:min-h-[720px]">
        <div className="flex max-w-3xl items-start gap-4 pb-8">
          <div key={slide.title} className="hero-copy flex-1">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] text-[var(--gold)]">
            {displayNumber ? (
              <>
              <span>{displayNumber}</span>
              <span className="h-px w-16 bg-[var(--gold)]/70" />
              </>
            ) : null}
              <span>{slide.eyebrow}</span>
            </div>
            <h1 key={slide.title} className="mt-6 max-w-2xl font-display text-4xl leading-[0.96] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">{slide.body}</p>
            <JluxeCtaLink
              href={slide.href}
              className="mt-8 sm:min-w-[240px]"
            >
              {slide.cta}
            </JluxeCtaLink>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/15 pt-6">
          <div className="flex w-full items-center gap-3">
            <div className="relative flex w-full max-w-[220px] items-center gap-1 overflow-hidden rounded-full">
              <div className="h-px w-full bg-white/20" />
              <div
                className="absolute left-0 h-px bg-[var(--gold)] transition-all duration-500 ease-linear"
                style={{ width: `${((index + 1) / heroSlides.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((current) => !current)}
              aria-label={isPaused ? 'Resume carousel' : 'Pause carousel'}
              className="touch-press rounded-full border border-white/20 bg-white/5 p-3 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => move(-1)} aria-label="Previous slide" className="touch-press rounded-full border border-white/20 p-3 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next slide" className="touch-press rounded-full border border-white/20 p-3 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

