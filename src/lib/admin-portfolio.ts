import { z } from 'zod';
import { publicationStatuses } from '@/lib/db/types';

const optionalLocation = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(255).nullable().optional().transform((value) => value ?? null),
);

const optionalYear = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.coerce.number().int().min(1).max(32767).nullable().optional().transform((value) => value ?? null),
);

export const adminPortfolioSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  serviceId: z.string().uuid(),
  description: z.string().trim().min(1),
  location: optionalLocation,
  year: optionalYear,
  featured: z.boolean(),
  publicationStatus: z.enum(publicationStatuses),
}).strict();

export function createPortfolioSlug(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
    .replace(/-$/g, '');
}