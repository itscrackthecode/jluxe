export type PropertyListing = {
  id: string;
  slug: string;
  title: string;
  location?: string;
  propertyType?: string;
  price?: string;
  budgetAmount?: number;
  plotSize?: string;
  plotSizeAmount?: number;
  status?: string;
  images?: { src: string; alt: string }[];
  description?: string;
};

export const propertyListings: PropertyListing[] = [];

export const propertyTypes = ['Residential', 'Residential Plot', 'Commercial', 'Land'];

export type PropertySort = 'featured' | 'price-asc' | 'price-desc' | 'plot-size-asc' | 'plot-size-desc';

export type PropertyListingFilters = {
  location?: string;
  propertyType?: string;
  status?: string;
  budgetMin?: number;
  budgetMax?: number;
  plotMin?: number;
  plotMax?: number;
};

export function filterPropertyListings(listings: PropertyListing[], filters: PropertyListingFilters) {
  return listings.filter((property) => {
    if (filters.location && !property.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
    if (filters.status && property.status !== filters.status) return false;
    if (filters.budgetMin !== undefined && (property.budgetAmount === undefined || property.budgetAmount < filters.budgetMin)) return false;
    if (filters.budgetMax !== undefined && (property.budgetAmount === undefined || property.budgetAmount > filters.budgetMax)) return false;
    if (filters.plotMin !== undefined && (property.plotSizeAmount === undefined || property.plotSizeAmount < filters.plotMin)) return false;
    if (filters.plotMax !== undefined && (property.plotSizeAmount === undefined || property.plotSizeAmount > filters.plotMax)) return false;
    return true;
  });
}

export function sortPropertyListings(listings: PropertyListing[], sort: PropertySort) {
  if (sort === 'featured') return [...listings];

  const field = sort.startsWith('price') ? 'budgetAmount' : 'plotSizeAmount';
  const direction = sort.endsWith('asc') ? 1 : -1;

  return [...listings].sort((first, second) => {
    const firstValue = first[field];
    const secondValue = second[field];
    if (firstValue === undefined) return secondValue === undefined ? 0 : 1;
    if (secondValue === undefined) return -1;
    return (firstValue - secondValue) * direction;
  });
}