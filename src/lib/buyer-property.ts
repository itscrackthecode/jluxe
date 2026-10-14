export const buyerPropertyTypes = ['RESIDENTIAL', 'COMMERCIAL', 'LAND_PLOT', 'OTHER'] as const;
export type BuyerPropertyType = (typeof buyerPropertyTypes)[number];

export const buyerPropertyTypeLabels: Record<BuyerPropertyType, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  LAND_PLOT: 'Land / Plot',
  OTHER: 'Other Property',
};

export function buyerCategoryForPropertyType(propertyType: string): BuyerPropertyType {
  if (propertyType === 'APARTMENT' || propertyType === 'VILLA') return 'RESIDENTIAL';
  if (propertyType === 'COMMERCIAL') return 'COMMERCIAL';
  if (propertyType === 'PLOT' || propertyType === 'LAND') return 'LAND_PLOT';
  return 'OTHER';
}

export function buyerSubtypeForPropertyType(propertyType: string) {
  const labels: Record<string, string> = {
    APARTMENT: 'Apartment',
    VILLA: 'Villa',
    COMMERCIAL: 'Commercial property',
    PLOT: 'Plot',
    LAND: 'Land',
    OTHER: 'Other property',
  };
  return labels[propertyType] ?? 'Other property';
}

export const buyerPropertySubtypes = {
  RESIDENTIAL: ['Apartment', 'Independent house', 'Villa', 'Other'],
  COMMERCIAL: ['Office', 'Retail space', 'Commercial building', 'Other'],
  LAND_PLOT: ['Residential plot', 'Commercial plot', 'Agricultural land', 'Other'],
} as const;

export const buyerBedroomOptions = ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'] as const;
export const buyerConditionOptions = ['Ready to move', 'Under construction', 'Either'] as const;
export const buyerReadinessOptions = ['Ready to use', 'Under construction', 'Either'] as const;
export const buyerCommercialUseOptions = ['Office', 'Retail', 'Business premises', 'Other'] as const;
export const buyerLandUseOptions = ['Residential', 'Commercial', 'Investment', 'Other'] as const;
export const buyerAreaUnits = ['SQFT', 'SQM', 'GROUND', 'ACRE', 'HECTARE'] as const;
export const buyerPurposeOptions = ['Personal use', 'Investment', 'Business'] as const;
export const buyerTimelineOptions = ['Immediately', 'Within 3 months', 'Within 6 months', 'Just exploring'] as const;
export const buyerContactMethods = ['Phone', 'WhatsApp', 'Email'] as const;

export function buyerAreaUnitLabel(unit: string) {
  const labels: Record<string, string> = {
    SQFT: 'sq. ft.', SQM: 'sq. m.', GROUND: 'grounds', ACRE: 'acres', HECTARE: 'hectares',
  };
  return labels[unit] ?? unit;
}
