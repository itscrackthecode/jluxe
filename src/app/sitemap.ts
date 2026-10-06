import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/data';
import { listPublicPortfolio } from '@/lib/db/queries/portfolio';
import { listPublicProperties } from '@/lib/db/queries/properties';

export const dynamic = 'force-dynamic';

const url = (path: string) => `${siteConfig.url}${path}`;

const staticPages: MetadataRoute.Sitemap = [
  { url: url('/'), changeFrequency: 'weekly', priority: 1 },
  { url: url('/about'), changeFrequency: 'monthly', priority: 0.8 },
  { url: url('/about/leadership'), changeFrequency: 'monthly', priority: 0.6 },
  { url: url('/contact'), changeFrequency: 'monthly', priority: 0.7 },
  { url: url('/contact/sell-property'), changeFrequency: 'monthly', priority: 0.5 },
  { url: url('/properties'), changeFrequency: 'daily', priority: 0.9 },
  { url: url('/our-work'), changeFrequency: 'weekly', priority: 0.9 },
  { url: url('/services/real-estate'), changeFrequency: 'monthly', priority: 0.8 },
  { url: url('/services/business-solutions'), changeFrequency: 'monthly', priority: 0.8 },
  { url: url('/services/talent-training'), changeFrequency: 'monthly', priority: 0.8 },
  { url: url('/services/interiors-design'), changeFrequency: 'monthly', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, portfolio] = await Promise.all([
    listPublicProperties({ sort: 'latest', limit: 1000, offset: 0 }),
    listPublicPortfolio({ sort: 'latest', limit: 1000, offset: 0 }),
  ]);

  return [
    ...staticPages,
    ...properties.data.map((property) => ({
      url: url(`/properties/${property.slug}`),
      lastModified: new Date(property.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...portfolio.data.map((work) => ({
      url: url(`/our-work/${work.slug}`),
      lastModified: new Date(work.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
