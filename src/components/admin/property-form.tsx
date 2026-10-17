'use client';

import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Star, Plus, Eye, Download, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  propertyStatuses,
  propertySubtypes,
  publicAddressModes,
  publicationStatuses,
  representationTypes,
  type PlotSizeUnit,
  type PriceMode,
  type PriceBasis,
  type PropertyStatus,
  type PropertyType,
  type PublicationStatus,
  type RepresentationType,
  type PropertyMediaItem,
  type PropertyConfiguration,
  authorityVerificationStatuses,
  propertySourceCategories,
  propertySubmitterRelationships,
} from '@/lib/db/types';
import { createPropertySlug } from '@/lib/admin-property';
import { getMediaImageUrl } from '@/lib/media';
import { uploadAdminImage } from '@/lib/cloudinary-client';
import PrivateNotesEditor from '@/components/admin/private-notes-editor';
import PropertyVerificationDocuments from '@/components/admin/property-verification-documents';
import PropertyLayoutDocuments from '@/components/admin/property-layout-documents';

type PropertyData = {
  id: string;
  title: string;
  slug: string;
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
  latitude?: string | null;
  longitude?: string | null;
  priceAmount: string | null;
  priceMode: PriceMode;
  priceBasis?: PriceBasis;
  customPriceBasis?: string | null;
  additionalCharges?: Array<{ label: string; amount: string }>;
  offerDetails?: string | null;
  plotSize: string | null;
  plotSizeUnit: PlotSizeUnit | null;
  status: PropertyStatus;
  availabilityOther?: string | null;
  enquiryEnabled?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  representationType: RepresentationType;
  sourceCategory?: PropertyDataSourceCategory | null;
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
  projectTotalLandArea?: string | null;
  projectPhaseLandArea?: string | null;
  projectApartmentCount?: number | null;
  projectVillaCount?: number | null;
  projectFeaturesMarkdown?: string | null;
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
};

type PropertyDataSourceCategory = typeof propertySourceCategories[number];
type PropertySubmitterRelationship = typeof propertySubmitterRelationships[number];
type AuthorityVerificationStatus = typeof authorityVerificationStatuses[number];

type FormValues = {
  title: string;
  slug: string;
  description: string;
  shortSummary: string;
  location: string;
  propertyType: string;
  propertyTypeOther: string;
  propertySubtype: string;
  propertySubtypeOther: string;
  locality: string;
  city: string;
  nearbyLandmark: string;
  district: string;
  state: string;
  pincode: string;
  publicAddressMode: 'FALLBACK' | 'MANUAL';
  manualPublicAddress: string;
  mapLocation: string;
  latitude: string;
  longitude: string;
  priceAmount: string;
  priceMode: PriceMode;
  priceBasis: PriceBasis;
  customPriceBasis: string;
  additionalCharges: Array<{ label: string; amount: string }>;
  offerDetails: string;
  plotSize: string;
  plotSizeUnit: string;
  status: string;
  availabilityOther: string;
  enquiryEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  representationType: string;
  sourceCategory: string;
  sourceCategoryOther: string;
  sellerOrganizationName: string;
  submitterRelationship: string;
  submitterRelationshipOther: string;
  representationRoleOther: string;
  authorityVerificationStatus: AuthorityVerificationStatus;
  internalContactName: string;
  internalContactPhone: string;
  internalContactEmail: string;
  privateNotesMarkdown: string;
  roadAccess: string;
  proximityMarkdown: string;
  landApprovedFor: string;
  statutoryApprovals: string[];
  otherStatutoryApprovals: string;
  approvalReference: string;
  approvalAuthority: string;
  projectPhase: string;
  projectTotalLandArea: string;
  projectPhaseLandArea: string;
  projectApartmentCount: string;
  projectVillaCount: string;
  projectFeaturesMarkdown: string;
  constructionStatus: string;
  handoverDate: string;
  waterSources: string[];
  otherWaterSource: string;
  electricitySources: string[];
  otherElectricitySource: string;
  drainageOptions: string[];
  otherDrainageOption: string;
  furnishingStatus: string;
  furnishingStatusOther: string;
  amenitiesMarkdown: string;
  facingDirection: string;
  facingOther: string;
  sunlightOrientation: string;
  neighborhoodType: string;
  neighborhoodTypeOther: string;
  floorCount: string;
  publicComplianceSummary: string;
  commercialUse: string;
  commercialUseOther: string;
  yearBuilt: string;
  recentUpgradesMarkdown: string;
  transactionType: string;
  leaseStructureMarkdown: string;
  occupancyStatus: string;
  leaseExpiryDate: string;
  tenantProfileMarkdown: string;
  configurations: Array<{
    optionName: string;
    areaValue: string;
    areaUnit: string;
    customAreaUnit: string;
    areaBasis: string;
    customAreaBasis: string;
    dimensionLength: string;
    dimensionWidth: string;
    notesMarkdown: string;
    priceMode: string;
    priceAmount: string;
    priceBasis: string;
    customPriceBasis: string;
    additionalCharges: Array<{ label: string; amount: string }>;
    plotNumber: string;
    bedroomCount: string;
    bathroomCount: string;
    floorNumber: string;
    carpetArea: string;
    superBuiltUpArea: string;
    roomConfiguration: Array<{ name: string; count: string }>;
  }>;
  publicationStatus: PublicationStatus;
};

type MediaOption = { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; byteSize?: string; width?: number | null; height?: number | null };

type AttachedMediaItem = {
  mediaId: string;
  storageKey: string;
  deliveryUrl?: string | null;
  position: number;
  altText: string | null;
};

type PropertyFormIssue = { label: string; message?: string; index?: number };

function getAttachedMediaUrl(item: Pick<AttachedMediaItem, 'deliveryUrl' | 'storageKey'>) {
  return item.deliveryUrl ?? (item.storageKey.startsWith('/') ? item.storageKey : null);
}

function getAttachedMediaDownloadUrl(item: Pick<AttachedMediaItem, 'deliveryUrl' | 'storageKey'>) {
  const url = getAttachedMediaUrl(item);
  if (!url) return null;
  if (url.startsWith('/')) return url;
  if (!url.startsWith('https://res.cloudinary.com/')) return null;

  try {
    const parsed = new URL(url);
    const uploadPath = '/image/upload/';
    if (!parsed.pathname.includes(uploadPath)) return null;
    parsed.pathname = parsed.pathname.replace(uploadPath, `${uploadPath}fl_attachment/`);
    return parsed.toString();
  } catch {
    return null;
  }
}

const propertyFieldLabels: Record<string, string> = {
  title: 'Title', slug: 'URL slug', propertyType: 'Property type', propertyTypeOther: 'Enter the type of Property',
  propertySubtype: 'Property subtype', propertySubtypeOther: 'Enter the subtype of Property',
  status: 'Property availability', availabilityOther: 'Describe availability status', publicationStatus: 'Publication status',
  priceMode: 'Price mode', priceBasis: 'Price basis', priceAmount: 'Price amount', plotSize: 'Plot size',
  plotSizeUnit: 'Plot size unit', customPriceBasis: 'Price basis',
  publicAddressMode: 'Public address', manualPublicAddress: 'Public address', representationType: 'JLUXE role',
  sourceCategoryOther: 'Enter the source category', submitterRelationshipOther: 'Submitter relationship',
  representationRoleOther: 'JLUXE representation role', otherStatutoryApprovals: 'Other statutory approvals',
  otherWaterSource: 'Other water source', otherElectricitySource: 'Other electricity source',
  otherDrainageOption: 'Other drainage or sewage option', furnishingStatusOther: 'Other furnishing status',
  facingOther: 'Other facing direction', neighborhoodTypeOther: 'Other neighborhood type', commercialUseOther: 'Other commercial use',
};

const inputClass = 'min-h-11 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]';
const propertyCategories = ['RESIDENTIAL', 'COMMERCIAL', 'LAND_PLOT', 'OTHER'] as const;

