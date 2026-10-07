'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import MediaGallerySlider, { type GalleryImage } from '@/components/media-gallery-slider';

export default function PropertyImageGallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openIndex]);

  return (
    <>
      <MediaGallerySlider
        images={images}
        fallbackType="property"
        aspectRatioClassName="aspect-[4/3] sm:aspect-[16/10]"
        showThumbnails={false}
        imageFit="smart"
        imageBackgroundClassName="bg-[var(--cream)]"
        touchControls
        onImageClick={images.length > 0 ? setOpenIndex : undefined}
      />
      {openIndex !== null && <div role="dialog" aria-modal="true" aria-label="Property photo gallery" onClick={() => setOpenIndex(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--viridian-950)]/95 p-4 sm:p-8">
        <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => setOpenIndex(null)} aria-label="Close gallery" className="absolute -top-12 right-0 z-10 inline-flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] motion-reduce:transition-none"><X className="h-5 w-5" /></button>
          <MediaGallerySlider
            key={openIndex}
            images={images}
            fallbackType="property"
            initialIndex={openIndex}
            aspectRatioClassName="aspect-[4/3] max-h-[66vh] sm:aspect-[16/10]"
            showThumbnails={false}
            imageFit="smart"
            imageBackgroundClassName="bg-[var(--cream)]"
            touchControls
          />
        </div>
      </div>}
    </>
  );
}
