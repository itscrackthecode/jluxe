import { z } from 'zod';
import { formatNumericValue } from '@/lib/db/numeric';
import { authorityVerificationStatuses, plotSizeUnits, priceModes, priceBases, propertySourceCategories, propertyStatuses, propertySubmitterRelationships, propertyTypes, propertySubtypes, publicAddressModes, publicationStatuses, representationTypes } from '@/lib/db/types';

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

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.enum(values).nullable().optional().transform((value) => value ?? null),
);

const optionalInteger = (maximum: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value === null || value === undefined ? null : Number(value),
  z.number().int().min(0).max(maximum).nullable().optional().transform((value) => value ?? null),
);

const propertyConfigurationSchema = z.object({
  optionName: optionalText(160),
  areaValue: optionalDecimal(12),
  areaUnit: optionalEnum(['SQ_FT', 'SQ_M', 'CENT', 'ACRE', 'OTHER'] as const),
  customAreaUnit: optionalText(80),
  areaBasis: optionalEnum(['PLOT_AREA', 'BUILT_UP_AREA', 'CARPET_AREA', 'OTHER'] as const),
  customAreaBasis: optionalText(100),
  dimensionLength: optionalDecimal(12),
  dimensionWidth: optionalDecimal(12),
  notesMarkdown: optionalText(20_000),
  priceMode: optionalEnum(priceModes),
  priceAmount: optionalDecimal(12),
  priceBasis: optionalEnum(priceBases),
  customPriceBasis: optionalText(80),
  additionalCharges: z.array(z.object({ label: z.string().trim().max(120), amount: z.string().trim().max(15) }).strict()).max(20).default([]),
  plotNumber: optionalText(80),
  bedroomCount: optionalInteger(100),
  bathroomCount: optionalInteger(100),
  floorNumber: optionalText(60),
  carpetArea: optionalDecimal(12),
  superBuiltUpArea: optionalDecimal(12),
  roomConfiguration: z.array(z.object({ name: optionalText(100), count: optionalInteger(100) }).strict()).max(30).default([]),
}).strict();