function toFormValues(property?: PropertyData, configurations: PropertyConfiguration[] = []): FormValues {
  const legacyType = property?.propertyType;
  const propertyType = legacyType === 'APARTMENT' || legacyType === 'VILLA' ? 'RESIDENTIAL'
    : legacyType === 'PLOT' || legacyType === 'LAND' ? 'LAND_PLOT'
      : legacyType ?? '';
  const legacySubtype = legacyType === 'APARTMENT' ? 'Apartment'
    : legacyType === 'VILLA' ? 'Villa'
      : legacyType === 'LAND' ? 'Agricultural Plot' : '';
  return {
    title: property?.title ?? '',
    slug: property?.slug ?? '',
    description: property?.description ?? '',
    shortSummary: property?.shortSummary ?? '',
    location: property?.location ?? '',
    propertyType,
    propertyTypeOther: property?.propertyTypeOther ?? '',
    propertySubtype: property?.propertySubtype ?? legacySubtype,
    propertySubtypeOther: property?.propertySubtypeOther ?? '',
    locality: property?.locality ?? '',
    city: property?.city ?? '',
    nearbyLandmark: property?.nearbyLandmark ?? '',
    district: property?.district ?? '',
    state: property?.state ?? '',
    pincode: property?.pincode ?? '',
    publicAddressMode: property?.publicAddressMode ?? (property?.location ? 'MANUAL' : 'FALLBACK'),
    manualPublicAddress: property?.manualPublicAddress ?? property?.location ?? '',
    mapLocation: property?.mapLocation ?? '',
    latitude: property?.latitude ?? '',
    longitude: property?.longitude ?? '',
    priceAmount: property?.priceAmount ?? '',
    priceMode: property?.priceMode ?? 'EXACT',
    priceBasis: property?.priceBasis ?? 'TOTAL_PRICE',
    customPriceBasis: property?.customPriceBasis ?? '',
    additionalCharges: property?.additionalCharges ?? [],
    offerDetails: property?.offerDetails ?? '',
    plotSize: property?.plotSize ?? '',
    plotSizeUnit: property?.plotSizeUnit ?? '',
    status: property?.status ?? 'AVAILABLE',
    availabilityOther: property?.availabilityOther ?? '',
    enquiryEnabled: property?.enquiryEnabled ?? true,
    seoTitle: property?.seoTitle ?? '',
    seoDescription: property?.seoDescription ?? '',
    representationType: property?.representationType ?? '',
    sourceCategory: property?.sourceCategory ?? '',
    sourceCategoryOther: property?.sourceCategoryOther ?? '',
    sellerOrganizationName: property?.sellerOrganizationName ?? '',
    submitterRelationship: property?.submitterRelationship ?? '',
    submitterRelationshipOther: property?.submitterRelationshipOther ?? '',
    representationRoleOther: property?.representationRoleOther ?? '',
    authorityVerificationStatus: property?.authorityVerificationStatus ?? 'NOT_CHECKED',
    internalContactName: property?.internalContactName ?? '',
    internalContactPhone: property?.internalContactPhone ?? '',
    internalContactEmail: property?.internalContactEmail ?? '',
    privateNotesMarkdown: property?.privateNotesMarkdown ?? '',
    roadAccess: property?.roadAccess ?? '', proximityMarkdown: property?.proximityMarkdown ?? '',
    landApprovedFor: property?.landApprovedFor ?? '', statutoryApprovals: property?.statutoryApprovals ?? [],
    otherStatutoryApprovals: property?.otherStatutoryApprovals ?? '', approvalReference: property?.approvalReference ?? '',
    approvalAuthority: property?.approvalAuthority ?? '', projectPhase: property?.projectPhase == null ? '' : String(property.projectPhase),
    projectTotalLandArea: property?.projectTotalLandArea ?? '', projectPhaseLandArea: property?.projectPhaseLandArea ?? '',
    projectApartmentCount: property?.projectApartmentCount == null ? '' : String(property.projectApartmentCount),
    projectVillaCount: property?.projectVillaCount == null ? '' : String(property.projectVillaCount),
    projectFeaturesMarkdown: property?.projectFeaturesMarkdown ?? '',
    constructionStatus: property?.constructionStatus ?? '', handoverDate: property?.handoverDate ?? '',
    waterSources: property?.waterSources ?? [], otherWaterSource: property?.otherWaterSource ?? '',
    electricitySources: property?.electricitySources ?? [], otherElectricitySource: property?.otherElectricitySource ?? '',
    drainageOptions: property?.drainageOptions ?? [], otherDrainageOption: property?.otherDrainageOption ?? '',
    furnishingStatus: property?.furnishingStatus ?? '', furnishingStatusOther: property?.furnishingStatusOther ?? '',
    amenitiesMarkdown: property?.amenitiesMarkdown ?? '',
    facingDirection: property?.facingDirection ?? '', facingOther: property?.facingOther ?? '',
    sunlightOrientation: property?.sunlightOrientation ?? '', neighborhoodType: property?.neighborhoodType ?? '',
    neighborhoodTypeOther: property?.neighborhoodTypeOther ?? '', floorCount: property?.floorCount == null ? '' : String(property.floorCount),
    publicComplianceSummary: property?.publicComplianceSummary ?? '',
    commercialUse: property?.commercialUse ?? '', commercialUseOther: property?.commercialUseOther ?? '',
    yearBuilt: property?.yearBuilt == null ? '' : String(property.yearBuilt), recentUpgradesMarkdown: property?.recentUpgradesMarkdown ?? '',
    transactionType: property?.transactionType ?? '', leaseStructureMarkdown: property?.leaseStructureMarkdown ?? '',
    occupancyStatus: property?.occupancyStatus ?? '', leaseExpiryDate: property?.leaseExpiryDate ?? '',
    tenantProfileMarkdown: property?.tenantProfileMarkdown ?? '',
    configurations: configurations.length > 0 ? configurations.map((item) => ({
      optionName: item.optionName ?? '', areaValue: item.areaValue ?? '', areaUnit: item.areaUnit ?? '',
      customAreaUnit: item.customAreaUnit ?? '', areaBasis: item.areaBasis ?? '', customAreaBasis: item.customAreaBasis ?? '',
      dimensionLength: item.dimensionLength ?? '', dimensionWidth: item.dimensionWidth ?? '', notesMarkdown: item.notesMarkdown ?? '', plotNumber: item.plotNumber ?? '',
      priceMode: item.priceMode ?? '', priceAmount: item.priceAmount ?? '', priceBasis: item.priceBasis ?? '', customPriceBasis: item.customPriceBasis ?? '',
      additionalCharges: item.additionalCharges ?? [],
      bedroomCount: item.bedroomCount == null ? '' : String(item.bedroomCount), bathroomCount: item.bathroomCount == null ? '' : String(item.bathroomCount), floorNumber: item.floorNumber ?? '',
      carpetArea: item.carpetArea ?? '', superBuiltUpArea: item.superBuiltUpArea ?? '',
      roomConfiguration: item.roomConfiguration?.map((room) => ({ name: room.name ?? '', count: room.count == null ? '' : String(room.count) })) ?? [],
    })) : property ? [] : [{ optionName: '', areaValue: '', areaUnit: '', customAreaUnit: '', areaBasis: '', customAreaBasis: '', dimensionLength: '', dimensionWidth: '', notesMarkdown: '', priceMode: '', priceAmount: '', priceBasis: '', customPriceBasis: '', additionalCharges: [], plotNumber: '', bedroomCount: '', bathroomCount: '', floorNumber: '', carpetArea: '', superBuiltUpArea: '', roomConfiguration: [] }],
    publicationStatus: property?.publicationStatus ?? 'DRAFT',
  };
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanMoneyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [integer = '', ...fractionParts] = cleaned.split('.');
  const fraction = fractionParts.join('').slice(0, 2);
  return fractionParts.length ? `${integer}.${fraction}` : integer;
}

