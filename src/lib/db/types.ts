export type UUID = string;
export type NumericValue = string;

export const adminRoles = ['OWNER', 'ADMIN', 'EDITOR'] as const;
export const publicationStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const propertyTypes = ['PLOT', 'VILLA', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'] as const;
export const propertyStatuses = ['AVAILABLE', 'UNDER_OFFER', 'SOLD', 'LEASED', 'WITHDRAWN'] as const;
export const representationTypes = ['CHANNEL_PARTNER', 'AUTHORIZED_REPRESENTATIVE', 'OTHER'] as const;
export const priceModes = ['EXACT', 'STARTING_FROM', 'ON_REQUEST'] as const;
export const plotSizeUnits = ['SQFT', 'SQM', 'ACRE', 'HECTARE'] as const;
export const enquiryStatuses = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;

export type AdminRole = typeof adminRoles[number];
export type PublicationStatus = typeof publicationStatuses[number];
export type PropertyType = typeof propertyTypes[number];
export type PropertyStatus = typeof propertyStatuses[number];
export type RepresentationType = typeof representationTypes[number];
export type PriceMode = typeof priceModes[number];
export type PlotSizeUnit = typeof plotSizeUnits[number];
export type EnquiryStatus = typeof enquiryStatuses[number];

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
  location: string | null;
  propertyType: PropertyType;
  priceAmount: NumericValue | null;
  priceCurrency: string | null;
  priceMode: PriceMode;
  plotSize: NumericValue | null;
  plotSizeUnit: PlotSizeUnit | null;
  status: PropertyStatus;
  representationType: RepresentationType;
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
}

export interface PortfolioWorkMediaItem extends PortfolioWorkMedia {
  id: UUID;
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface PortfolioWorkWithService extends PortfolioWork {
  service: Pick<Service, 'id' | 'slug' | 'title'>;
}