export const adminPropertySchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  ),
  description: optionalText(20_000),
  shortSummary: optionalText(5_000),
  location: optionalText(255),
  propertyType: z.enum(propertyTypes),
  propertyTypeOther: optionalText(120),
  propertySubtype: optionalText(120),
  propertySubtypeOther: optionalText(120),
  locality: optionalText(160),
  city: optionalText(120),
  nearbyLandmark: optionalText(180),
  district: optionalText(120),
  state: optionalText(120),
  pincode: optionalText(12),
  publicAddressMode: z.enum(publicAddressModes).default('FALLBACK'),
  manualPublicAddress: optionalText(500),
  mapLocation: optionalText(500),
  latitude: optionalText(16),
  longitude: optionalText(16),
  priceAmount: optionalDecimal(12),
  priceCurrency: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().regex(/^[A-Z]{3}$/).nullable().optional().transform((value) => value ?? null),
  ),
  priceMode: z.enum(priceModes),
  priceBasis: z.enum(priceBases).default('TOTAL_PRICE'),
  customPriceBasis: optionalText(80),
  additionalCharges: z.array(z.object({ label: z.string().trim().max(120), amount: z.string().trim().max(15) }).strict()).max(20).default([]),
  offerDetails: optionalText(2_000),
  configurations: z.array(propertyConfigurationSchema).max(20).default([]),
  plotSize: optionalDecimal(10),
  plotSizeUnit: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null),
  ),
  status: z.enum(propertyStatuses),
  availabilityOther: optionalText(120),
  enquiryEnabled: z.boolean().default(true),
  seoTitle: optionalText(200),
  seoDescription: optionalText(320),
  representationType: z.enum(representationTypes),
  sourceCategory: optionalEnum(propertySourceCategories),
  sourceCategoryOther: optionalText(120),
  sellerOrganizationName: optionalText(200),
  submitterRelationship: optionalEnum(propertySubmitterRelationships),
  submitterRelationshipOther: optionalText(160),
  representationRoleOther: optionalText(160),
  authorityVerificationStatus: z.enum(authorityVerificationStatuses).default('NOT_CHECKED'),
  internalContactName: optionalText(150),
  internalContactPhone: optionalText(32),
  internalContactEmail: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().trim().email().max(320).nullable().optional().transform((value) => value ?? null),
  ),
  privateNotesMarkdown: optionalText(20_000),
  roadAccess: optionalText(300),
  proximityMarkdown: optionalText(20_000),
  landApprovedFor: optionalEnum(['RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE'] as const),
  statutoryApprovals: z.array(z.enum(['CMDA', 'DTCP', 'RERA', 'OTHER'])).max(10).default([]),
  otherStatutoryApprovals: optionalText(300),
  approvalReference: optionalText(160),
  approvalAuthority: optionalText(200),
  projectPhase: optionalInteger(6),
  projectTotalLandArea: optionalDecimal(12),
  projectPhaseLandArea: optionalDecimal(12),
  projectApartmentCount: optionalInteger(100000),
  projectVillaCount: optionalInteger(100000),
  projectFeaturesMarkdown: optionalText(20_000),
  constructionStatus: optionalText(300),
  handoverDate: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().transform((value) => value ?? null)),
  waterSources: z.array(z.enum(['MUNICIPAL', 'BOREWELL', 'OVERHEAD_TANK', 'OTHER', 'NOT_CONFIRMED'])).max(10).default([]),
  otherWaterSource: optionalText(200),
  electricitySources: z.array(z.enum(['GRID', 'GENERATOR', 'SOLAR', 'OTHER', 'NOT_CONFIRMED'])).max(10).default([]),
  otherElectricitySource: optionalText(200),
  drainageOptions: z.array(z.enum(['STORMWATER', 'UNDERGROUND_SEWAGE', 'SEPTIC_TANK', 'OTHER', 'NOT_CONFIRMED'])).max(10).default([]),
  otherDrainageOption: optionalText(200),
  furnishingStatus: optionalEnum(['FULLY_FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED', 'OTHER'] as const),
  furnishingStatusOther: optionalText(120),
  amenitiesMarkdown: optionalText(20_000),
  facingDirection: optionalEnum(['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST', 'OTHER'] as const),
  facingOther: optionalText(120),
  sunlightOrientation: optionalText(300),
  neighborhoodType: optionalEnum(['STANDALONE', 'GATED_COMMUNITY', 'OTHER'] as const),
  neighborhoodTypeOther: optionalText(120),
  floorCount: optionalInteger(100),
  publicComplianceSummary: optionalText(5_000),
  commercialUse: optionalEnum(['RETAIL', 'OFFICE', 'INDUSTRIAL', 'WAREHOUSE', 'MIXED_USE', 'OTHER'] as const),
  commercialUseOther: optionalText(120),
  yearBuilt: optionalInteger(2100),
  recentUpgradesMarkdown: optionalText(20_000),
  transactionType: optionalEnum(['SALE', 'LEASE', 'RENT'] as const),
  leaseStructureMarkdown: optionalText(20_000),
  occupancyStatus: optionalEnum(['VACANT', 'PARTIALLY_OCCUPIED', 'OCCUPIED', 'NOT_DISCLOSED'] as const),
  leaseExpiryDate: z.preprocess((value) => typeof value === 'string' && value.trim() === '' ? null : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().transform((value) => value ?? null)),
  tenantProfileMarkdown: optionalText(20_000),
  publicationStatus: z.enum(publicationStatuses),
}).strict().superRefine((value, context) => {
  if (value.propertyType === 'OTHER' && !value.propertyTypeOther) {
    context.addIssue({ code: 'custom', path: ['propertyTypeOther'], message: 'Enter the property type.' });
  }
  if (value.status === 'OTHER' && !value.availabilityOther) {
    context.addIssue({ code: 'custom', path: ['availabilityOther'], message: 'Describe the availability status.' });
  }
  if (value.propertyType !== 'OTHER' && !value.propertySubtype) {
    context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Select a property subtype.' });
  }
  if (value.propertyType === 'OTHER' && !value.propertySubtype) {
    context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Enter the property subtype.' });
  }
  if (value.propertyType !== 'OTHER') {
    const allowed = propertySubtypes[value.propertyType as keyof typeof propertySubtypes];
    if (allowed && value.propertySubtype && !allowed.includes(value.propertySubtype as never)) {
      context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Select a valid subtype for this property type.' });
    }
    if (value.propertySubtype === 'Other' && !value.propertySubtypeOther) {
      context.addIssue({ code: 'custom', path: ['propertySubtypeOther'], message: 'Enter the property subtype.' });
    }
  }
  if (value.publicAddressMode === 'MANUAL' && !value.manualPublicAddress) {
    context.addIssue({ code: 'custom', path: ['manualPublicAddress'], message: 'Enter the public address.' });
  }
  for (const [field, minimum, maximum] of [['latitude', -90, 90], ['longitude', -180, 180]] as const) {
    const coordinate = value[field];
    if (coordinate !== null && (!/^-?\d{1,3}(?:\.\d{1,7})?$/.test(coordinate) || Number(coordinate) < minimum || Number(coordinate) > maximum)) {
      context.addIssue({ code: 'custom', path: [field], message: `Enter a valid coordinate between ${minimum} and ${maximum}.` });
    }
  }
  if ((value.latitude === null) !== (value.longitude === null)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'Enter both latitude and longitude, or leave both blank.' });
  }
  if (value.sourceCategory === 'OTHER' && !value.sourceCategoryOther) {
    context.addIssue({ code: 'custom', path: ['sourceCategoryOther'], message: 'Enter the source category.' });
  }
  if (value.submitterRelationship === 'OTHER' && !value.submitterRelationshipOther) {
    context.addIssue({ code: 'custom', path: ['submitterRelationshipOther'], message: 'Enter the submitter relationship.' });
  }
  if (value.representationType === 'OTHER' && !value.representationRoleOther) {
    context.addIssue({ code: 'custom', path: ['representationRoleOther'], message: 'Enter the JLUXE representation role.' });
  }
  if ((value.priceAmount === null) !== (value.priceCurrency === null)) {
    context.addIssue({ code: 'custom', path: ['priceAmount'], message: 'Price amount and currency must be provided together.' });
  }
  if (value.priceBasis === 'OTHER' && !value.customPriceBasis) {
    context.addIssue({ code: 'custom', path: ['customPriceBasis'], message: 'Enter the price measuring unit.' });
  }
  value.additionalCharges.forEach((charge, index) => {
    const label = charge.label.trim();
    const amount = charge.amount.trim();
    if (!label || !amount || !decimalPattern.test(amount) || amount.split('.')[0].length > 12) {
      context.addIssue({ code: 'custom', path: ['additionalCharges', index], message: 'Enter both a charge name and a valid amount.' });
    }
  });
  if ((value.plotSize === null) !== (value.plotSizeUnit === null)) {
    context.addIssue({ code: 'custom', path: ['plotSize'], message: 'Plot size and unit must be provided together.' });
  }
  if (value.plotSize !== null && Number(value.plotSize) <= 0) {
    context.addIssue({ code: 'custom', path: ['plotSize'], message: 'Plot size must be greater than zero.' });
  }
  const isLandPlot = value.propertyType === 'LAND_PLOT';
  const isCommercial = value.propertyType === 'COMMERCIAL';
  const isApartment = value.propertyType === 'RESIDENTIAL' && value.propertySubtype === 'Apartment';
  const isHouse = value.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(value.propertySubtype ?? '');
  if (!isLandPlot && (
    value.roadAccess || value.landApprovedFor ||
    value.waterSources.length || value.electricitySources.length || value.drainageOptions.length
  )) context.addIssue({ code: 'custom', path: ['propertyType'], message: 'Plot and land details are only supported for Land / Plot listings.' });
  if (!isLandPlot && !isCommercial && !isApartment && !isHouse && value.proximityMarkdown) context.addIssue({ code: 'custom', path: ['proximityMarkdown'], message: 'Proximity details are only supported for Land / Plot, Commercial, Apartment, Villa, or Independent House listings.' });
  if (!isApartment && value.furnishingStatus) context.addIssue({ code: 'custom', path: ['furnishingStatus'], message: 'Furnishing status is only supported for Apartment listings.' });
  if (!isApartment && value.furnishingStatusOther) context.addIssue({ code: 'custom', path: ['furnishingStatusOther'], message: 'Furnishing status is only supported for Apartment listings.' });
  if (!isApartment && !isHouse && !isCommercial && value.configurations.some((item) => item.bedroomCount !== null || item.bathroomCount !== null || item.floorNumber || item.carpetArea || item.superBuiltUpArea || item.roomConfiguration.length)) {
    context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Residential property details must match the selected property subtype.' });
  }
  if (!isHouse && (value.facingDirection || value.facingOther || value.sunlightOrientation || value.neighborhoodType || value.neighborhoodTypeOther || value.floorCount || value.publicComplianceSummary)) context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Villa and independent-house details are only supported for those residential subtypes.' });
  if (isHouse && value.configurations.some((item) => item.bedroomCount !== null || item.bathroomCount !== null || item.floorNumber)) context.addIssue({ code: 'custom', path: ['configurations'], message: 'Apartment-specific bedroom, bathroom, and floor fields cannot be used for villas or independent houses.' });
  if (value.propertySubtype !== 'Villa' && value.configurations.some((item) => item.superBuiltUpArea !== null)) context.addIssue({ code: 'custom', path: ['configurations'], message: 'Super built-up area is only supported for villas.' });
  if (value.propertySubtype !== 'Independent House' && value.floorCount !== null) context.addIssue({ code: 'custom', path: ['floorCount'], message: 'Floor count is only supported for independent houses.' });
  if (value.facingDirection === 'OTHER' && !value.facingOther) context.addIssue({ code: 'custom', path: ['facingOther'], message: 'Enter the facing direction.' });
  if (value.neighborhoodType === 'OTHER' && !value.neighborhoodTypeOther) context.addIssue({ code: 'custom', path: ['neighborhoodTypeOther'], message: 'Enter the neighborhood type.' });
  if (value.floorCount !== null && value.floorCount < 1) context.addIssue({ code: 'custom', path: ['floorCount'], message: 'Floor count must be at least one.' });
  if (value.projectPhase !== null && value.projectPhase < 1) context.addIssue({ code: 'custom', path: ['projectPhase'], message: 'Select a project phase from 1 to 6.' });
  if (value.handoverDate) {
    const parsedHandoverDate = new Date(`${value.handoverDate}T00:00:00.000Z`);
    if (Number.isNaN(parsedHandoverDate.getTime()) || parsedHandoverDate.toISOString().slice(0, 10) !== value.handoverDate) {
      context.addIssue({ code: 'custom', path: ['handoverDate'], message: 'Enter a valid handover date.' });
    }
  }
  if (value.yearBuilt !== null && value.yearBuilt < 1800) context.addIssue({ code: 'custom', path: ['yearBuilt'], message: 'Enter a year between 1800 and 2100.' });
  if (isCommercial && value.yearBuilt !== null && !Number.isInteger(value.yearBuilt)) context.addIssue({ code: 'custom', path: ['yearBuilt'], message: 'Enter a four-digit year.' });
  if (value.commercialUse === 'OTHER' && !value.commercialUseOther) context.addIssue({ code: 'custom', path: ['commercialUseOther'], message: 'Describe the commercial use.' });
  if (value.leaseExpiryDate) {
    const parsedExpiryDate = new Date(`${value.leaseExpiryDate}T00:00:00.000Z`);
    if (Number.isNaN(parsedExpiryDate.getTime()) || parsedExpiryDate.toISOString().slice(0, 10) !== value.leaseExpiryDate) {
      context.addIssue({ code: 'custom', path: ['leaseExpiryDate'], message: 'Enter a valid lease expiry date.' });
    }
  }
  if (!isCommercial && (value.commercialUse || value.commercialUseOther || value.yearBuilt !== null || value.recentUpgradesMarkdown || value.transactionType || value.leaseStructureMarkdown || value.occupancyStatus || value.leaseExpiryDate || value.tenantProfileMarkdown)) {
    context.addIssue({ code: 'custom', path: ['propertyType'], message: 'Commercial details are only supported for Commercial listings.' });
  }
  if (!['LEASE', 'RENT'].includes(value.transactionType ?? '') && (value.leaseStructureMarkdown || value.leaseExpiryDate)) context.addIssue({ code: 'custom', path: ['transactionType'], message: 'Lease terms and lease expiry only apply to Lease or Rent listings.' });
  value.configurations.forEach((configuration, index) => {
    if (configuration.priceAmount !== null && configuration.priceMode === null) {
      context.addIssue({ code: 'custom', path: ['configurations', index, 'priceMode'], message: 'Select a price mode for this amount.' });
    }
    if (configuration.priceMode && configuration.priceMode !== 'ON_REQUEST' && configuration.priceAmount === null) {
      context.addIssue({ code: 'custom', path: ['configurations', index, 'priceAmount'], message: 'Enter an amount or select On request.' });
    }
    if (configuration.priceMode === 'ON_REQUEST' && configuration.priceAmount !== null) {
      context.addIssue({ code: 'custom', path: ['configurations', index, 'priceAmount'], message: 'Remove the amount when the price is on request.' });
    }
    if (configuration.priceAmount !== null && configuration.priceBasis === null) {
      context.addIssue({ code: 'custom', path: ['configurations', index, 'priceBasis'], message: 'Select a price basis for this amount.' });
    }
    if (configuration.priceBasis === 'OTHER' && !configuration.customPriceBasis) {
      context.addIssue({ code: 'custom', path: ['configurations', index, 'customPriceBasis'], message: 'Enter the custom price basis.' });
    }
    configuration.additionalCharges.forEach((charge, chargeIndex) => {
      const label = charge.label.trim();
      const amount = charge.amount.trim();
      if (!label || !amount || !decimalPattern.test(amount) || amount.split('.')[0].length > 12) {
        context.addIssue({ code: 'custom', path: ['configurations', index, 'additionalCharges', chargeIndex], message: 'Enter both a charge name and a valid amount.' });
      }
    });
    configuration.roomConfiguration.forEach((room, roomIndex) => {
      if ((room.name === null) !== (room.count === null)) context.addIssue({ code: 'custom', path: ['configurations', index, 'roomConfiguration', roomIndex], message: 'Enter both a room name and its count.' });
    });
  });
  if (value.furnishingStatus === 'OTHER' && !value.furnishingStatusOther) context.addIssue({ code: 'custom', path: ['furnishingStatusOther'], message: 'Enter the furnishing status.' });
  if (value.statutoryApprovals.includes('OTHER') && !value.otherStatutoryApprovals) context.addIssue({ code: 'custom', path: ['otherStatutoryApprovals'], message: 'Describe the other statutory approval.' });
  if (value.waterSources.includes('OTHER') && !value.otherWaterSource) context.addIssue({ code: 'custom', path: ['otherWaterSource'], message: 'Describe the other water source.' });
  if (value.electricitySources.includes('OTHER') && !value.otherElectricitySource) context.addIssue({ code: 'custom', path: ['otherElectricitySource'], message: 'Describe the other electricity source.' });
  if (value.drainageOptions.includes('OTHER') && !value.otherDrainageOption) context.addIssue({ code: 'custom', path: ['otherDrainageOption'], message: 'Describe the other drainage or sewage option.' });
});

export function getPublicPropertyAddress(input: {
  title: string;
  publicAddressMode: 'FALLBACK' | 'MANUAL';
  manualPublicAddress: string | null;
  locality: string | null;
  city: string | null;
  nearbyLandmark: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
}) {
  if (input.publicAddressMode === 'MANUAL') return input.manualPublicAddress;
  const parts = [input.title, input.locality, input.city, input.district, input.state].filter(Boolean);
  const address = parts.join(', ');
  const postal = input.pincode ? ` - ${input.pincode}` : '';
  const landmark = input.nearbyLandmark ? ` (near ${input.nearbyLandmark})` : '';
  return `${address}${postal}${landmark}`.slice(0, 255) || null;
}

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