function formatMoneyInput(value: string) {
  if (!value) return '';
  const [integer, fraction] = value.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

export default function PropertyForm({
  property,
  initialMedia = [],
  initialConfigurations = [],
}: {
  property?: PropertyData;
  initialMedia?: PropertyMediaItem[];
  initialConfigurations?: PropertyConfiguration[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toFormValues(property, initialConfigurations));
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PropertyFormIssue[]>([]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sourceDetailView, setSourceDetailView] = useState<'notes' | 'documents'>('notes');
  const fallbackPublicAddress = [values.title, values.locality, values.city, values.district, values.state].filter(Boolean).join(', ')
    + (values.pincode ? ` - ${values.pincode}` : '')
    + (values.nearbyLandmark ? ` (near ${values.nearbyLandmark})` : '');
  const publicAddressPreview = values.publicAddressMode === 'MANUAL' ? values.manualPublicAddress : fallbackPublicAddress;

  // Media gallery state
  const [mediaList, setMediaList] = useState<AttachedMediaItem[]>(() =>
    initialMedia.map((item) => ({
      mediaId: item.mediaId,
        storageKey: item.storageKey,
        deliveryUrl: item.deliveryUrl,
      position: item.position,
      altText: item.altText,
    })),
  );
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMediaIdsToAdd, setSelectedMediaIdsToAdd] = useState<string[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaActionPending, setMediaActionPending] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<AttachedMediaItem | null>(null);
  const previewDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (!dialog) return;
    if (previewMedia && !dialog.open) dialog.showModal();
    if (!previewMedia && dialog.open) dialog.close();
  }, [previewMedia]);

  useEffect(() => {
    const controller = new AbortController();
    setMediaLoading(true);

    fetch('/admin/api/media?limit=50', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) {
          setMediaOptions(
            result.data.map((item: { id: string; storageKey: string; mimeType: string; deliveryUrl?: string | null; byteSize?: string; width?: number | null; height?: number | null }) => ({
              id: item.id,
              storageKey: item.storageKey,
              mimeType: item.mimeType,
              deliveryUrl: item.deliveryUrl,
              byteSize: item.byteSize,
              width: item.width,
              height: item.height,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setMediaLoading(false);
      });

    return () => controller.abort();
  }, [property?.id]);

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors([]);
    setError('');
  }

  function focusFieldIssue(issue: PropertyFormIssue) {
    if (issue.index !== undefined) {
      formRef.current?.querySelectorAll<HTMLElement>(':invalid')[issue.index]?.focus();
      formRef.current?.querySelectorAll<HTMLElement>(':invalid')[issue.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const labels = Array.from(formRef.current?.querySelectorAll('label') ?? []);
    const matchingLabel = labels.find((label) => {
      const caption = label.querySelector('span')?.textContent?.trim() ?? label.textContent?.trim() ?? '';
      return caption.toLocaleLowerCase().startsWith(issue.label.toLocaleLowerCase());
    });
    const control = matchingLabel?.querySelector<HTMLElement>('input, select, textarea, button');
    control?.focus();
    control?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleInvalidFields(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalidFields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(':invalid'));
    const issues = invalidFields.map((element, index) => {
      const label = element.closest('label');
      const caption = label?.querySelector('span')?.textContent?.trim()
        ?? element.getAttribute('aria-label')
        ?? element.getAttribute('placeholder')
        ?? 'Required field';
      return { label: caption.replace(/\s*\(.*?\)/, '').replace(/\s*\*$/, ''), index };
    });
    setError('Some required information is missing. Select a field below to go directly to it.');
    setFieldErrors(issues);
    invalidFields[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    invalidFields[0]?.focus();
  }

  function updateConfiguration(index: number, field: Exclude<keyof FormValues['configurations'][number], 'roomConfiguration' | 'additionalCharges'>, value: string) {
    setValues((current) => ({
      ...current,
      configurations: current.configurations.map((configuration, configurationIndex) =>
        configurationIndex === index ? { ...configuration, [field]: value } : configuration),
    }));
  }

  function updateConfigurationCharge(index: number, chargeIndex: number, field: 'label' | 'amount', value: string) {
    setValues((current) => ({
      ...current,
      configurations: current.configurations.map((configuration, configurationIndex) => configurationIndex === index
        ? { ...configuration, additionalCharges: configuration.additionalCharges.map((charge, itemIndex) => itemIndex === chargeIndex ? { ...charge, [field]: value } : charge) }
        : configuration),
    }));
  }

  function addConfigurationCharge(index: number) {
    setValues((current) => ({
      ...current,
      configurations: current.configurations.map((configuration, configurationIndex) => configurationIndex === index
        ? { ...configuration, additionalCharges: [...configuration.additionalCharges, { label: '', amount: '' }] }
        : configuration),
    }));
  }

  function removeConfigurationCharge(index: number, chargeIndex: number) {
    setValues((current) => ({
      ...current,
      configurations: current.configurations.map((configuration, configurationIndex) => configurationIndex === index
        ? { ...configuration, additionalCharges: configuration.additionalCharges.filter((_, itemIndex) => itemIndex !== chargeIndex) }
        : configuration),
    }));
  }

  function addConfiguration() {
    setValues((current) => ({ ...current, configurations: [...current.configurations, {
      optionName: '', areaValue: '', areaUnit: '', customAreaUnit: '', areaBasis: '', customAreaBasis: '',
      dimensionLength: '', dimensionWidth: '', notesMarkdown: '', plotNumber: '', bedroomCount: '', bathroomCount: '', floorNumber: '',
      priceMode: '', priceAmount: '', priceBasis: '', customPriceBasis: '', additionalCharges: [],
      carpetArea: '', superBuiltUpArea: '', roomConfiguration: [],
    }] }));
  }

  async function persistMediaList(newList: AttachedMediaItem[]) {
    const entityId = property?.id ?? createdPropertyId;
    if (!entityId) {
      setMediaList(newList);
      return;
    }
    setMediaActionPending(true);
    setMediaNotice(null);

    try {
      const response = await fetch(`/admin/api/properties/${entityId}/media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media: newList.map((item) => ({
            mediaId: item.mediaId,
            altText: item.altText,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.error ?? 'Unable to update property gallery.');
      }

      setMediaList(
        result.data.map((item: PropertyMediaItem) => ({
          mediaId: item.mediaId,
          storageKey: item.storageKey,
          deliveryUrl: item.deliveryUrl,
          position: item.position,
          altText: item.altText,
        })),
      );
      setMediaNotice({ type: 'success', text: 'Gallery updated.' });
      router.refresh();
    } catch (err) {
      setMediaNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update gallery.',
      });
    } finally {
      setMediaActionPending(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files);
    if (mediaList.length + chosen.length > 12) {
      setMediaNotice({ type: 'error', text: 'A property can have up to 12 images.' });
      return;
    }
    setUploading(true);
    setMediaNotice(null);
    try {
      for (const file of chosen) {
        const uploaded = await uploadAdminImage(file, 'properties');
        const next = [...mediaList, { mediaId: uploaded.id, storageKey: uploaded.storageKey, deliveryUrl: uploaded.deliveryUrl, position: mediaList.length, altText: null }];
        await persistMediaList(next);
        setMediaList(next);
      }
      setMediaNotice({ type: 'success', text: 'Image uploaded and added to this property.' });
    } catch (reason) {
      setMediaNotice({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to upload image.' });
    } finally {
      setUploading(false);
    }
  }

  const handleMakeCover = (index: number) => {
    if (index === 0 || mediaActionPending) return;
    const target = mediaList[index];
    const remaining = mediaList.filter((_, i) => i !== index);
    const updated = [target, ...remaining].map((item, idx) => ({ ...item, position: idx }));
    void persistMediaList(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || mediaActionPending) return;
    const updated = [...mediaList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    void persistMediaList(updated.map((item, idx) => ({ ...item, position: idx })));
  };

  const handleMoveDown = (index: number) => {
    if (index === mediaList.length - 1 || mediaActionPending) return;
    const updated = [...mediaList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    void persistMediaList(updated.map((item, idx) => ({ ...item, position: idx })));
  };

  const handleRemoveMedia = (mediaId: string) => {
    if (mediaActionPending) return;
    const updated = mediaList
      .filter((item) => item.mediaId !== mediaId)
      .map((item, idx) => ({ ...item, position: idx }));
    void persistMediaList(updated);
  };

  const handleAddMedia = () => {
    if (selectedMediaIdsToAdd.length === 0 || mediaActionPending) return;
    const selected = mediaOptions.filter((option) => selectedMediaIdsToAdd.includes(option.id) && !mediaList.some((item) => item.mediaId === option.id));
    const updated = [...mediaList, ...selected.map((option, index): AttachedMediaItem => ({
      mediaId: option.id, storageKey: option.storageKey, deliveryUrl: option.deliveryUrl,
      position: mediaList.length + index, altText: null,
    }))];
    setSelectedMediaIdsToAdd([]);
    setMediaPickerOpen(false);
    void persistMediaList(updated);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');
    setFieldErrors([]);
    const isResidential = values.propertyType === 'RESIDENTIAL';
    const isApartment = isResidential && values.propertySubtype === 'Apartment';
    const isHouse = isResidential && ['Villa', 'Independent House'].includes(values.propertySubtype);
    const isVilla = isResidential && values.propertySubtype === 'Villa';
    const isIndependentHouse = isResidential && values.propertySubtype === 'Independent House';
    const payload = {
      ...values,
      availabilityOther: values.status === 'OTHER' ? values.availabilityOther || null : null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      propertyType: values.propertyType === 'RESIDENTIAL' ? 'RESIDENTIAL'
        : values.propertyType === 'COMMERCIAL' ? 'COMMERCIAL'
          : values.propertyType === 'LAND_PLOT' ? 'LAND_PLOT' : 'OTHER',
      location: publicAddressPreview || null,
      slug: values.slug || undefined,
      description: values.description || null,
      shortSummary: values.shortSummary || null,
      propertyTypeOther: values.propertyTypeOther || null,
      propertySubtype: values.propertySubtype || null,
      propertySubtypeOther: values.propertySubtypeOther || null,
      locality: values.locality || null,
      city: values.city || null,
      nearbyLandmark: values.nearbyLandmark || null,
      district: values.district || null,
      state: values.state || null,
      pincode: values.pincode || null,
      manualPublicAddress: values.manualPublicAddress || null,
      mapLocation: values.mapLocation || null,
      latitude: values.latitude || null,
      longitude: values.longitude || null,
      priceAmount: values.priceAmount || null,
      priceCurrency: values.priceAmount ? 'INR' : null,
      priceBasis: values.priceBasis,
      customPriceBasis: values.priceBasis === 'OTHER' ? values.customPriceBasis : null,
      additionalCharges: values.additionalCharges.filter((charge) => charge.label.trim() || charge.amount.trim()).map((charge) => ({ ...charge, amount: cleanMoneyInput(charge.amount) })),
      offerDetails: values.offerDetails || null,
      configurations: values.configurations.filter((item) => Object.entries(item).some(([key, value]) => key === 'roomConfiguration'
        ? (value as Array<{ name: string; count: string }>).some((room) => room.name.trim() || room.count.trim())
        : key === 'additionalCharges'
          ? (value as Array<{ label: string; amount: string }>).some((charge) => charge.label.trim() || charge.amount.trim())
        : Boolean((value as string).trim()))).map((item) => ({
        optionName: item.optionName || null,
        areaValue: item.areaValue ? cleanMoneyInput(item.areaValue) : null,
        areaUnit: item.areaUnit || null,
        customAreaUnit: item.customAreaUnit || null,
        areaBasis: isHouse ? 'BUILT_UP_AREA' : item.areaBasis || null,
        customAreaBasis: isHouse ? null : item.customAreaBasis || null,
        dimensionLength: item.dimensionLength ? cleanMoneyInput(item.dimensionLength) : null,
        dimensionWidth: item.dimensionWidth ? cleanMoneyInput(item.dimensionWidth) : null,
        notesMarkdown: item.notesMarkdown || null,
        priceMode: item.priceMode || null,
        priceAmount: item.priceAmount ? cleanMoneyInput(item.priceAmount) : null,
        priceBasis: item.priceBasis || null,
        customPriceBasis: item.priceBasis === 'OTHER' ? item.customPriceBasis || null : null,
        additionalCharges: item.additionalCharges.filter((charge) => charge.label.trim() || charge.amount.trim()).map((charge) => ({ ...charge, amount: cleanMoneyInput(charge.amount) })),
        plotNumber: values.propertyType === 'LAND_PLOT' ? item.plotNumber || null : null,
        bedroomCount: values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' && item.bedroomCount !== '' ? Number(item.bedroomCount) : null,
        bathroomCount: values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' && item.bathroomCount !== '' ? Number(item.bathroomCount) : null,
        floorNumber: values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' ? item.floorNumber || null : null,
        carpetArea: isHouse && item.carpetArea ? cleanMoneyInput(item.carpetArea) : null,
        superBuiltUpArea: isVilla && item.superBuiltUpArea ? cleanMoneyInput(item.superBuiltUpArea) : null,
        roomConfiguration: isHouse ? item.roomConfiguration.filter((room) => room.name.trim() || room.count.trim()).map((room) => ({ name: room.name.trim() || null, count: room.count.trim() ? Number(room.count) : null })) : [],
      })),
      roadAccess: values.propertyType === 'LAND_PLOT' ? values.roadAccess || null : null,
      proximityMarkdown: values.propertyType === 'LAND_PLOT' || values.propertyType === 'COMMERCIAL' || isApartment || isHouse ? values.proximityMarkdown || null : null,
      landApprovedFor: values.propertyType === 'LAND_PLOT' ? values.landApprovedFor || null : null,
      statutoryApprovals: values.statutoryApprovals,
      otherStatutoryApprovals: values.statutoryApprovals.includes('OTHER') ? values.otherStatutoryApprovals || null : null,
      approvalReference: values.approvalReference || null,
      approvalAuthority: values.approvalAuthority || null,
      projectPhase: values.projectPhase ? Number(values.projectPhase) : null,
      projectTotalLandArea: values.projectTotalLandArea ? cleanMoneyInput(values.projectTotalLandArea) : null,
      projectPhaseLandArea: values.projectPhaseLandArea ? cleanMoneyInput(values.projectPhaseLandArea) : null,
      projectApartmentCount: values.projectApartmentCount ? Number(values.projectApartmentCount) : null,
      projectVillaCount: values.projectVillaCount ? Number(values.projectVillaCount) : null,
      projectFeaturesMarkdown: values.projectFeaturesMarkdown || null,
      constructionStatus: values.constructionStatus || null,
      handoverDate: values.handoverDate || null,
      waterSources: values.propertyType === 'LAND_PLOT' ? values.waterSources : [],
      otherWaterSource: values.propertyType === 'LAND_PLOT' ? values.otherWaterSource || null : null,
      electricitySources: values.propertyType === 'LAND_PLOT' ? values.electricitySources : [],
      otherElectricitySource: values.propertyType === 'LAND_PLOT' ? values.otherElectricitySource || null : null,
      drainageOptions: values.propertyType === 'LAND_PLOT' ? values.drainageOptions : [],
      otherDrainageOption: values.propertyType === 'LAND_PLOT' ? values.otherDrainageOption || null : null,
      furnishingStatus: values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' ? values.furnishingStatus || null : null,
      furnishingStatusOther: values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' && values.furnishingStatus === 'OTHER' ? values.furnishingStatusOther || null : null,
      amenitiesMarkdown: values.amenitiesMarkdown || null,
      facingDirection: isHouse ? values.facingDirection || null : null,
      facingOther: isHouse && values.facingDirection === 'OTHER' ? values.facingOther || null : null,
      sunlightOrientation: isHouse ? values.sunlightOrientation || null : null,
      neighborhoodType: isHouse ? values.neighborhoodType || null : null,
      neighborhoodTypeOther: isHouse && values.neighborhoodType === 'OTHER' ? values.neighborhoodTypeOther || null : null,
      floorCount: isIndependentHouse && values.floorCount ? Number(values.floorCount) : null,
      publicComplianceSummary: isHouse ? values.publicComplianceSummary || null : null,
      commercialUse: values.propertyType === 'COMMERCIAL' ? values.commercialUse || null : null,
      commercialUseOther: values.propertyType === 'COMMERCIAL' && values.commercialUse === 'OTHER' ? values.commercialUseOther || null : null,
      yearBuilt: values.propertyType === 'COMMERCIAL' && values.yearBuilt ? Number(values.yearBuilt) : null,
      recentUpgradesMarkdown: values.propertyType === 'COMMERCIAL' ? values.recentUpgradesMarkdown || null : null,
      transactionType: values.propertyType === 'COMMERCIAL' ? values.transactionType || null : null,
      leaseStructureMarkdown: values.propertyType === 'COMMERCIAL' && ['LEASE', 'RENT'].includes(values.transactionType) ? values.leaseStructureMarkdown || null : null,
      occupancyStatus: values.propertyType === 'COMMERCIAL' ? values.occupancyStatus || null : null,
      leaseExpiryDate: values.propertyType === 'COMMERCIAL' && ['LEASE', 'RENT'].includes(values.transactionType) ? values.leaseExpiryDate || null : null,
      tenantProfileMarkdown: values.propertyType === 'COMMERCIAL' ? values.tenantProfileMarkdown || null : null,
      plotSize: values.plotSize || null,
      plotSizeUnit: values.plotSizeUnit || null,
      sourceCategory: values.sourceCategory || null,
      sourceCategoryOther: values.sourceCategoryOther || null,
      sellerOrganizationName: values.sellerOrganizationName || null,
      submitterRelationship: values.submitterRelationship || null,
      submitterRelationshipOther: values.submitterRelationshipOther || null,
      representationRoleOther: values.representationRoleOther || null,
      internalContactName: values.internalContactName || null,
      internalContactPhone: values.internalContactPhone || null,
      internalContactEmail: values.internalContactEmail || null,
      privateNotesMarkdown: values.privateNotesMarkdown || null,
    };

    try {
      const entityId = property?.id ?? createdPropertyId;
      const response = await fetch(entityId ? `/admin/api/properties/${entityId}` : '/admin/api/properties', {
        method: entityId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        if (Array.isArray(result.issues) && result.issues.length > 0) {
          const issues: PropertyFormIssue[] = result.issues.map((issue: { path?: string[]; message?: string }) => {
            const path = Array.isArray(issue.path) ? issue.path : [];
            const field = path.at(-1) ?? '';
            const baseLabel = propertyFieldLabels[field] ?? (field ? formatLabel(field) : 'Property details');
            const configurationIndex = path[0] === 'configurations' ? Number(path[1]) : Number.NaN;
            const label = Number.isInteger(configurationIndex)
              ? `Configuration ${configurationIndex + 1}: ${baseLabel}`
              : baseLabel;
            const message = issue.message && !issue.message.startsWith('Invalid input') && !issue.message.startsWith('Invalid option')
              ? issue.message : 'Enter or select a valid value.';
            return { label, message };
          });
          setFieldErrors(issues);
          setError('Please review the following property fields. Select a field to jump to it.');
          return;
        }
        setError(result.error ?? 'Unable to save property. Please review the form and try again.');
        return;
      }

      const savedId = entityId ?? result.data.id as string;
      if (!entityId) setCreatedPropertyId(savedId);
      if (!property && mediaList.length > 0) {
        const linked = await fetch(`/admin/api/properties/${savedId}/media`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ media: mediaList.map((item) => ({ mediaId: item.mediaId, altText: item.altText })) }),
        });
        const linkedResult = await linked.json();
        if (!linked.ok || linkedResult.success !== true) throw new Error(linkedResult.error ?? 'Property saved, but its images could not be attached. Save again to retry.');
      }

      const notice = values.publicationStatus === 'DRAFT' ? 'Property saved as draft.'
        : values.publicationStatus === 'ARCHIVED' ? 'Property archived successfully.'
          : property || entityId ? 'Property updated successfully.' : 'Property published successfully.';
      router.push(`/admin/properties?notice=${encodeURIComponent(notice)}`);
      router.refresh();
    } catch {
      setError('Unable to save property right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl text-[#f5f1e8]">
      <Link href="/admin/properties" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#9caaa4] transition-colors hover:text-[#f5f1e8]">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <div className="mt-5 border-b border-white/15 pb-6">
        <h1 className="font-display text-4xl text-white">{property ? 'Edit property' : 'Add property'}</h1>
      </div>

      <form ref={formRef} onSubmit={submit} onInvalidCapture={handleInvalidFields} className="mt-6 space-y-8">
        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">BASIC INFORMATION</p>
          <h2 className="mt-1 font-display text-2xl text-white">Property details</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Title *</span>
            <input
              required
              maxLength={200}
              value={values.title}
              onChange={(event) => {
                const title = event.target.value;
                update('title', title);
                if (!slugEdited) update('slug', createPropertySlug(title));
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">URL slug *</span>
            <input
              required
              maxLength={180}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);
                update('slug', event.target.value);
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Property type *</span>
            <select
              required
              value={values.propertyType}
              onChange={(event) => {
                update('propertyType', event.target.value);
                update('propertySubtype', '');
                update('propertySubtypeOther', '');
                update('propertyTypeOther', '');
              }}
              className={inputClass}
            >
              <option value="">Select type</option>
              {propertyCategories.map((value) => (
                <option key={value} value={value}>
                  {value === 'LAND_PLOT' ? 'Land / Plot' : formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
          {values.propertyType === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Enter the type of Property *</span>
            <input required maxLength={120} value={values.propertyTypeOther} onChange={(event) => update('propertyTypeOther', event.target.value)} className={inputClass} />
          </label>}
          {values.propertyType && values.propertyType !== 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Property subtype *</span>
            <select required value={values.propertySubtype} onChange={(event) => { update('propertySubtype', event.target.value); update('propertySubtypeOther', ''); }} className={inputClass}>
              <option value="">Select subtype</option>
              {propertySubtypes[values.propertyType as keyof typeof propertySubtypes]?.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
            </select>
          </label>}
          {(values.propertyType === 'OTHER' || values.propertySubtype === 'Other') && <label className="block text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">{values.propertyType === 'OTHER' ? 'Enter the subtype of Property *' : 'Enter the subtype of Property *'}</span>
            <input required maxLength={120} value={values.propertyType === 'OTHER' ? values.propertySubtype : values.propertySubtypeOther} onChange={(event) => values.propertyType === 'OTHER' ? update('propertySubtype', event.target.value) : update('propertySubtypeOther', event.target.value)} className={inputClass} />
          </label>}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold text-white">Short summary</h3>
            <p className="mb-3 mt-1 text-xs text-[#9caaa4]">A concise introduction shown near the top of the public property page.</p>
            <PrivateNotesEditor id="property-short-summary" label="Short summary in Markdown" placeholder="Add a concise overview. Markdown is supported." maxLength={5000} value={values.shortSummary} onChange={(value) => update('shortSummary', value)} />
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold text-white">Detailed summary</h3>
            <p className="mb-3 mt-1 text-xs text-[#9caaa4]">Describe the property in more detail for customers.</p>
            <PrivateNotesEditor id="property-detailed-summary" label="Detailed summary in Markdown" placeholder="Add property details. Markdown is supported." value={values.description} onChange={(value) => update('description', value)} />
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold text-white">Location details</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {([
                ['locality', 'Locality'], ['city', 'City'], ['nearbyLandmark', 'Nearby landmark'],
                ['district', 'District'], ['state', 'State'], ['pincode', 'Pincode'],
              ] as const).map(([field, label]) => <label key={field} className="block text-xs font-medium text-[#9caaa4]">
                <span className="mb-1.5 block">{label}</span>
                <input maxLength={field === 'pincode' ? 12 : 180} inputMode={field === 'pincode' ? 'numeric' : undefined} value={values[field]} onChange={(event) => update(field, event.target.value)} className={inputClass} />
              </label>)}
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white">Public address</h4>
              <fieldset className="mt-3">
                <legend className="sr-only">Choose how the public address is entered</legend>
                <div className="flex flex-wrap gap-5 text-sm text-[#d8dfdb]">
                  {(['FALLBACK', 'MANUAL'] as const).map((mode) => <label key={mode} className="inline-flex min-h-10 cursor-pointer items-center gap-2">
                    <input type="radio" name="public-address-mode" value={mode} checked={values.publicAddressMode === mode} onChange={() => update('publicAddressMode', mode)} className="accent-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]" />
                    {mode === 'FALLBACK' ? 'Fallback Entry' : 'Manual Entry'}
                  </label>)}
                </div>
              </fieldset>
              {values.publicAddressMode === 'MANUAL' ? <label className="mt-3 block text-xs font-medium text-[#9caaa4]">
                <span className="mb-1.5 block">Public address *</span>
                <textarea required maxLength={500} rows={3} value={values.manualPublicAddress} onChange={(event) => update('manualPublicAddress', event.target.value)} className={inputClass} />
              </label> : <p className="mt-3 border border-white/10 bg-[#09221c] px-3 py-3 text-sm leading-6 text-[#d8dfdb]" aria-live="polite">{publicAddressPreview || 'The address preview will appear here as location details are entered.'}</p>}
              <p className="mt-2 text-xs leading-5 text-[#82918b]">Fallback Entry combines the property title and available location details, including the nearby landmark when provided.</p>
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <h4 className="text-sm font-semibold text-white">Map location and coordinates <span className="font-normal text-[#9caaa4]">(optional)</span></h4>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2"><span className="mb-1.5 block">Map location link or place</span><input maxLength={500} value={values.mapLocation} onChange={(event) => update('mapLocation', event.target.value)} className={inputClass} placeholder="Google Maps link or place reference" /></label>
                <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Latitude</span><input inputMode="decimal" maxLength={16} value={values.latitude} onChange={(event) => update('latitude', event.target.value)} className={inputClass} placeholder="e.g. 13.0827" /></label>
                <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Longitude</span><input inputMode="decimal" maxLength={16} value={values.longitude} onChange={(event) => update('longitude', event.target.value)} className={inputClass} placeholder="e.g. 80.2707" /></label>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">AVAILABILITY AND PUBLICATION</p>
          <h2 className="mt-1 font-display text-2xl text-white">Availability and visibility</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Property availability *</span>
              <select required value={values.status} onChange={(event) => update('status', event.target.value)} className={inputClass}>
                {propertyStatuses.map((value) => <option key={value} value={value}>{value === 'OTHER' ? 'Other' : formatLabel(value)}</option>)}
              </select>
            </label>
            {values.status === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Describe availability status *</span>
              <input required maxLength={120} value={values.availabilityOther} onChange={(event) => update('availabilityOther', event.target.value)} className={inputClass} />
            </label>}
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Publication status *</span>
              <select value={values.publicationStatus} onChange={(event) => update('publicationStatus', event.target.value as FormValues['publicationStatus'])} className={inputClass}>
                {publicationStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Enquiry enabled *</span>
              <select value={values.enquiryEnabled ? 'true' : 'false'} onChange={(event) => update('enquiryEnabled', event.target.value === 'true')} className={inputClass}>
                <option value="true">Yes</option><option value="false">No</option>
              </select>
              <span className="mt-1.5 block font-normal leading-5 text-[#82918b]">Sold, leased, and withdrawn listings never accept enquiries.</span>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">SEO title <span className="font-normal">(optional)</span></span>
              <input maxLength={200} value={values.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
              <span className="mb-1.5 block">SEO description <span className="font-normal">(optional)</span></span>
              <textarea maxLength={320} rows={3} value={values.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} className={inputClass} />
            </label>
          </div>
        </section>

        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">PRICING</p>
          <h2 className="mt-1 font-display text-2xl text-white">Pricing and charges</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Use the option cards below for prices and additional charges that differ by configuration. This section can hold the overall starting price.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price mode *</span>
              <select required value={values.priceMode} onChange={(event) => update('priceMode', event.target.value as PriceMode)} className={inputClass}>
                <option value="EXACT">Exact price</option><option value="STARTING_FROM">Starting from</option><option value="ON_REQUEST">On request</option><option value="EARLY_BIRD">Early Bird</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price amount (INR)</span>
              <span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]">
                <span className="px-3 text-sm text-[#f5f1e8]" aria-hidden="true">₹</span>
                <input aria-label="Price amount in Indian rupees" inputMode="decimal" value={formatMoneyInput(values.priceAmount)} onChange={(event) => update('priceAmount', cleanMoneyInput(event.target.value))} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="Enter amount" />
              </span>
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price basis *</span>
              <select required value={values.priceBasis} onChange={(event) => update('priceBasis', event.target.value as PriceBasis)} className={inputClass}>
                <option value="TOTAL_PRICE">Total price</option><option value="PER_SQFT">Per sq. ft.</option><option value="PER_CENT">Per cent</option><option value="OTHER">Other</option>
              </select>
            </label>
            {values.priceBasis === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Price basis unit *</span>
              <span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><span className="px-3 text-sm text-[#9caaa4]">per</span><input required maxLength={80} value={values.customPriceBasis} onChange={(event) => update('customPriceBasis', event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="e.g. acre" /></span>
            </label>}
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-sm font-semibold text-white">Additional charges <span className="font-normal text-[#9caaa4]">(optional)</span></h3><p className="mt-1 text-xs text-[#9caaa4]">Add charges such as registration or maintenance only when the details are known.</p></div>
              <button type="button" onClick={() => setValues((current) => ({ ...current, additionalCharges: [...current.additionalCharges, { label: '', amount: '' }] }))} className="inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 text-xs font-semibold text-white transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Plus className="h-4 w-4" /> Add charge</button>
            </div>
            {values.additionalCharges.length > 0 && <div className="mt-4 space-y-3">{values.additionalCharges.map((charge, index) => <div key={index} className="grid gap-3 border border-white/10 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Charge name</span><input maxLength={120} value={charge.label} onChange={(event) => setValues((current) => ({ ...current, additionalCharges: current.additionalCharges.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} className={inputClass} placeholder="e.g. Registration charges" /></label>
              <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Amount (INR)</span><span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><span className="px-3 text-sm text-[#f5f1e8]" aria-hidden="true">₹</span><input aria-label={`Charge ${index + 1} amount in Indian rupees`} inputMode="decimal" value={formatMoneyInput(charge.amount)} onChange={(event) => setValues((current) => ({ ...current, additionalCharges: current.additionalCharges.map((item, itemIndex) => itemIndex === index ? { ...item, amount: cleanMoneyInput(event.target.value) } : item) }))} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="Enter amount" /></span></label>
              <button type="button" aria-label={`Remove charge ${index + 1}`} onClick={() => setValues((current) => ({ ...current, additionalCharges: current.additionalCharges.filter((_, itemIndex) => itemIndex !== index) }))} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-3 text-xs text-[#d7b3a9] hover:border-red-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /><span className="sm:sr-only">Remove</span></button>
            </div>)}</div>}
          </div>
          <label className="mt-6 block border-t border-white/10 pt-5 text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Offer details <span className="font-normal">(optional)</span></span><textarea maxLength={2000} rows={3} value={values.offerDetails} onChange={(event) => update('offerDetails', event.target.value)} className={inputClass} placeholder="Add any current offer or pricing note." /></label>
        </section>

        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">AREA &amp; CONFIGURATION</p>
          <h2 className="mt-1 font-display text-2xl text-white">Areas and options</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Add one or more customer-facing options. Every field is optional; leave a card blank to skip it.</p>
          <div className="mt-5 space-y-4">
            {values.configurations.map((configuration, index) => <fieldset key={index} className="min-w-0 border border-white/15 bg-[#08201b] p-4 sm:p-5">
              <legend className="px-2 text-sm font-semibold text-white">Option {index + 1}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
                  <span className="mb-1.5 block">Option name <span className="font-normal">(optional)</span></span>
                  <input maxLength={160} value={configuration.optionName} onChange={(event) => updateConfiguration(index, 'optionName', event.target.value)} className={inputClass} placeholder="e.g. 2 BHK, 30 × 40 plot, Corner plot" />
                </label>
                {values.propertyType === 'LAND_PLOT' && <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2">
                  <span className="mb-1.5 block">Plot number <span className="font-normal">(optional)</span></span>
                  <input maxLength={80} value={configuration.plotNumber} onChange={(event) => updateConfiguration(index, 'plotNumber', event.target.value)} className={inputClass} placeholder="e.g. A-12" />
                </label>}
                <label className="block text-xs font-medium text-[#9caaa4]">
                  <span className="mb-1.5 block">{values.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(values.propertySubtype) ? 'Built-up area' : 'Area value'} <span className="font-normal">(optional)</span></span>
                  <span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><input aria-label={`Option ${index + 1} area value`} inputMode="decimal" value={formatMoneyInput(configuration.areaValue)} onChange={(event) => updateConfiguration(index, 'areaValue', cleanMoneyInput(event.target.value))} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#f5f1e8] outline-none" placeholder="Enter area" /></span>
                </label>
                <label className="block text-xs font-medium text-[#9caaa4]">
                  <span className="mb-1.5 block">Area unit <span className="font-normal">(optional)</span></span>
                  <select value={configuration.areaUnit} onChange={(event) => updateConfiguration(index, 'areaUnit', event.target.value)} className={inputClass}>
                    <option value="">Select unit</option><option value="SQ_FT">sq. ft.</option><option value="SQ_M">sq. m.</option><option value="CENT">cent</option><option value="ACRE">acre</option><option value="OTHER">Other</option>
                  </select>
                  {values.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(values.propertySubtype) && <span className="mt-1 block text-[11px] leading-5 text-[#82918b]">This unit applies to the built-up, carpet, and super built-up area values for this option.</span>}
                </label>
                {configuration.areaUnit === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
                  <span className="mb-1.5 block">Mention the unit <span className="font-normal">(optional)</span></span>
                  <input maxLength={80} value={configuration.customAreaUnit} onChange={(event) => updateConfiguration(index, 'customAreaUnit', event.target.value)} className={inputClass} />
                </label>}
                {!(['Villa', 'Independent House'].includes(values.propertySubtype) && values.propertyType === 'RESIDENTIAL') && <label className="block text-xs font-medium text-[#9caaa4]">
                  <span className="mb-1.5 block">Area basis <span className="font-normal">(optional)</span></span>
                  <select value={configuration.areaBasis} onChange={(event) => updateConfiguration(index, 'areaBasis', event.target.value)} className={inputClass}>
                    <option value="">Select area basis</option><option value="PLOT_AREA">Plot area</option><option value="BUILT_UP_AREA">Built-up area</option><option value="CARPET_AREA">Carpet area</option><option value="OTHER">Other</option>
                  </select>
                </label>}
                {!(['Villa', 'Independent House'].includes(values.propertySubtype) && values.propertyType === 'RESIDENTIAL') && configuration.areaBasis === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
                  <span className="mb-1.5 block">Mention the basis of area <span className="font-normal">(optional)</span></span>
                  <input maxLength={100} value={configuration.customAreaBasis} onChange={(event) => updateConfiguration(index, 'customAreaBasis', event.target.value)} className={inputClass} />
                </label>}
                {values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' && <>
                  <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Number of bedrooms <span className="font-normal">(optional)</span></span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={configuration.bedroomCount} onChange={(event) => updateConfiguration(index, 'bedroomCount', event.target.value)} className={inputClass} placeholder="e.g. 2" /></label>
                  <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Number of bathrooms <span className="font-normal">(optional)</span></span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={configuration.bathroomCount} onChange={(event) => updateConfiguration(index, 'bathroomCount', event.target.value)} className={inputClass} placeholder="e.g. 2" /></label>
                  <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Floor number <span className="font-normal">(optional)</span></span><input maxLength={60} value={configuration.floorNumber} onChange={(event) => updateConfiguration(index, 'floorNumber', event.target.value)} className={inputClass} placeholder="e.g. 5, Ground, 2–4" /></label>
                </>}
                <div className="sm:col-span-2 mt-2 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold text-white">Configuration pricing</h3><p className="mt-1 text-xs text-[#9caaa4]">Optional price and charges for this specific option.</p></div>
                <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Price mode <span className="font-normal">(optional)</span></span><select value={configuration.priceMode} onChange={(event) => { updateConfiguration(index, 'priceMode', event.target.value); if (event.target.value === 'ON_REQUEST') updateConfiguration(index, 'priceAmount', ''); }} className={inputClass}><option value="">Select price mode</option><option value="EXACT">Exact price</option><option value="STARTING_FROM">Starting from</option><option value="ON_REQUEST">On request</option><option value="EARLY_BIRD">Early Bird</option></select></label>
                {configuration.priceMode !== 'ON_REQUEST' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Price amount (INR) <span className="font-normal">(optional)</span></span><span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><span className="px-3 text-sm text-[#f5f1e8]" aria-hidden="true">₹</span><input aria-label={`Option ${index + 1} price amount in Indian rupees`} inputMode="decimal" value={formatMoneyInput(configuration.priceAmount)} onChange={(event) => updateConfiguration(index, 'priceAmount', cleanMoneyInput(event.target.value))} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="Enter amount" /></span></label>}
                <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Price basis <span className="font-normal">(optional)</span></span><select value={configuration.priceBasis} onChange={(event) => updateConfiguration(index, 'priceBasis', event.target.value)} className={inputClass}><option value="">Select price basis</option><option value="TOTAL_PRICE">Total price</option><option value="PER_SQFT">Per sq. ft.</option><option value="PER_CENT">Per cent</option><option value="OTHER">Other</option></select></label>
                {configuration.priceBasis === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Price basis unit <span className="font-normal">(optional)</span></span><span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><span className="px-3 text-sm text-[#9caaa4]">per</span><input maxLength={80} value={configuration.customPriceBasis} onChange={(event) => updateConfiguration(index, 'customPriceBasis', event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="e.g. acre" /></span></label>}
                <div className="sm:col-span-2 border-t border-white/10 pt-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-xs font-medium text-[#9caaa4]">Additional charges <span className="font-normal">(optional)</span></h4><p className="mt-1 text-xs text-[#82918b]">Add charges that apply to this option and are not included in its price.</p></div><button type="button" onClick={() => addConfigurationCharge(index)} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-semibold text-white transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Plus className="h-3.5 w-3.5" /> Add charge</button></div>
                  {configuration.additionalCharges.length > 0 && <div className="mt-3 space-y-3">{configuration.additionalCharges.map((charge, chargeIndex) => <div key={chargeIndex} className="grid gap-3 border border-white/10 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Charge name</span><input maxLength={120} value={charge.label} onChange={(event) => updateConfigurationCharge(index, chargeIndex, 'label', event.target.value)} className={inputClass} placeholder="e.g. Registration charges" /></label><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Amount (INR)</span><span className="flex min-h-11 items-center border border-white/15 bg-[#09221c] focus-within:border-[var(--gold)]"><span className="px-3 text-sm text-[#f5f1e8]" aria-hidden="true">₹</span><input aria-label={`Option ${index + 1} charge ${chargeIndex + 1} amount in Indian rupees`} inputMode="decimal" value={formatMoneyInput(charge.amount)} onChange={(event) => updateConfigurationCharge(index, chargeIndex, 'amount', cleanMoneyInput(event.target.value))} className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-[#f5f1e8] outline-none" placeholder="Enter amount" /></span></label><button type="button" aria-label={`Remove charge ${chargeIndex + 1} from option ${index + 1}`} onClick={() => removeConfigurationCharge(index, chargeIndex)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-3 text-xs text-[#d7b3a9] hover:border-red-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /><span className="sm:sr-only">Remove</span></button></div>)}</div>}
                </div>
                {values.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(values.propertySubtype) && <>
                  <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Carpet area <span className="font-normal">(optional)</span></span><input inputMode="decimal" value={formatMoneyInput(configuration.carpetArea)} onChange={(event) => updateConfiguration(index, 'carpetArea', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="Enter carpet area" /></label>
                  {values.propertySubtype === 'Villa' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Super built-up area <span className="font-normal">(optional, if applicable)</span></span><input inputMode="decimal" value={formatMoneyInput(configuration.superBuiltUpArea)} onChange={(event) => updateConfiguration(index, 'superBuiltUpArea', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="Enter super built-up area" /></label>}
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xs font-medium text-[#9caaa4]">Room configuration <span className="font-normal">(optional)</span></h3><button type="button" disabled={configuration.roomConfiguration.length >= 30} onClick={() => setValues((current) => ({ ...current, configurations: current.configurations.map((item, itemIndex) => itemIndex === index ? { ...item, roomConfiguration: [...item.roomConfiguration, { name: '', count: '' }] } : item) }))} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-semibold text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Add room</button></div>
                    {configuration.roomConfiguration.length > 0 && <div className="mt-3 space-y-2">{configuration.roomConfiguration.map((room, roomIndex) => <div key={roomIndex} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Room name</span><input maxLength={100} value={room.name} onChange={(event) => setValues((current) => ({ ...current, configurations: current.configurations.map((item, itemIndex) => itemIndex === index ? { ...item, roomConfiguration: item.roomConfiguration.map((row, rowIndex) => rowIndex === roomIndex ? { ...row, name: event.target.value } : row) } : item) }))} className={inputClass} placeholder="e.g. Bedroom" /></label><label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Count</span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={room.count} onChange={(event) => setValues((current) => ({ ...current, configurations: current.configurations.map((item, itemIndex) => itemIndex === index ? { ...item, roomConfiguration: item.roomConfiguration.map((row, rowIndex) => rowIndex === roomIndex ? { ...row, count: event.target.value } : row) } : item) }))} className={inputClass} placeholder="e.g. 3" /></label><button type="button" aria-label={`Remove room ${roomIndex + 1} from option ${index + 1}`} onClick={() => setValues((current) => ({ ...current, configurations: current.configurations.map((item, itemIndex) => itemIndex === index ? { ...item, roomConfiguration: item.roomConfiguration.filter((_, rowIndex) => rowIndex !== roomIndex) } : item) }))} className="inline-flex min-h-11 items-center justify-center border border-white/15 px-3 text-xs text-[#d7b3a9] hover:border-red-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /><span className="sr-only">Remove room</span></button></div>)}</div>}
                  </div>
                </>}
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-medium text-[#9caaa4]">Dimensions <span className="font-normal">(optional)</span></h3>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Length</span><input inputMode="decimal" value={formatMoneyInput(configuration.dimensionLength)} onChange={(event) => updateConfiguration(index, 'dimensionLength', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="Length" /></label>
                    <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Width</span><input inputMode="decimal" value={formatMoneyInput(configuration.dimensionWidth)} onChange={(event) => updateConfiguration(index, 'dimensionWidth', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="Width" /></label>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Configuration-specific notes <span className="font-normal">(optional)</span></h3>
                  <PrivateNotesEditor id={`property-configuration-notes-${property?.id ?? 'new'}-${index}`} label={`Option ${index + 1} notes in Markdown`} placeholder="Add details for this option. Markdown is supported." maxLength={20_000} value={configuration.notesMarkdown} onChange={(value) => updateConfiguration(index, 'notesMarkdown', value)} />
                </div>
                <button type="button" aria-label={`Remove option ${index + 1}`} onClick={() => setValues((current) => ({ ...current, configurations: current.configurations.filter((_, configurationIndex) => configurationIndex !== index) }))} className="inline-flex min-h-10 w-fit items-center gap-2 border border-white/15 px-3 text-xs text-[#d7b3a9] transition-colors hover:border-red-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /> Remove option</button>
              </div>
            </fieldset>)}
          </div>
          <button type="button" onClick={addConfiguration} disabled={values.configurations.length >= 20} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 text-xs font-semibold text-white transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Add configuration / option</button>
        </section>

        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">APPROVALS &amp; PROJECT DETAILS</p>
          <h2 className="mt-1 font-display text-2xl text-white">Approvals, project details and amenities</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Enter details provided or verified for this listing. Private supporting documents can be uploaded in the administrator-only document area below.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold text-white">Project overview</h3><p className="mt-1 text-xs leading-5 text-[#9caaa4]">Optional project-wide details. These can be repeated on each property listing in the same project.</p></div>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Total project land area (acres) <span className="font-normal">(optional)</span></span><input inputMode="decimal" value={formatMoneyInput(values.projectTotalLandArea)} onChange={(event) => update('projectTotalLandArea', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="e.g. 7.5" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Phase land area (acres) <span className="font-normal">(optional)</span></span><input inputMode="decimal" value={formatMoneyInput(values.projectPhaseLandArea)} onChange={(event) => update('projectPhaseLandArea', cleanMoneyInput(event.target.value))} className={inputClass} placeholder="e.g. 3.02" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Apartment units in project <span className="font-normal">(optional)</span></span><input type="number" min="0" max="100000" step="1" inputMode="numeric" value={values.projectApartmentCount} onChange={(event) => update('projectApartmentCount', event.target.value)} className={inputClass} placeholder="e.g. 150" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Villa units in project <span className="font-normal">(optional)</span></span><input type="number" min="0" max="100000" step="1" inputMode="numeric" value={values.projectVillaCount} onChange={(event) => update('projectVillaCount', event.target.value)} className={inputClass} placeholder="e.g. 26" /></label>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Project features <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="property-project-features-markdown" label="Project features in Markdown" placeholder="List confirmed project infrastructure and services, such as CCTV, lifts, power backup, and EV charging." maxLength={20_000} value={values.projectFeaturesMarkdown} onChange={(value) => update('projectFeaturesMarkdown', value)} /></div>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Approval / registration number <span className="font-normal">(optional)</span></span><input maxLength={160} value={values.approvalReference} onChange={(event) => update('approvalReference', event.target.value)} className={inputClass} placeholder="e.g. RERA registration number" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Approving authority <span className="font-normal">(optional)</span></span><input maxLength={200} value={values.approvalAuthority} onChange={(event) => update('approvalAuthority', event.target.value)} className={inputClass} placeholder="Name of the authority that approved the project" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Current phase of project <span className="font-normal">(optional)</span></span><select value={values.projectPhase} onChange={(event) => update('projectPhase', event.target.value)} className={inputClass}><option value="">Select project phase</option><option value="1">1 · Initiation &amp; Conception</option><option value="2">2 · Planning &amp; Design</option><option value="3">3 · Pre-Construction</option><option value="4">4 · Procurement</option><option value="5">5 · Construction</option><option value="6">6 · Post-Construction / Closeout</option></select></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Status of construction / development <span className="font-normal">(optional)</span></span><input maxLength={300} value={values.constructionStatus} onChange={(event) => update('constructionStatus', event.target.value)} className={inputClass} placeholder="e.g. Foundation work in progress" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Expected handover date <span className="font-normal">(optional)</span></span><input type="date" value={values.handoverDate} onChange={(event) => update('handoverDate', event.target.value)} className={inputClass} /></label>
            <fieldset className="sm:col-span-2"><legend className="text-xs font-medium text-[#9caaa4]">Statutory approvals <span className="font-normal">(optional, select all that apply)</span></legend><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{[['CMDA','CMDA'],['DTCP','DTCP'],['RERA','RERA'],['OTHER','Other']] .map(([value,label]) => <label key={value} className="inline-flex min-h-9 items-center gap-2 text-sm text-[#d8dfdb]"><input type="checkbox" checked={values.statutoryApprovals.includes(value)} onChange={(event) => update('statutoryApprovals', event.target.checked ? [...values.statutoryApprovals, value] : values.statutoryApprovals.filter((item) => item !== value))} className="accent-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]" />{label}</label>)}</div></fieldset>
            {values.statutoryApprovals.includes('OTHER') && <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2"><span className="mb-1.5 block">Mention other approvals</span><input required maxLength={300} value={values.otherStatutoryApprovals} onChange={(event) => update('otherStatutoryApprovals', event.target.value)} className={inputClass} /></label>}
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Amenities and facilities <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="property-amenities-markdown" label="Amenities and facilities in Markdown" placeholder="List amenities and facilities confirmed for this property." maxLength={20_000} value={values.amenitiesMarkdown} onChange={(value) => update('amenitiesMarkdown', value)} /></div>
            <a href="#property-private-documents" className="inline-flex min-h-10 w-fit items-center border border-white/20 px-3 text-xs font-medium text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">Upload private supporting documents</a>
          </div>
        </section>

        {values.propertyType === 'LAND_PLOT' && <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">PLOT &amp; LAND DETAILS</p>
          <h2 className="mt-1 font-display text-2xl text-white">Land information</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Optional details that help customers assess the plot. Add only information verified or supplied for this listing.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Road access <span className="font-normal">(optional)</span></span><input maxLength={300} value={values.roadAccess} onChange={(event) => update('roadAccess', event.target.value)} className={inputClass} placeholder="e.g. 30 ft road frontage" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Land approved for <span className="font-normal">(optional)</span></span><select value={values.landApprovedFor} onChange={(event) => update('landApprovedFor', event.target.value)} className={inputClass}><option value="">Select permitted use</option><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option><option value="MIXED_USE">Mixed-use</option></select></label>
            {([
              { field: 'waterSources', title: 'Water supply', other: 'otherWaterSource', choices: [['MUNICIPAL','Municipal water connection'],['BOREWELL','Borewell potential'],['OVERHEAD_TANK','Overhead tank'],['OTHER','Other'],['NOT_CONFIRMED','Not confirmed']] },
              { field: 'electricitySources', title: 'Electricity', other: 'otherElectricitySource', choices: [['GRID','Grid connection'],['GENERATOR','Generator backup'],['SOLAR','Solar'],['OTHER','Other'],['NOT_CONFIRMED','Not confirmed']] },
              { field: 'drainageOptions', title: 'Drainage and sewage', other: 'otherDrainageOption', choices: [['STORMWATER','Stormwater drains'],['UNDERGROUND_SEWAGE','Underground sewage lines'],['SEPTIC_TANK','Septic tank system'],['OTHER','Other'],['NOT_CONFIRMED','Not confirmed']] },
            ] as const).map(({ field, title, other, choices }) => <fieldset key={field} className="sm:col-span-2"><legend className="text-xs font-medium text-[#9caaa4]">{title} <span className="font-normal">(optional, select all that apply)</span></legend><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{choices.map(([value,label]) => <label key={value} className="inline-flex min-h-9 items-center gap-2 text-sm text-[#d8dfdb]"><input type="checkbox" checked={values[field].includes(value)} onChange={(event) => update(field, event.target.checked ? [...values[field], value] : values[field].filter((item) => item !== value))} className="accent-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]" />{label}</label>)}</div>{values[field].includes('OTHER') && <label className="mt-3 block max-w-xl text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Mention other {title.toLowerCase()}</span><input required maxLength={200} value={values[other]} onChange={(event) => update(other, event.target.value)} className={inputClass} /></label>}</fieldset>)}
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Proximity to key landmarks <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="plot-proximity-markdown" label="Nearby landmarks in Markdown" placeholder="Add known distances or travel times to landmarks." maxLength={20_000} value={values.proximityMarkdown} onChange={(value) => update('proximityMarkdown', value)} /></div>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Layout plans <span className="font-normal">(optional)</span></h3><p className="mb-3 text-xs text-[#9caaa4]">Upload public-facing layout plans as PDF, JPEG, PNG, or WebP. These are separate from private verification documents.</p><PropertyLayoutDocuments propertyId={property?.id ?? createdPropertyId} /></div>
          </div>
        </section>}

        {values.propertyType === 'RESIDENTIAL' && values.propertySubtype === 'Apartment' && <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">APARTMENT DETAILS</p>
          <h2 className="mt-1 font-display text-2xl text-white">Apartment information</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Optional furnishing, amenities, and nearby landmark details. Address and locality are taken from Basic Property Information above.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Furnishing status <span className="font-normal">(optional)</span></span><select value={values.furnishingStatus} onChange={(event) => update('furnishingStatus', event.target.value)} className={inputClass}><option value="">Select furnishing status</option><option value="FULLY_FURNISHED">Fully furnished</option><option value="SEMI_FURNISHED">Semi-furnished</option><option value="UNFURNISHED">Unfurnished</option><option value="OTHER">Other</option></select></label>
            {values.furnishingStatus === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Enter furnishing status</span><input required maxLength={120} value={values.furnishingStatusOther} onChange={(event) => update('furnishingStatusOther', event.target.value)} className={inputClass} /></label>}
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Proximity to key landmarks <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="apartment-proximity-markdown" label="Nearby landmarks in Markdown" placeholder="Add known distances or travel times to landmarks." maxLength={20_000} value={values.proximityMarkdown} onChange={(value) => update('proximityMarkdown', value)} /></div>
          </div>
        </section>}

        {values.propertyType === 'RESIDENTIAL' && ['Villa', 'Independent House'].includes(values.propertySubtype) && <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">VILLA &amp; INDEPENDENT HOUSE DETAILS</p>
          <h2 className="mt-1 font-display text-2xl text-white">Home and neighborhood details</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Add confirmed details for this home. Use the existing Plot size field for the land area; location and map fields are above.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Facing direction <span className="font-normal">(optional)</span></span><select value={values.facingDirection} onChange={(event) => update('facingDirection', event.target.value)} className={inputClass}><option value="">Select facing direction</option><option value="NORTH">North</option><option value="SOUTH">South</option><option value="EAST">East</option><option value="WEST">West</option><option value="NORTH_EAST">North-East</option><option value="NORTH_WEST">North-West</option><option value="SOUTH_EAST">South-East</option><option value="SOUTH_WEST">South-West</option><option value="OTHER">Other</option></select></label>
            {values.facingDirection === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Enter facing direction</span><input required maxLength={120} value={values.facingOther} onChange={(event) => update('facingOther', event.target.value)} className={inputClass} /></label>}
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Sunlight orientation <span className="font-normal">(optional)</span></span><input maxLength={300} value={values.sunlightOrientation} onChange={(event) => update('sunlightOrientation', event.target.value)} className={inputClass} placeholder="Describe known light exposure or orientation" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Neighborhood type <span className="font-normal">(optional)</span></span><select value={values.neighborhoodType} onChange={(event) => update('neighborhoodType', event.target.value)} className={inputClass}><option value="">Select neighborhood type</option><option value="STANDALONE">Standalone property</option><option value="GATED_COMMUNITY">Gated community / villa township</option><option value="OTHER">Other</option></select></label>
            {values.neighborhoodType === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Enter neighborhood type</span><input required maxLength={120} value={values.neighborhoodTypeOther} onChange={(event) => update('neighborhoodTypeOther', event.target.value)} className={inputClass} /></label>}
            {values.propertySubtype === 'Independent House' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Number of floors <span className="font-normal">(optional)</span></span><input type="number" min="1" max="100" step="1" inputMode="numeric" value={values.floorCount} onChange={(event) => update('floorCount', event.target.value)} className={inputClass} placeholder="e.g. 2" /></label>}
            <label className="block text-xs font-medium text-[#9caaa4] sm:col-span-2"><span className="mb-1.5 block">Public approval details <span className="font-normal">(optional)</span></span><textarea maxLength={5000} rows={3} value={values.publicComplianceSummary} onChange={(event) => update('publicComplianceSummary', event.target.value)} className={inputClass} placeholder="List supplied approval names and reference numbers only, such as a RERA registration number." /><span className="mt-1 block text-[11px] leading-5 text-[#82918b]">Keep title deeds and private clearance documents in Verification Documents. This summary may be shown publicly.</span></label>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Proximity to key landmarks <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="villa-house-proximity-markdown" label="Nearby landmarks in Markdown" placeholder="Add known distances or travel times to landmarks." maxLength={20_000} value={values.proximityMarkdown} onChange={(value) => update('proximityMarkdown', value)} /></div>
          </div>
        </section>}

        {values.propertyType === 'COMMERCIAL' && <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">COMMERCIAL DETAILS</p>
          <h2 className="mt-1 font-display text-2xl text-white">Commercial property information</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Add commercial use and operating details that are known and approved for public display. Location, areas, pricing, photos, and videos use the shared property sections.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Commercial use <span className="font-normal">(optional)</span></span><select value={values.commercialUse} onChange={(event) => update('commercialUse', event.target.value)} className={inputClass}><option value="">Select commercial use</option><option value="RETAIL">Retail</option><option value="OFFICE">Office</option><option value="INDUSTRIAL">Industrial</option><option value="WAREHOUSE">Warehouse</option><option value="MIXED_USE">Mixed-use</option><option value="OTHER">Other</option></select></label>
            {values.commercialUse === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Describe commercial use</span><input required maxLength={120} value={values.commercialUseOther} onChange={(event) => update('commercialUseOther', event.target.value)} className={inputClass} /></label>}
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Year built <span className="font-normal">(optional)</span></span><input type="number" min="1800" max="2100" step="1" inputMode="numeric" value={values.yearBuilt} onChange={(event) => update('yearBuilt', event.target.value)} className={inputClass} placeholder="YYYY" /></label>
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Transaction type <span className="font-normal">(optional)</span></span><select value={values.transactionType} onChange={(event) => update('transactionType', event.target.value)} className={inputClass}><option value="">Select transaction type</option><option value="SALE">Sale</option><option value="LEASE">Lease</option><option value="RENT">Rent</option></select></label>
            {['LEASE', 'RENT'].includes(values.transactionType) && <>
              <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Lease expiry date <span className="font-normal">(optional)</span></span><input type="date" value={values.leaseExpiryDate} onChange={(event) => update('leaseExpiryDate', event.target.value)} className={inputClass} /></label>
              <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Lease structure <span className="font-normal">(optional)</span></h3><p className="mb-2 text-[11px] leading-5 text-[#82918b]">Include relevant supplied terms such as maintenance/CAM charges, taxes, insurance, or whether the rent is gross or net.</p><PrivateNotesEditor id="commercial-lease-structure" label="Lease structure details in Markdown" placeholder="Add confirmed lease or rental terms." maxLength={20_000} value={values.leaseStructureMarkdown} onChange={(value) => update('leaseStructureMarkdown', value)} /></div>
            </>}
            <label className="block text-xs font-medium text-[#9caaa4]"><span className="mb-1.5 block">Occupancy <span className="font-normal">(optional)</span></span><select value={values.occupancyStatus} onChange={(event) => update('occupancyStatus', event.target.value)} className={inputClass}><option value="">Select occupancy</option><option value="VACANT">Vacant</option><option value="PARTIALLY_OCCUPIED">Partially occupied</option><option value="OCCUPIED">Occupied</option><option value="NOT_DISCLOSED">Not disclosed</option></select></label>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Tenant or occupancy profile <span className="font-normal">(optional)</span></h3><p className="mb-2 text-[11px] leading-5 text-[#82918b]">Add only public-facing, non-sensitive details relevant to the listing.</p><PrivateNotesEditor id="commercial-tenant-profile" label="Tenant and occupancy details in Markdown" placeholder="Add relevant tenant profile, vacancy, or lease information supplied for publication." maxLength={20_000} value={values.tenantProfileMarkdown} onChange={(value) => update('tenantProfileMarkdown', value)} /></div>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Recent upgrades <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="commercial-upgrades" label="Recent upgrades in Markdown" placeholder="Describe confirmed recent improvements or upgrades." maxLength={20_000} value={values.recentUpgradesMarkdown} onChange={(value) => update('recentUpgradesMarkdown', value)} /></div>
            <div className="sm:col-span-2"><h3 className="mb-2 text-xs font-medium text-[#9caaa4]">Proximity to key landmarks <span className="font-normal">(optional)</span></h3><PrivateNotesEditor id="commercial-proximity" label="Nearby landmarks in Markdown" placeholder="Add known distances or travel times to landmarks." maxLength={20_000} value={values.proximityMarkdown} onChange={(value) => update('proximityMarkdown', value)} /></div>
          </div>
        </section>}

        <section className="border-t border-white/15 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">LISTING SOURCE</p>
          <h2 className="mt-1 font-display text-2xl text-white">Listing source and representation</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9caaa4]">Record who supplied this opportunity, their relationship to it, and JLUXE&apos;s role. Internal contact details and verification records remain private to administrators.</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Source category</span>
              <select value={values.sourceCategory} onChange={(event) => update('sourceCategory', event.target.value)} className={inputClass}>
                <option value="">Select source category</option>
                {propertySourceCategories.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            {values.sourceCategory === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Enter the category *</span>
              <input required maxLength={120} value={values.sourceCategoryOther} onChange={(event) => update('sourceCategoryOther', event.target.value)} className={inputClass} />
            </label>}
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Seller / organization name</span>
              <input maxLength={200} value={values.sellerOrganizationName} onChange={(event) => update('sellerOrganizationName', event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Submitter&apos;s relationship to the property</span>
              <select value={values.submitterRelationship} onChange={(event) => update('submitterRelationship', event.target.value)} className={inputClass}>
                <option value="">Select relationship</option>
                {propertySubmitterRelationships.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            {values.submitterRelationship === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Enter the relationship of Submitter to the Property *</span>
              <input required maxLength={160} value={values.submitterRelationshipOther} onChange={(event) => update('submitterRelationshipOther', event.target.value)} className={inputClass} />
            </label>}
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">JLUXE&apos;s role *</span>
              <select required value={values.representationType} onChange={(event) => update('representationType', event.target.value)} className={inputClass}>
                <option value="">Select representation</option>
                {representationTypes.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
            </label>
            {values.representationType === 'OTHER' && <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Enter the role of Representation *</span>
              <input required maxLength={160} value={values.representationRoleOther} onChange={(event) => update('representationRoleOther', event.target.value)} className={inputClass} />
            </label>}
            <label className="block text-xs font-medium text-[#9caaa4]">
              <span className="mb-1.5 block">Authority verification</span>
              <select value={values.authorityVerificationStatus} onChange={(event) => update('authorityVerificationStatus', event.target.value as AuthorityVerificationStatus)} className={inputClass}>
                {authorityVerificationStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
              </select>
              <span className="mt-1.5 block font-normal leading-5 text-[#82918b]">Use In review while checking the seller&apos;s authority. Select Verified only after the supporting details have been checked.</span>
            </label>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold text-white">Internal contact details</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <label className="block text-xs font-medium text-[#9caaa4]">
                <span className="mb-1.5 block">Contact name</span>
                <input maxLength={150} value={values.internalContactName} onChange={(event) => update('internalContactName', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-[#9caaa4]">
                <span className="mb-1.5 block">Phone number</span>
                <input type="tel" autoComplete="tel" maxLength={32} value={values.internalContactPhone} onChange={(event) => update('internalContactPhone', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-[#9caaa4]">
                <span className="mb-1.5 block">Email</span>
                <input type="email" autoComplete="email" maxLength={320} value={values.internalContactEmail} onChange={(event) => update('internalContactEmail', event.target.value)} className={inputClass} />
              </label>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 id="property-private-documents" className="text-sm font-semibold text-white">Private notes and supporting documents</h3>
            <p className="mt-1 text-xs leading-5 text-[#9caaa4]">These records are admin-only and are not included in public property pages.</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Choose private information type</legend>
              <div className="inline-flex flex-wrap gap-2">
                {(['notes', 'documents'] as const).map((view) => (
                  <label key={view} className="cursor-pointer">
                    <input type="radio" name="source-detail-view" value={view} checked={sourceDetailView === view} onChange={() => setSourceDetailView(view)} className="peer sr-only" />
                    <span className={`inline-flex min-h-10 items-center border px-4 text-xs font-semibold transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--gold)] ${sourceDetailView === view ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--viridian-950)]' : 'border-white/20 text-[#c3ccc6] hover:border-white/40'}`}>{view === 'notes' ? 'Private Notes' : 'Supporting Documents'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-3">
              {sourceDetailView === 'notes'
                ? <PrivateNotesEditor value={values.privateNotesMarkdown} onChange={(value) => update('privateNotesMarkdown', value)} />
                : <PropertyVerificationDocuments propertyId={property?.id ?? createdPropertyId} />}
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" aria-live="assertive" className="border-l-2 border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <p>{error}</p>
            {fieldErrors.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
              {fieldErrors.map((issue, index) => <li key={`${issue.label}-${index}`}>
                <button type="button" onClick={() => focusFieldIssue(issue)} className="text-left underline decoration-red-200/60 underline-offset-2 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {issue.label}{issue.message ? ` — ${issue.message}` : ''}
                </button>
              </li>)}
            </ul>}
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-white/15 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : property ? 'Save changes' : 'Create property'}
          </button>
          <Link
            href="/admin/properties"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Media Management Section for existing property */}
      {(
        <section className="mt-12 border-t border-white/15 pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">MEDIA &amp; GALLERY</p>
              <h2 className="mt-1 font-display text-2xl text-white">Associated property images</h2>
              <p className="mt-1 text-xs text-[#9caaa4]">
                The first image (Position 0) serves as the listing cover image. Reorder or change cover as needed.
              </p>
            </div>
          </div>

          {mediaNotice && (
            <div
              role="status"
              className={`mt-4 border-l-2 px-3 py-2 text-sm ${
                mediaNotice.type === 'success'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-500 bg-red-950/40 text-red-200'
              }`}
            >
              {mediaNotice.text}
            </div>
          )}

          {/* Attached images list */}
          <div className="mt-5 flex flex-wrap gap-2">
            <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded bg-[var(--viridian-800)] px-4 text-sm font-medium text-white ${uploading || mediaActionPending ? 'cursor-not-allowed opacity-50' : ''}`}>
              {uploading ? 'Uploading…' : '+ Upload Images'}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading || mediaActionPending || mediaList.length >= 12} className="sr-only" onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = ''; }} />
            </label>
            <span className="text-xs self-center text-[#9caaa4]">Or choose an image from the existing Media list below.</span>
          </div>

          <div className="mt-6 space-y-3">
            {mediaList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/20 bg-[#08201b] p-6 text-center text-sm text-[#9caaa4]">
                No images attached yet. Select an image from the library below to attach it to this property.
              </p>
            ) : (
              mediaList.map((item, index) => {
                const isCover = index === 0;
                return (
                  <div
                    key={item.mediaId}
                    className={`flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                      isCover
                        ? 'border-[var(--gold)]/60 bg-[#0c2a23]'
                        : 'border-white/10 bg-[#08201b]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(item)}
                        aria-label={`Preview property image ${index + 1}`}
                        className="relative h-16 w-24 shrink-0 overflow-hidden rounded border border-white/10 bg-[var(--sand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                      >
                        <img
                          src={item.deliveryUrl ?? getMediaImageUrl(item.storageKey, 'property')}
                          alt={item.altText ?? 'Property thumbnail'}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getMediaImageUrl(null, 'property');
                          }}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#9caaa4]">
                            #{index + 1}
                          </span>
                          {isCover && (
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--viridian-950)]">
                              <Star className="h-3 w-3 fill-current" /> Cover Image
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-white/70">{item.storageKey}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(item)}
                        aria-label={`Preview property image ${index + 1}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      {getAttachedMediaDownloadUrl(item) ? (
                        <a
                          href={getAttachedMediaDownloadUrl(item) ?? undefined}
                          download={item.storageKey.split('/').pop() || `property-image-${index + 1}`}
                          aria-label={`Download property image ${index + 1}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      ) : null}
                      {!isCover && (
                        <button
                          type="button"
                          disabled={mediaActionPending}
                          onClick={() => handleMakeCover(index)}
                          className="inline-flex min-h-9 items-center gap-1 rounded border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 text-xs font-medium text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/20 disabled:opacity-40"
                        >
                          <Star className="h-3.5 w-3.5" /> Make cover
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={index === 0 || mediaActionPending}
                        onClick={() => handleMoveUp(index)}
                        aria-label="Move image up"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === mediaList.length - 1 || mediaActionPending}
                        onClick={() => handleMoveDown(index)}
                        aria-label="Move image down"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={mediaActionPending}
                        onClick={() => handleRemoveMedia(item.mediaId)}
                        aria-label="Remove image from property"
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-500/30 bg-red-950/30 text-red-300 transition-colors hover:bg-red-900/50 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {previewMedia && (
            <dialog
              ref={previewDialogRef}
              aria-label="Property image preview"
              onCancel={(event) => { event.preventDefault(); setPreviewMedia(null); }}
              onClose={() => setPreviewMedia(null)}
              onClick={(event) => { if (event.target === event.currentTarget) setPreviewMedia(null); }}
              className="fixed inset-0 m-auto max-h-[92vh] w-[min(96vw,1100px)] max-w-none overflow-hidden border border-white/15 bg-[#061a15] p-0 text-white shadow-2xl backdrop:bg-black/80"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">IMAGE PREVIEW</p>
                  <p className="mt-1 truncate font-mono text-xs text-[#9caaa4]">{previewMedia.storageKey}</p>
                </div>
                <button type="button" autoFocus onClick={() => setPreviewMedia(null)} aria-label="Close image preview" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/15 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex max-h-[calc(92vh-64px)] min-h-40 items-center justify-center bg-black/30 p-3 sm:p-6">
                <img
                  src={previewMedia.deliveryUrl ?? getMediaImageUrl(previewMedia.storageKey, 'property')}
                  alt={previewMedia.altText ?? 'Property image preview'}
                  className="max-h-[calc(92vh-112px)] max-w-full object-contain"
                />
              </div>
            </dialog>
          )}

          <div className="mt-6">
            <button type="button" onClick={() => setMediaPickerOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 rounded border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/5">
              <Plus className="h-4 w-4" /> Choose from Media
            </button>
            {mediaPickerOpen && <div role="dialog" aria-label="Choose existing media" className="mt-3 rounded-lg border border-white/15 bg-[#08201b] p-4">
              <p className="text-xs text-[#9caaa4]">Choose one or more existing images. Selecting them creates only a PropertyMedia relationship.</p>
              {mediaLoading ? <p className="py-5 text-sm text-[#9caaa4]">Loading media…</p> : mediaOptions.length === 0 ? <p className="py-5 text-sm text-[#9caaa4]">No media available in the library.</p> : <div className="mt-3 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                {mediaOptions.map((media) => {
                  const attached = mediaList.some((item) => item.mediaId === media.id);
                  const selected = selectedMediaIdsToAdd.includes(media.id);
                  return <label key={media.id} className={`cursor-pointer overflow-hidden rounded border ${attached ? 'border-emerald-500/50 opacity-60' : selected ? 'border-[var(--gold)]' : 'border-white/10'}`}>
                    <img src={media.deliveryUrl ?? getMediaImageUrl(media.storageKey, 'property')} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="flex items-start gap-2 p-2"><input type="checkbox" checked={attached || selected} disabled={attached || mediaActionPending} onChange={() => setSelectedMediaIdsToAdd((current) => selected ? current.filter((id) => id !== media.id) : [...current, media.id])} className="mt-0.5 accent-[var(--gold)]" />
                      <span className="min-w-0"><span className="block truncate text-xs text-white">{media.storageKey.split('/').pop()}</span><span className="block text-[10px] text-[#9caaa4]">{media.mimeType}{media.byteSize ? ` · ${(Number(media.byteSize) / 1024).toFixed(0)} KB` : ''}{attached ? ' · Attached' : ''}</span></span>
                    </div>
                  </label>;
                })}
              </div>}
              <div className="mt-3 flex gap-2"><button type="button" onClick={handleAddMedia} disabled={!selectedMediaIdsToAdd.length || mediaActionPending} className="min-h-10 rounded bg-[var(--viridian-800)] px-4 text-sm text-white disabled:opacity-40">Add selected ({selectedMediaIdsToAdd.length})</button><button type="button" onClick={() => setMediaPickerOpen(false)} className="min-h-10 px-3 text-sm text-[#9caaa4]">Close</button></div>
            </div>}
          </div>
        </section>
      )}
    </div>
  );
}
