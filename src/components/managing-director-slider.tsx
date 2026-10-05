'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const slides = [
  {
    label: 'WHO HE IS',
    content: (
      <>
        <p className="font-display text-2xl leading-tight text-[var(--viridian-900)] sm:text-3xl">
          Building Businesses.
          <br />
          Developing People.
          <br />
          Creating Opportunities.
        </p>

        <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          Sarvesh Karthik N is a business professional and entrepreneur
          with experience across Real Estate, Sales & Marketing, Business
          Consulting, Recruitment, Training, Corporate Services and
          Education-focused initiatives.
        </p>
      </>
    ),
  },
  {
    label: 'LEADERSHIP APPROACH',
    content: (
      <>
        <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          As the Managing Director of JLUXE, Sarvesh brings together his
          experience in business development, customer engagement, sales,
          people management and professional training to create an
          integrated platform that connects properties, businesses,
          professionals, institutions and opportunities.
        </p>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          His approach combines entrepreneurial thinking with hands-on
          execution, with a focus on professionalism, transparency, trusted
          relationships and sustainable growth.
        </p>
      </>
    ),
  },
  {
    label: 'VISION',
    content: (
      <>
        <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          Under Sarvesh Karthik N&apos;s leadership, JLUXE aims to evolve into a
          trusted multi-service business platform that brings together
          people, businesses, properties, talent and opportunities.
        </p>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          The vision is to create meaningful connections, open pathways for
          growth and build relationships that create long-term value for
          individuals and businesses.
        </p>

        <div className="mt-8 border-t border-[var(--viridian-950)]/15 pt-6">
          <p className="font-display text-2xl tracking-[0.08em] text-[var(--viridian-950)] sm:text-3xl">
            CONNECT.
          </p>

          <p className="mt-1 font-display text-2xl tracking-[0.08em] text-[var(--viridian-950)] sm:text-3xl">
            CREATE.
          </p>

          <p className="mt-1 font-display text-2xl tracking-[0.08em] text-[var(--gold)] sm:text-3xl">
            GROW.
          </p>

          <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">
            Connecting the right people.
            <br />
            Creating the right opportunities.
            <br />
            Growing businesses and careers.
          </p>
        </div>
      </>
    ),
  },
];

export default function ManagingDirectorSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (current) => (current - 1 + slides.length) % slides.length,
    );
  };

  useLayoutEffect(() => {
    const activeSlide = slideRefs.current[currentSlide];

    if (activeSlide) {
      setContentHeight(activeSlide.offsetHeight);
    }
  }, [currentSlide]);

  useEffect(() => {
    const activeSlide = slideRefs.current[currentSlide];

    if (!activeSlide || typeof ResizeObserver === 'undefined') return;

    const updateHeight = () => {
      setContentHeight(activeSlide.offsetHeight);
    };

    const observer = new ResizeObserver(updateHeight);
    observer.observe(activeSlide);

    updateHeight();

    return () => observer.disconnect();
  }, [currentSlide]);

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">
        MEET OUR MANAGING DIRECTOR
      </p>

      <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">
        Sarvesh Karthik N
      </h2>

      <p className="mt-3 text-sm font-medium tracking-[0.08em] text-[var(--muted)]">
        Managing Director — JLUXE
      </p>

      <div
        className="relative mt-8 overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          height: contentHeight !== null ? `${contentHeight}px` : 'auto',
        }}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.label}
            ref={(element) => {
              slideRefs.current[index] = element;
            }}
            className="absolute left-0 top-0 w-full pr-1 transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
            }}
            aria-hidden={index !== currentSlide}
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">
              {slide.label}
            </p>

            <div className="mt-6">{slide.content}</div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--viridian-950)]/15 pt-5">
        <span
          className="text-xs font-medium tracking-[0.12em] text-[var(--muted)]"
          aria-live="polite"
        >
          {currentSlide + 1} / {slides.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous Managing Director content"
            className="touch-press flex h-11 w-11 items-center justify-center border border-[var(--viridian-950)]/15 bg-[var(--cream)] text-[var(--viridian-950)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Managing Director content"
            className="touch-press flex h-11 w-11 items-center justify-center border border-[var(--viridian-950)]/15 bg-[var(--cream)] text-[var(--viridian-950)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}