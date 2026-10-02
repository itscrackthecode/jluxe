export type FallbackImageType = 'property' | 'portfolio' | 'service' | 'general';

export const fallbackImages: Record<FallbackImageType, string> = {
  property: '/assets/images/real-estate.png',
  portfolio: '/assets/images/jluxe-hero-bg.png',
  service: '/assets/images/business-solutions.png',
  general: '/assets/images/interiors-designs.png',
};

export function getFallbackImage(type: FallbackImageType = 'general') {
  return fallbackImages[type] ?? fallbackImages.general;
}

export function getMediaImageUrl(storageKey: string | null | undefined, fallbackType: FallbackImageType) {
  if (storageKey?.startsWith('/')) return storageKey;
  return getFallbackImage(fallbackType);
}
