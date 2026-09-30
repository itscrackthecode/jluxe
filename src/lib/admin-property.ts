import { z } from 'zod';
import { PlotSizeUnit, PriceMode, PropertyStatus, PropertyType, PublicationStatus, RepresentationType } from '@/generated/prisma/enums';

const decimalPattern = /^\d+(?:\.\d{1,2})?$/;

const optionalDecimal = (maxIntegerDigits: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maxIntegerDigits + 3).nullable().optional().transform((value) => value ?? null).refine(
    (value) => value === null || (decimalPattern.test(value) && value.split('.')[0].length <= maxIntegerDigits),
  ),
);

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maxLength).nullable().optional().transform((value) => value ?? null),
);

export const adminPropertySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  ),
  description: optionalText(20_000),
  location: optionalText(255),
  propertyType: z.enum(PropertyType),
  priceAmount: optionalDecimal(12),
  priceCurrency: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().regex(/^[A-Z]{3}$/).nullable().optional().transform((value) => value ?? null),
  ),
  priceMode: z.enum(PriceMode),
  plotSize: optionalDecimal(10),
  plotSizeUnit: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.enum(PlotSizeUnit).nullable().optional().transform((value) => value ?? null),
  ),
  status: z.enum(PropertyStatus),
  representationType: z.enum(RepresentationType),
  publicationStatus: z.enum(PublicationStatus),
}).strict().superRefine((value, context) => {
  if ((value.priceAmount === null) !== (value.priceCurrency === null)) {
    context.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Price amount and currency must be provided together.' });
  }
  if ((value.plotSize === null) !== (value.plotSizeUnit === null)) {
    context.addIssue({ code: 'custom', path: ['plotSize'], message: 'Plot size and unit must be provided together.' });
  }
  if (value.plotSize !== null && Number(value.plotSize) <= 0) {
    context.addIssue({ code: 'custom', path: ['plotSize'], message: 'Plot size must be greater than zero.' });
  }
});

export function createPropertySlug(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
    .replace(/-$/g, '');
}

export function serializeProperty<T extends { priceAmount: { toString(): string } | null; plotSize: { toString(): string } | null }>(property: T) {
  return {
    ...property,
    priceAmount: property.priceAmount?.toString() ?? null,
    plotSize: property.plotSize?.toString() ?? null,
  };
}