import { z } from 'zod';
import { formatNumericValue } from '@/lib/db/numeric';
import { plotSizeUnits, priceModes, propertyStatuses, propertyTypes, propertyAvailabilityValues, publicationStatuses, representationTypes } from '@/lib/db/types';

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

const optionalInteger = (maximum: number) => z.preprocess(
  (value) => value == null || (typeof value === 'string' && value.trim() === '')
    ? null
    : typeof value === 'string' ? Number(value) : value,
  z.number().int().min(0).max(maximum).nullable().optional().transform((value) => value ?? null),
);

export const adminPropertySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  ),
  description: optionalText(20_000),
  location: optionalText(255),
  propertyType: z.enum(propertyTypes),
  priceAmount: optionalDecimal(12),
  priceCurrency: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().regex(/^[A-Z]{3}$/).nullable().optional().transform((value) => value ?? null),
  ),
  priceMode: z.enum(priceModes),
  plotSize: optionalDecimal(10),
  plotSizeUnit: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null),
  ),
  status: z.enum(propertyStatuses),
  representationType: z.enum(representationTypes),
  publicationStatus: z.enum(publicationStatuses),
  subtype: optionalText(100), projectName: optionalText(200), address: optionalText(500),
  locality: optionalText(150), city: optionalText(150), state: optionalText(150),
  locationUrl: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.string().trim().url().max(1000).refine((value) => {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }, 'Location links must use HTTPS.').nullable().optional().transform((value) => value ?? null)),
  bedrooms: optionalInteger(100), bathrooms: optionalInteger(100), floorCount: optionalInteger(500), parkingSpaces: optionalInteger(1000),
  builtUpArea: optionalDecimal(10), builtUpAreaUnit: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null)),
  roadAccess: optionalText(255), approvalInfo: optionalText(500),
  features: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  customAttributes: z.record(z.string().max(80), z.string().trim().max(255)).default({}),
  seoTitle: optionalText(200), seoDescription: optionalText(320),
  priceMinimum: optionalDecimal(12), priceMaximum: optionalDecimal(12),
  priceBasis: z.enum(['TOTAL', 'PER_UNIT', 'PER_SQFT', 'PER_SQM', 'PER_ACRE']).default('TOTAL'),
  availability: z.enum(propertyAvailabilityValues).default('AVAILABLE'),
  configurations: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(150),
    area: optionalDecimal(10),
    areaUnit: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null)),
    bedrooms: optionalInteger(100), bathrooms: optionalInteger(100),
    floor: optionalText(80), block: optionalText(100),
    priceMode: z.enum(['EXACT', 'RANGE', 'PER_UNIT', 'ON_REQUEST']),
    priceAmount: optionalDecimal(12), priceMinimum: optionalDecimal(12), priceMaximum: optionalDecimal(12),
    priceCurrency: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.string().trim().regex(/^[A-Z]{3}$/).nullable().optional().transform((value) => value ?? null)),
    priceBasis: z.enum(['TOTAL', 'PER_UNIT', 'PER_SQFT', 'PER_SQM', 'PER_ACRE']),
    availability: z.enum(propertyAvailabilityValues),
    availableUnits: optionalInteger(1_000_000),
    features: z.array(z.string().trim().min(1).max(100)).max(50),
  }).strict().superRefine((configuration, context) => {
    const hasRange = configuration.priceMinimum !== null || configuration.priceMaximum !== null;
    if (configuration.priceMode === 'RANGE' && !hasRange) context.addIssue({ code: 'custom', path: ['priceMinimum'], message: 'Enter at least one bound for a price range.' });
    if ((configuration.priceMode === 'EXACT' || configuration.priceMode === 'PER_UNIT') && configuration.priceAmount === null) context.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Enter a fixed price for this pricing mode.' });
    if (configuration.priceMode === 'PER_UNIT' && configuration.priceBasis === 'TOTAL') context.addIssue({ code: 'custom', path: ['priceBasis'], message: 'Choose the unit or measurement basis for this price.' });
    if (configuration.priceMode === 'RANGE' && configuration.priceAmount !== null) context.addIssue({ code: 'custom', path: ['priceAmount'], message: 'A range cannot also have a fixed price.' });
    if ((configuration.priceMode === 'EXACT' || configuration.priceMode === 'PER_UNIT') && hasRange) context.addIssue({ code: 'custom', path: ['priceMinimum'], message: 'Clear the range bounds for a fixed price.' });
    if (configuration.priceMode === 'ON_REQUEST' && (configuration.priceAmount !== null || hasRange)) context.addIssue({ code: 'custom', path: ['priceMode'], message: 'Price on request cannot include numeric prices.' });
    if ((configuration.priceAmount !== null || hasRange) !== (configuration.priceCurrency !== null)) context.addIssue({ code: 'custom', path: ['priceCurrency'], message: 'A currency is required when pricing is provided.' });
    if (configuration.priceMinimum !== null && configuration.priceMaximum !== null && Number(configuration.priceMinimum) > Number(configuration.priceMaximum)) context.addIssue({ code: 'custom', path: ['priceMaximum'], message: 'Maximum price must be at least the minimum price.' });
    if (configuration.area !== null && Number(configuration.area) <= 0) context.addIssue({ code: 'custom', path: ['area'], message: 'Area must be greater than zero.' });
    if ((configuration.area === null) !== (configuration.areaUnit === null)) context.addIssue({ code: 'custom', path: ['areaUnit'], message: 'Choose an area unit when area is provided.' });
  })).max(100).default([]),
  inventory: z.array(z.object({
    id: z.string().uuid().optional(),
    reference: z.string().trim().min(1).max(120),
    configurationId: z.string().uuid().nullable().optional().transform((value) => value ?? null),
    availability: z.enum(propertyAvailabilityValues),
    priceAmount: optionalDecimal(12),
    priceCurrency: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.string().trim().regex(/^[A-Z]{3}$/).nullable().optional().transform((value) => value ?? null)),
    area: optionalDecimal(10),
    areaUnit: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null)),
  }).strict().superRefine((item, context) => {
    if ((item.priceAmount === null) !== (item.priceCurrency === null)) context.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Price and currency must be provided together.' });
    if ((item.area === null) !== (item.areaUnit === null)) context.addIssue({ code: 'custom', path: ['areaUnit'], message: 'Area and unit must be provided together.' });
  })).max(500).default([]),
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
  if (value.builtUpArea !== null && Number(value.builtUpArea) <= 0) context.addIssue({ code: 'custom', path: ['builtUpArea'], message: 'Area must be greater than zero.' });
  if (value.priceMinimum !== null && value.priceMaximum !== null && Number(value.priceMinimum) > Number(value.priceMaximum)) context.addIssue({ code: 'custom', path: ['priceMaximum'], message: 'Maximum price must be at least the minimum price.' });
  if ((value.priceMinimum !== null || value.priceMaximum !== null) && value.priceCurrency === null) context.addIssue({ code: 'custom', path: ['priceCurrency'], message: 'A currency is required when a price range is provided.' });
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
    priceAmount: formatNumericValue(property.priceAmount?.toString() ?? null),
    plotSize: formatNumericValue(property.plotSize?.toString() ?? null),
  };
}
