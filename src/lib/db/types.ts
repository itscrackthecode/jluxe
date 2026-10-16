export type UUID = string;
export type NumericValue = string;

export const adminRoles = ['OWNER', 'ADMIN', 'EDITOR'] as const;
export const publicationStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const legacyPropertyTypes = ['PLOT', 'VILLA', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'] as const;
export const propertyTypes = ['RESIDENTIAL', 'LAND_PLOT', ...legacyPropertyTypes] as const;
export const propertyStatuses = ['AVAILABLE', 'UNDER_OFFER', 'SOLD', 'LEASED', 'WITHDRAWN', 'OTHER'] as const;
export const propertySubtypes = {
  RESIDENTIAL: ['Apartment', 'Independent House', 'Villa', 'Other'],
  COMMERCIAL: ['Office', 'Retail Space', 'Commercial Building', 'Other'],
  LAND_PLOT: ['Residential Plot', 'Commercial Plot', 'Agricultural Plot', 'Other'],
} as const;
export const publicAddressModes = ['FALLBACK', 'MANUAL'] as const;
export const representationTypes = ['CHANNEL_PARTNER', 'AUTHORIZED_REPRESENTATIVE', 'OTHER'] as const;
export const propertySourceCategories = ['INDIVIDUAL_OWNER', 'LANDOWNER', 'DEVELOPER', 'BUILDER', 'PROJECT_PROMOTER', 'AUTHORIZED_REPRESENTATIVE', 'OTHER'] as const;
export const propertySubmitterRelationships = ['OWNER', 'DEVELOPER', 'BUILDER', 'APPOINTED_REPRESENTATIVE', 'OTHER'] as const;
export const authorityVerificationStatuses = ['NOT_CHECKED', 'IN_REVIEW', 'VERIFIED', 'UNABLE_TO_VERIFY'] as const;
export const priceModes = ['EXACT', 'STARTING_FROM', 'ON_REQUEST'] as const;
export const priceBases = ['TOTAL_PRICE', 'PER_SQFT', 'PER_CENT', 'OTHER'] as const;
export const plotSizeUnits = ['SQFT', 'SQM', 'ACRE', 'HECTARE'] as const;
export const enquiryStatuses = ['NEW', 'CONTACTED', 'IN_DISCUSSION', 'CONVERTED', 'CLOSED'] as const;

export type AdminRole = typeof adminRoles[number];
export type PublicationStatus = typeof publicationStatuses[number];
export type PropertyType = typeof propertyTypes[number];
export type PropertyStatus = typeof propertyStatuses[number];
export type RepresentationType = typeof representationTypes[number];
export type PropertySourceCategory = typeof propertySourceCategories[number];
export type PropertySubmitterRelationship = typeof propertySubmitterRelationships[number];
export type AuthorityVerificationStatus = typeof authorityVerificationStatuses[number];
export type PriceMode = typeof priceModes[number];
export type PriceBasis = typeof priceBases[number];
export type PlotSizeUnit = typeof plotSizeUnits[number];
export type EnquiryStatus = typeof enquiryStatuses[number];

export type PropertyConfiguration = {
  id: UUID;
  propertyId: UUID;
  position: number;
  optionName: string | null;
  areaValue: NumericValue | null;
  areaUnit: 'SQ_FT' | 'SQ_M' | 'CENT' | 'ACRE' | 'OTHER' | null;
  customAreaUnit: string | null;
  areaBasis: 'PLOT_AREA' | 'BUILT_UP_AREA' | 'CARPET_AREA' | 'OTHER' | null;
  customAreaBasis: string | null;
  dimensionLength: NumericValue | null;
  dimensionWidth: NumericValue | null;
  notesMarkdown: string | null;
  plotNumber?: string | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  floorNumber?: string | null;
  carpetArea?: NumericValue | null;
  superBuiltUpArea?: NumericValue | null;
  roomConfiguration?: Array<{ name: string | null; count: number | null }>;
};

export interface Admin {
  id: UUID;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCategory {
  id: UUID;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Service {
  id: UUID;
  slug: string;
  title: string;
  description: string | null;
  publicationStatus: PublicationStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: UUID;
  slug: string;
  title: string;
  description: string | null;
  shortSummary?: string | null;
  location: string | null;
  propertyType: PropertyType;
  propertyTypeOther?: string | null;
  propertySubtype?: string | null;
  propertySubtypeOther?: string | null;
  locality?: string | null;
  city?: string | null;
  nearbyLandmark?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  publicAddressMode?: typeof publicAddressModes[number];
  manualPublicAddress?: string | null;
  mapLocation?: string | null;
  latitude?: NumericValue | null;
  longitude?: NumericValue | null;
  priceAmount: NumericValue | null;
  priceCurrency: string | null;
  priceMode: PriceMode;
  priceBasis?: PriceBasis;
  customPriceBasis?: string | null;
  additionalCharges?: Array<{ label: string; amount: string }>;
  offerDetails?: string | null;
  plotSize: NumericValue | null;
  plotSizeUnit: PlotSizeUnit | null;
  status: PropertyStatus;
  availabilityOther?: string | null;
  enquiryEnabled?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  representationType: RepresentationType;
  sourceCategory?: PropertySourceCategory | null;
  sourceCategoryOther?: string | null;
  sellerOrganizationName?: string | null;
  submitterRelationship?: PropertySubmitterRelationship | null;
  submitterRelationshipOther?: string | null;
  representationRoleOther?: string | null;
  authorityVerificationStatus?: AuthorityVerificationStatus;
  internalContactName?: string | null;
  internalContactPhone?: string | null;
  internalContactEmail?: string | null;
  privateNotesMarkdown?: string | null;
  roadAccess?: string | null;
  proximityMarkdown?: string | null;
  landApprovedFor?: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE' | null;
  statutoryApprovals?: string[];
  otherStatutoryApprovals?: string | null;
  approvalReference?: string | null;
  approvalAuthority?: string | null;
  projectPhase?: number | null;
  constructionStatus?: string | null;
  handoverDate?: string | null;
  waterSources?: string[];
  otherWaterSource?: string | null;
  electricitySources?: string[];
  otherElectricitySource?: string | null;
  drainageOptions?: string[];
  otherDrainageOption?: string | null;
  furnishingStatus?: 'FULLY_FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED' | 'OTHER' | null;
  furnishingStatusOther?: string | null;
  amenitiesMarkdown?: string | null;
  facingDirection?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTH_EAST' | 'NORTH_WEST' | 'SOUTH_EAST' | 'SOUTH_WEST' | 'OTHER' | null;
  facingOther?: string | null;
  sunlightOrientation?: string | null;
  neighborhoodType?: 'STANDALONE' | 'GATED_COMMUNITY' | 'OTHER' | null;
  neighborhoodTypeOther?: string | null;
  floorCount?: number | null;
  publicComplianceSummary?: string | null;
  commercialUse?: 'RETAIL' | 'OFFICE' | 'INDUSTRIAL' | 'WAREHOUSE' | 'MIXED_USE' | 'OTHER' | null;
  commercialUseOther?: string | null;
  yearBuilt?: number | null;
  recentUpgradesMarkdown?: string | null;
  transactionType?: 'SALE' | 'LEASE' | 'RENT' | null;
  leaseStructureMarkdown?: string | null;
  occupancyStatus?: 'VACANT' | 'PARTIALLY_OCCUPIED' | 'OCCUPIED' | 'NOT_DISCLOSED' | null;
  leaseExpiryDate?: string | null;
  tenantProfileMarkdown?: string | null;
  publicationStatus: PublicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioWork {
  id: UUID;
  slug: string;
  title: string;
  serviceId: UUID;
  description: string;
  location: string | null;
  year: number | null;
  featured: boolean;
  publicationStatus: PublicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enquiry {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  interestedServiceId: UUID | null;
  interestedServiceLabel: string;
  message: string;
  propertyId: UUID | null;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: UUID;
  storageKey: string;
  provider: string;
  mimeType: string;
  byteSize: NumericValue;
  width: number | null;
  height: number | null;
  uploadedByAdminId: UUID | null;
  createdAt: Date;
}

export interface PropertyMedia {
  propertyId: UUID;
  mediaId: UUID;
  position: number;
  altText: string | null;
}

export interface PortfolioWorkMedia {
  portfolioWorkId: UUID;
  mediaId: UUID;
  position: number;
  altText: string | null;
}

export interface PropertyMediaItem extends PropertyMedia {
  id: UUID;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  provider?: string;
  deliveryUrl?: string | null;
}

export interface PortfolioWorkMediaItem extends PortfolioWorkMedia {
  id: UUID;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  provider?: string;
  deliveryUrl?: string | null;
}

export interface PortfolioWorkWithService extends PortfolioWork {
  service: Pick<Service, 'id' | 'slug' | 'title'>;
}
