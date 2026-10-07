'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaImageUrl, type FallbackImageType } from '@/lib/media';

export type GalleryImage = {
  id: string;
  storageKey: string;
  altText: string | null;
};

type MediaGallerySliderProps = {
  images: GalleryImage[];
  fallbackType: FallbackImageType;
  aspectRatioClassName?: string;
};

export default function MediaGallerySlider({
  images,
  fallbackType,
  aspectRatioClassName = 'aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9]',
}: MediaGallerySliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const total = images.length;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || total <= 1) return;
    const threshold = 40; // minimum pixels moved to trigger slide
    if (touchDeltaX.current < -threshold) {
      goToNext();
    } else if (touchDeltaX.current > threshold) {
      goToPrev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  // Reset index if images length changes
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, total]);

  if (total === 0) {
    return (
      <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--sand)] text-sm text-[var(--muted)] ${aspectRatioClassName}`}>
        <img
          src={getMediaImageUrl(null, fallbackType)}
          alt="JLUXE placeholder"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (total === 1) {
    const single = images[0];
    return (
      <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--sand)] text-sm text-[var(--muted)] ${aspectRatioClassName}`}>
        <img
          src={getMediaImageUrl(single.storageKey, fallbackType)}
          alt={single.altText ?? 'JLUXE image'}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getMediaImageUrl(null, fallbackType);
          }}
        />
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Image gallery"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      className="group relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2"
    >
      {/* Main image viewport */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--sand)] text-sm text-[var(--muted)] ${aspectRatioClassName}`}
      >
        <img
          key={currentImage.id}
          src={getMediaImageUrl(currentImage.storageKey, fallbackType)}
          alt={currentImage.altText ?? `Gallery image ${currentIndex + 1} of ${total}`}
          className="h-full w-full object-cover transition-opacity duration-300 ease-out"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getMediaImageUrl(null, fallbackType);
          }}
        />

        {/* Counter Pill */}
        <div className="absolute right-4 top-4 z-10 rounded-full bg-[var(--viridian-950)]/75 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
          {currentIndex + 1} / {total}
        </div>

        {/* Previous Button */}
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--viridian-950)]/80 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--viridian-900)] hover:scale-105 active:scale-95 sm:h-12 sm:w-12 sm:opacity-90 sm:group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next image"
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--viridian-950)]/80 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--viridian-900)] hover:scale-105 active:scale-95 sm:h-12 sm:w-12 sm:opacity-90 sm:group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Thumbnails / Indicators */}
      <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto py-1">
        {images.map((image, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={isActive}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all sm:h-14 sm:w-20 ${
                isActive
                  ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/30 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={getMediaImageUrl(image.storageKey, fallbackType)}
                alt={image.altText ?? `Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getMediaImageUrl(null, fallbackType);
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
