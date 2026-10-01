import { z } from 'zod';
import { publicationStatuses } from '@/lib/db/types';

export const adminServiceSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().nullable().optional().transform((value) => value ?? null),
  publicationStatus: z.enum(publicationStatuses),
  sortOrder: z.number().int().min(0).max(2_147_483_647),
}).strict();

export type AdminServiceInput = z.infer<typeof adminServiceSchema>;

export function createServiceSlug(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
    .replace(/-$/g, '');
}