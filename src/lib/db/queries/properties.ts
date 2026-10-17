import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl } from '@/lib/cloudinary';
import type {
  Property,
  PropertyConfiguration,
  PropertyMediaItem,
  PropertyStatus,
  PropertyType,
  PublicationStatus,
  UUID,
} from '../types';

export type PropertySort = 'latest' | 'price_asc' | 'price_desc';
export type AdminProperty = Omit<Property, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type PropertyConfigurationInput = Omit<PropertyConfiguration, 'id' | 'propertyId' | 'position'>;

const adminPropertyColumns = `
  "id", "slug", "title", "description", "shortSummary", "location", "propertyType",
  "propertyTypeOther", "propertySubtype", "propertySubtypeOther", "locality", "city",
  "nearbyLandmark", "district", "state", "pincode", "publicAddressMode", "manualPublicAddress",
  "mapLocation", "latitude", "longitude", "priceAmount",
  "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
  "priceBasis", "customPriceBasis", "additionalCharges", "offerDetails",
  "representationType", "sourceCategory", "sourceCategoryOther", "sellerOrganizationName",
  "submitterRelationship", "submitterRelationshipOther", "representationRoleOther",
  "authorityVerificationStatus", "internalContactName", "internalContactPhone",
  "internalContactEmail", "privateNotesMarkdown", "roadAccess", "proximityMarkdown", "landApprovedFor",
  "statutoryApprovals", "otherStatutoryApprovals", "approvalReference", "approvalAuthority", "projectPhase", "projectTotalLandArea", "projectPhaseLandArea", "projectApartmentCount", "projectVillaCount", "projectFeaturesMarkdown", "constructionStatus", "handoverDate", "waterSources", "otherWaterSource",
  "electricitySources", "otherElectricitySource", "drainageOptions", "otherDrainageOption",
  "furnishingStatus", "furnishingStatusOther", "amenitiesMarkdown", "publicationStatus",
  "facingDirection", "facingOther", "sunlightOrientation", "neighborhoodType", "neighborhoodTypeOther", "floorCount", "publicComplianceSummary",
  "commercialUse", "commercialUseOther", "yearBuilt", "recentUpgradesMarkdown", "transactionType", "leaseStructureMarkdown",
  "occupancyStatus", "leaseExpiryDate", "tenantProfileMarkdown", "availabilityOther", "enquiryEnabled", "seoTitle", "seoDescription",
  TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`;
export type PublicProperty = Omit<Pick<
  Property,
  | 'id' | 'slug' | 'title' | 'description' | 'shortSummary' | 'location' | 'propertyType'
  | 'propertyTypeOther' | 'propertySubtype' | 'propertySubtypeOther' | 'locality' | 'city'
  | 'nearbyLandmark' | 'district' | 'state' | 'pincode' | 'publicAddressMode' | 'manualPublicAddress'
  | 'mapLocation' | 'latitude' | 'longitude'
  | 'priceAmount' | 'priceCurrency' | 'priceMode' | 'priceBasis' | 'customPriceBasis' | 'additionalCharges' | 'offerDetails' | 'plotSize' | 'plotSizeUnit'
  | 'status' | 'availabilityOther' | 'enquiryEnabled' | 'seoTitle' | 'seoDescription' | 'representationType' | 'createdAt' | 'roadAccess' | 'proximityMarkdown' | 'landApprovedFor'
  | 'statutoryApprovals' | 'otherStatutoryApprovals' | 'projectPhase' | 'projectFeaturesMarkdown' | 'constructionStatus' | 'handoverDate' | 'waterSources' | 'otherWaterSource'
  | 'electricitySources' | 'otherElectricitySource' | 'drainageOptions' | 'otherDrainageOption'
  | 'furnishingStatus' | 'furnishingStatusOther' | 'amenitiesMarkdown'
  | 'facingDirection' | 'facingOther' | 'sunlightOrientation' | 'neighborhoodType' | 'neighborhoodTypeOther' | 'floorCount' | 'publicComplianceSummary'
  | 'commercialUse' | 'commercialUseOther' | 'yearBuilt' | 'recentUpgradesMarkdown' | 'transactionType' | 'leaseStructureMarkdown' | 'occupancyStatus' | 'leaseExpiryDate' | 'tenantProfileMarkdown'
>, 'createdAt'> & { createdAt: string };

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function listPublicProperties(filters: {
  location?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  sort: PropertySort;
  limit: number;
  offset: number;
}): Promise<{ data: PublicProperty[]; total: number }> {
  const values = [
    filters.location ? escapeLikeValue(filters.location) : null,
    filters.propertyType ?? null,
    filters.status ?? null,
    filters.priceMin ?? null,
    filters.priceMax ?? null,
  ];
  const conditions = `
    "publicationStatus" = 'PUBLISHED'
    AND ($1::text IS NULL OR "location" ILIKE '%' || $1 || '%' ESCAPE E'\\\\')
    AND ($2::"PropertyType" IS NULL OR "propertyType" = $2::"PropertyType")
    AND ($3::"PropertyStatus" IS NULL OR "status" = $3::"PropertyStatus")
    AND ($4::numeric IS NULL OR "priceAmount" >= $4)
    AND ($5::numeric IS NULL OR "priceAmount" <= $5)`;
  const orderBy: Record<PropertySort, string> = {
    latest: '"createdAt" DESC, "id" DESC',
    price_asc: '"priceAmount" ASC NULLS LAST, "id" ASC',
    price_desc: '"priceAmount" DESC NULLS LAST, "id" ASC',
  };

  const [countResult, rowsResult] = await Promise.all([
    pool.query<{ total: string }>(`SELECT COUNT(*) AS "total" FROM "Property" WHERE ${conditions}`, values),
    pool.query<PublicProperty>(
      `SELECT "id", "slug", "title", "description", "shortSummary", "location", "propertyType",
              "propertyTypeOther", "propertySubtype", "propertySubtypeOther", "locality", "city",
              "nearbyLandmark", "district", "state", "pincode", "publicAddressMode", "manualPublicAddress",
              "mapLocation", "latitude", "longitude",
              "priceAmount", "priceCurrency", "priceMode", "priceBasis", "customPriceBasis", "additionalCharges", "offerDetails", "plotSize", "plotSizeUnit",
              "status", "representationType", "roadAccess", "proximityMarkdown", "landApprovedFor",
              "statutoryApprovals", "otherStatutoryApprovals", "projectPhase", "projectFeaturesMarkdown", "constructionStatus", "handoverDate", "waterSources", "otherWaterSource",
              "electricitySources", "otherElectricitySource", "drainageOptions", "otherDrainageOption",
              "furnishingStatus", "furnishingStatusOther", "amenitiesMarkdown",
              "facingDirection", "facingOther", "sunlightOrientation", "neighborhoodType", "neighborhoodTypeOther", "floorCount", "publicComplianceSummary",
              "commercialUse", "commercialUseOther", "yearBuilt", "recentUpgradesMarkdown", "transactionType", "leaseStructureMarkdown",
              "occupancyStatus", "leaseExpiryDate", "tenantProfileMarkdown", "availabilityOther", "enquiryEnabled", "seoTitle", "seoDescription",
              TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
       FROM "Property" WHERE ${conditions}
       ORDER BY ${orderBy[filters.sort]} LIMIT $6 OFFSET $7`,
      [...values, filters.limit, filters.offset],
    ),
  ]);

  return { data: rowsResult.rows, total: Number(countResult.rows[0]?.total ?? 0) };
}

export async function listAdminProperties(filters: {
  search?: string;
  publicationStatus?: PublicationStatus;
  status?: PropertyStatus;
  limit: number;
  offset: number;
}): Promise<{ data: AdminProperty[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [
    escapedSearch ? `%${escapedSearch}%` : null,
    filters.publicationStatus ?? null,
    filters.status ?? null,
  ];
  const conditions = `
    ($1::text IS NULL OR "title" ILIKE $1 ESCAPE E'\\\\' OR "location" ILIKE $1 ESCAPE E'\\\\')
    AND ($2::"PublicationStatus" IS NULL OR "publicationStatus" = $2::"PublicationStatus")
    AND ($3::"PropertyStatus" IS NULL OR "status" = $3::"PropertyStatus")`;

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `SELECT COUNT(*) AS "total" FROM "Property" WHERE ${conditions}`,
      values,
    );
    const rowsResult = await client.query<AdminProperty>(
      `SELECT ${adminPropertyColumns} FROM "Property" WHERE ${conditions}
       ORDER BY "updatedAt" DESC, "id" DESC LIMIT $4 OFFSET $5`,
      [...values, filters.limit, filters.offset],
    );

    return { data: rowsResult.rows, total: Number(countResult.rows[0]?.total ?? 0) };
  });
}

export async function findPropertyById(id: UUID): Promise<AdminProperty | null> {
  const result = await pool.query<AdminProperty>(
    `SELECT ${adminPropertyColumns} FROM "Property" WHERE "id" = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listPropertyConfigurations(propertyId: UUID): Promise<PropertyConfiguration[]> {
  const result = await pool.query<PropertyConfiguration>(
    `SELECT "id", "propertyId", "position", "optionName", "areaValue", "areaUnit",
            "customAreaUnit", "areaBasis", "customAreaBasis", "dimensionLength", "dimensionWidth", "notesMarkdown",
            "priceMode", "priceAmount", "priceBasis", "customPriceBasis", "additionalCharges", "plotNumber",
            "bedroomCount", "bathroomCount", "floorNumber"
            , "carpetArea", "superBuiltUpArea", "roomConfiguration"
     FROM "PropertyConfiguration" WHERE "propertyId" = $1 ORDER BY "position", "id"`,
    [propertyId],
  );
  return result.rows;
}

async function replacePropertyConfigurations(
  client: import('pg').PoolClient,
  propertyId: UUID,
  configurations: PropertyConfigurationInput[] = [],
) {
  await client.query('DELETE FROM "PropertyConfiguration" WHERE "propertyId" = $1', [propertyId]);
  for (const [position, configuration] of configurations.entries()) {
    await client.query(
      `INSERT INTO "PropertyConfiguration" (
         "propertyId", "position", "optionName", "areaValue", "areaUnit", "customAreaUnit",
         "areaBasis", "customAreaBasis", "dimensionLength", "dimensionWidth", "notesMarkdown",
         "priceMode", "priceAmount", "priceBasis", "customPriceBasis", "additionalCharges", "plotNumber",
         "bedroomCount", "bathroomCount", "floorNumber", "carpetArea", "superBuiltUpArea", "roomConfiguration", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
      [propertyId, position, configuration.optionName, configuration.areaValue, configuration.areaUnit,
        configuration.customAreaUnit, configuration.areaBasis, configuration.customAreaBasis,
        configuration.dimensionLength, configuration.dimensionWidth, configuration.notesMarkdown,
        configuration.priceMode ?? null, configuration.priceAmount ?? null, configuration.priceBasis ?? null,
        configuration.customPriceBasis ?? null, JSON.stringify(configuration.additionalCharges ?? []), configuration.plotNumber ?? null,
        configuration.bedroomCount ?? null, configuration.bathroomCount ?? null, configuration.floorNumber ?? null,
        configuration.carpetArea ?? null, configuration.superBuiltUpArea ?? null, JSON.stringify(configuration.roomConfiguration ?? [])],
    );
  }
}

export async function findPublishedPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  const result = await pool.query<PublicProperty>(
    `SELECT "id", "slug", "title", "description", "shortSummary", "location", "propertyType",
            "propertyTypeOther", "propertySubtype", "propertySubtypeOther", "locality", "city",
            "nearbyLandmark", "district", "state", "pincode", "publicAddressMode", "manualPublicAddress",
            "mapLocation", "latitude", "longitude",
            "priceAmount", "priceCurrency", "priceMode", "priceBasis", "customPriceBasis", "additionalCharges", "offerDetails", "plotSize", "plotSizeUnit",
            "status", "representationType", "roadAccess", "proximityMarkdown", "landApprovedFor",
            "statutoryApprovals", "otherStatutoryApprovals", "projectPhase", "projectFeaturesMarkdown", "constructionStatus", "handoverDate", "waterSources", "otherWaterSource",
            "electricitySources", "otherElectricitySource", "drainageOptions", "otherDrainageOption",
            "furnishingStatus", "furnishingStatusOther", "amenitiesMarkdown",
            "facingDirection", "facingOther", "sunlightOrientation", "neighborhoodType", "neighborhoodTypeOther", "floorCount", "publicComplianceSummary",
            "commercialUse", "commercialUseOther", "yearBuilt", "recentUpgradesMarkdown", "transactionType", "leaseStructureMarkdown",
            "occupancyStatus", "leaseExpiryDate", "tenantProfileMarkdown", "availabilityOther", "enquiryEnabled", "seoTitle", "seoDescription",
            TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
     FROM "Property"
     WHERE "slug" = $1 AND "publicationStatus" = 'PUBLISHED'
     LIMIT 1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function listPropertyMedia(propertyId: UUID): Promise<PropertyMediaItem[]> {
  const result = await pool.query<PropertyMediaItem>(
    `SELECT pm."propertyId", pm."mediaId", pm."position", pm."altText",
              m."id", m."storageKey", m."mimeType", m."width", m."height", m."provider"
     FROM "PropertyMedia" pm
     JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = $1
     ORDER BY pm."position" ASC`,
    [propertyId],
  );
    return result.rows.map((item) => ({ ...item, deliveryUrl: item.provider === 'cloudinary' ? cloudinaryDeliveryUrl(item.storageKey) : item.storageKey.startsWith('/') ? item.storageKey : null }));
}

export async function listPropertiesMedia(propertyIds: UUID[]): Promise<PropertyMediaItem[]> {
  if (propertyIds.length === 0) return [];

  const result = await pool.query<PropertyMediaItem>(
    `SELECT pm."propertyId", pm."mediaId", pm."position", pm."altText",
              m."id", m."storageKey", m."mimeType", m."width", m."height", m."provider"
     FROM "PropertyMedia" pm
     JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = ANY($1::uuid[])
     ORDER BY pm."propertyId", pm."position" ASC`,
    [propertyIds],
  );
    return result.rows.map((item) => ({ ...item, deliveryUrl: item.provider === 'cloudinary' ? cloudinaryDeliveryUrl(item.storageKey) : item.storageKey.startsWith('/') ? item.storageKey : null }));
}

export async function updatePropertyMedia(
  propertyId: UUID,
  mediaItems: Array<{ mediaId: UUID; altText?: string | null }>,
): Promise<'updated' | 'property-missing' | 'media-missing'> {
  return withTransaction(async (client) => {
    const property = await client.query('SELECT "id" FROM "Property" WHERE "id" = $1 LIMIT 1', [propertyId]);
    if (property.rowCount === 0) return 'property-missing';

    if (mediaItems.length > 0) {
      const mediaIds = mediaItems.map((item) => item.mediaId);
      const mediaCheck = await client.query(
        'SELECT "id" FROM "Media" WHERE "id" = ANY($1::uuid[])',
        [mediaIds],
      );
      if (mediaCheck.rowCount !== mediaIds.length) return 'media-missing';
    }

    await client.query('DELETE FROM "PropertyMedia" WHERE "propertyId" = $1', [propertyId]);

    for (const [index, item] of mediaItems.entries()) {
      await client.query(
        'INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText") VALUES ($1, $2, $3, $4)',
        [propertyId, item.mediaId, index, item.altText ?? null],
      );
    }

    return 'updated';
  });
}

export async function setPropertyCover(
  propertyId: UUID,
  mediaId: UUID | null,
): Promise<'updated' | 'property-missing' | 'media-missing'> {
  return withTransaction(async (client) => {
    const property = await client.query('SELECT "id" FROM "Property" WHERE "id" = $1 LIMIT 1', [propertyId]);
    if (property.rowCount === 0) return 'property-missing';

    if (mediaId === null) {
      await client.query(
        'DELETE FROM "PropertyMedia" WHERE "propertyId" = $1 AND "position" = 0',
        [propertyId],
      );
      return 'updated';
    }

    const media = await client.query('SELECT "id" FROM "Media" WHERE "id" = $1 LIMIT 1', [mediaId]);
    if (media.rowCount === 0) return 'media-missing';

    const existing = await client.query<{ mediaId: UUID; altText: string | null }>(
      `SELECT "mediaId", "altText" FROM "PropertyMedia"
       WHERE "propertyId" = $1
       ORDER BY "position" ASC`,
      [propertyId],
    );
    const coverAltText = existing.rows.find((row) => row.mediaId === mediaId)?.altText ?? null;
    const others = existing.rows.filter((row) => row.mediaId !== mediaId);
    await client.query('DELETE FROM "PropertyMedia" WHERE "propertyId" = $1', [propertyId]);
    await client.query(
      'INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText") VALUES ($1, $2, 0, $3)',
      [propertyId, mediaId, coverAltText],
    );
    for (const [index, item] of others.entries()) {
      await client.query(
        'INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText") VALUES ($1, $2, $3, $4)',
        [propertyId, item.mediaId, index + 1, item.altText],
      );
    }
    return 'updated';
  });
}

export type PropertyWrite = Pick<
  Property,
  | 'slug' | 'title' | 'description' | 'location' | 'propertyType' | 'priceAmount'
  | 'priceCurrency' | 'priceMode' | 'plotSize' | 'plotSizeUnit' | 'status'
  | 'representationType' | 'publicationStatus'
> & Partial<Pick<Property,
  | 'shortSummary' | 'propertyTypeOther' | 'propertySubtype' | 'propertySubtypeOther' | 'locality'
  | 'city' | 'nearbyLandmark' | 'district' | 'state' | 'pincode' | 'publicAddressMode'
  | 'manualPublicAddress' | 'mapLocation' | 'latitude' | 'longitude'
  | 'sourceCategory' | 'sourceCategoryOther' | 'sellerOrganizationName' | 'submitterRelationship'
  | 'submitterRelationshipOther' | 'representationRoleOther' | 'authorityVerificationStatus'
  | 'internalContactName' | 'internalContactPhone' | 'internalContactEmail' | 'privateNotesMarkdown'
  | 'priceBasis' | 'customPriceBasis' | 'additionalCharges' | 'offerDetails'
  | 'roadAccess' | 'proximityMarkdown' | 'landApprovedFor' | 'statutoryApprovals' | 'otherStatutoryApprovals' | 'approvalReference' | 'approvalAuthority' | 'projectPhase' | 'projectTotalLandArea' | 'projectPhaseLandArea' | 'projectApartmentCount' | 'projectVillaCount' | 'projectFeaturesMarkdown' | 'constructionStatus' | 'handoverDate'
  | 'waterSources' | 'otherWaterSource' | 'electricitySources' | 'otherElectricitySource' | 'drainageOptions' | 'otherDrainageOption'
  | 'furnishingStatus' | 'furnishingStatusOther' | 'amenitiesMarkdown'
  | 'facingDirection' | 'facingOther' | 'sunlightOrientation' | 'neighborhoodType' | 'neighborhoodTypeOther' | 'floorCount' | 'publicComplianceSummary'
  | 'commercialUse' | 'commercialUseOther' | 'yearBuilt' | 'recentUpgradesMarkdown' | 'transactionType' | 'leaseStructureMarkdown' | 'occupancyStatus' | 'leaseExpiryDate' | 'tenantProfileMarkdown'
  | 'availabilityOther' | 'enquiryEnabled' | 'seoTitle' | 'seoDescription'
>> & { configurations?: PropertyConfigurationInput[] };

export async function createProperty(input: PropertyWrite): Promise<AdminProperty> {
  return withTransaction(async (client) => {
  const result = await client.query<AdminProperty>(
    `INSERT INTO "Property" (
       "slug", "title", "description", "shortSummary", "location", "propertyType",
       "propertyTypeOther", "propertySubtype", "propertySubtypeOther", "locality", "city",
       "nearbyLandmark", "district", "state", "pincode", "publicAddressMode", "manualPublicAddress",
       "mapLocation", "latitude", "longitude", "priceAmount",
       "priceCurrency", "priceMode", "priceBasis", "customPriceBasis", "additionalCharges", "offerDetails", "plotSize", "plotSizeUnit", "status",
       "representationType", "sourceCategory", "sourceCategoryOther", "sellerOrganizationName",
       "submitterRelationship", "submitterRelationshipOther", "representationRoleOther",
       "authorityVerificationStatus", "internalContactName", "internalContactPhone",
       "internalContactEmail", "privateNotesMarkdown", "roadAccess", "proximityMarkdown", "landApprovedFor", "statutoryApprovals", "otherStatutoryApprovals", "approvalReference", "approvalAuthority", "projectPhase", "constructionStatus", "handoverDate", "waterSources", "otherWaterSource", "electricitySources", "otherElectricitySource", "drainageOptions", "otherDrainageOption", "furnishingStatus", "furnishingStatusOther", "amenitiesMarkdown", "facingDirection", "facingOther", "sunlightOrientation", "neighborhoodType", "neighborhoodTypeOther", "floorCount", "publicComplianceSummary", "publicationStatus",
       "commercialUse", "commercialUseOther", "yearBuilt", "recentUpgradesMarkdown", "transactionType", "leaseStructureMarkdown", "occupancyStatus", "leaseExpiryDate", "tenantProfileMarkdown", "availabilityOther", "enquiryEnabled", "seoTitle", "seoDescription", "projectTotalLandArea", "projectPhaseLandArea", "projectApartmentCount", "projectVillaCount", "projectFeaturesMarkdown", "updatedAt"
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86, $87, NOW())
    RETURNING ${adminPropertyColumns}`,
    [
      input.slug, input.title, input.description, input.shortSummary ?? null, input.location, input.propertyType,
      input.propertyTypeOther ?? null, input.propertySubtype ?? null, input.propertySubtypeOther ?? null,
      input.locality ?? null, input.city ?? null, input.nearbyLandmark ?? null, input.district ?? null,
      input.state ?? null, input.pincode ?? null, input.publicAddressMode ?? (input.location ? 'MANUAL' : 'FALLBACK'),
      input.manualPublicAddress ?? (input.publicAddressMode === undefined ? input.location : null),
      input.mapLocation ?? null, input.latitude ?? null, input.longitude ?? null,
      input.priceAmount, input.priceCurrency, input.priceMode, input.priceBasis ?? 'TOTAL_PRICE', input.customPriceBasis ?? null,
      JSON.stringify(input.additionalCharges ?? []), input.offerDetails ?? null, input.plotSize,
      input.plotSizeUnit, input.status, input.representationType, input.sourceCategory ?? null,
      input.sourceCategoryOther ?? null, input.sellerOrganizationName ?? null,
      input.submitterRelationship ?? null, input.submitterRelationshipOther ?? null,
      input.representationRoleOther ?? null, input.authorityVerificationStatus ?? 'NOT_CHECKED',
      input.internalContactName ?? null, input.internalContactPhone ?? null,
      input.internalContactEmail ?? null, input.privateNotesMarkdown ?? null, input.roadAccess ?? null, input.proximityMarkdown ?? null,
      input.landApprovedFor ?? null, JSON.stringify(input.statutoryApprovals ?? []), input.otherStatutoryApprovals ?? null,
      input.approvalReference ?? null, input.approvalAuthority ?? null, input.projectPhase ?? null,
      input.constructionStatus ?? null, input.handoverDate ?? null, JSON.stringify(input.waterSources ?? []), input.otherWaterSource ?? null,
      JSON.stringify(input.electricitySources ?? []), input.otherElectricitySource ?? null,
      JSON.stringify(input.drainageOptions ?? []), input.otherDrainageOption ?? null,
      input.furnishingStatus ?? null, input.furnishingStatusOther ?? null, input.amenitiesMarkdown ?? null,
      input.facingDirection ?? null, input.facingOther ?? null, input.sunlightOrientation ?? null,
      input.neighborhoodType ?? null, input.neighborhoodTypeOther ?? null, input.floorCount ?? null,
      input.publicComplianceSummary ?? null, input.publicationStatus, input.commercialUse ?? null,
      input.commercialUseOther ?? null, input.yearBuilt ?? null, input.recentUpgradesMarkdown ?? null,
      input.transactionType ?? null, input.leaseStructureMarkdown ?? null, input.occupancyStatus ?? null,
      input.leaseExpiryDate ?? null, input.tenantProfileMarkdown ?? null, input.availabilityOther ?? null,
      input.enquiryEnabled ?? true, input.seoTitle ?? null, input.seoDescription ?? null,
      input.projectTotalLandArea ?? null, input.projectPhaseLandArea ?? null, input.projectApartmentCount ?? null,
      input.projectVillaCount ?? null, input.projectFeaturesMarkdown ?? null,
    ],
  );
  await replacePropertyConfigurations(client, result.rows[0].id, input.configurations);
  return result.rows[0];
  });
}

export async function updateProperty(id: UUID, input: PropertyWrite): Promise<AdminProperty | null> {
  return withTransaction(async (client) => {
  const result = await client.query<AdminProperty>(
    `UPDATE "Property" SET
       "slug" = $2, "title" = $3, "description" = $4, "shortSummary" = $5, "location" = $6,
       "propertyType" = $7, "propertyTypeOther" = $8, "propertySubtype" = $9, "propertySubtypeOther" = $10,
       "locality" = $11, "city" = $12, "nearbyLandmark" = $13, "district" = $14, "state" = $15,
       "pincode" = $16, "publicAddressMode" = $17, "manualPublicAddress" = $18, "mapLocation" = $19,
       "latitude" = $20, "longitude" = $21, "priceAmount" = $22, "priceCurrency" = $23,
       "priceMode" = $24, "priceBasis" = $25, "customPriceBasis" = $26, "additionalCharges" = $27,
       "offerDetails" = $28, "plotSize" = $29, "plotSizeUnit" = $30, "status" = $31,
       "representationType" = $32, "sourceCategory" = $33, "sourceCategoryOther" = $34,
       "sellerOrganizationName" = $35, "submitterRelationship" = $36,
       "submitterRelationshipOther" = $37, "representationRoleOther" = $38,
       "authorityVerificationStatus" = $39, "internalContactName" = $40,
       "internalContactPhone" = $41, "internalContactEmail" = $42,
       "privateNotesMarkdown" = $43, "roadAccess" = $44, "proximityMarkdown" = $45, "landApprovedFor" = $46,
       "statutoryApprovals" = $47, "otherStatutoryApprovals" = $48, "approvalReference" = $49,
       "approvalAuthority" = $50, "projectPhase" = $51, "constructionStatus" = $52, "handoverDate" = $53,
       "waterSources" = $54, "otherWaterSource" = $55, "electricitySources" = $56, "otherElectricitySource" = $57,
       "drainageOptions" = $58, "otherDrainageOption" = $59, "furnishingStatus" = $60,
       "furnishingStatusOther" = $61, "amenitiesMarkdown" = $62, "facingDirection" = $63,
       "facingOther" = $64, "sunlightOrientation" = $65, "neighborhoodType" = $66,
       "neighborhoodTypeOther" = $67, "floorCount" = $68, "publicComplianceSummary" = $69,
       "publicationStatus" = $70, "commercialUse" = $71, "commercialUseOther" = $72, "yearBuilt" = $73,
       "recentUpgradesMarkdown" = $74, "transactionType" = $75, "leaseStructureMarkdown" = $76,
       "occupancyStatus" = $77, "leaseExpiryDate" = $78, "tenantProfileMarkdown" = $79,
       "availabilityOther" = $80, "enquiryEnabled" = $81, "seoTitle" = $82, "seoDescription" = $83,
       "projectTotalLandArea" = $84, "projectPhaseLandArea" = $85, "projectApartmentCount" = $86,
       "projectVillaCount" = $87, "projectFeaturesMarkdown" = $88, "updatedAt" = NOW()
     WHERE "id" = $1
    RETURNING ${adminPropertyColumns}`,
    [
      id, input.slug, input.title, input.description, input.shortSummary ?? null, input.location, input.propertyType,
      input.propertyTypeOther ?? null, input.propertySubtype ?? null, input.propertySubtypeOther ?? null,
      input.locality ?? null, input.city ?? null, input.nearbyLandmark ?? null, input.district ?? null,
      input.state ?? null, input.pincode ?? null, input.publicAddressMode ?? 'FALLBACK', input.manualPublicAddress ?? null,
      input.mapLocation ?? null, input.latitude ?? null, input.longitude ?? null,
      input.priceAmount, input.priceCurrency, input.priceMode, input.priceBasis ?? 'TOTAL_PRICE', input.customPriceBasis ?? null,
      JSON.stringify(input.additionalCharges ?? []), input.offerDetails ?? null, input.plotSize,
      input.plotSizeUnit, input.status, input.representationType, input.sourceCategory ?? null,
      input.sourceCategoryOther ?? null, input.sellerOrganizationName ?? null,
      input.submitterRelationship ?? null, input.submitterRelationshipOther ?? null,
      input.representationRoleOther ?? null, input.authorityVerificationStatus ?? 'NOT_CHECKED',
      input.internalContactName ?? null, input.internalContactPhone ?? null,
      input.internalContactEmail ?? null, input.privateNotesMarkdown ?? null, input.roadAccess ?? null, input.proximityMarkdown ?? null,
      input.landApprovedFor ?? null, JSON.stringify(input.statutoryApprovals ?? []), input.otherStatutoryApprovals ?? null,
      input.approvalReference ?? null, input.approvalAuthority ?? null, input.projectPhase ?? null,
      input.constructionStatus ?? null, input.handoverDate ?? null, JSON.stringify(input.waterSources ?? []), input.otherWaterSource ?? null,
      JSON.stringify(input.electricitySources ?? []), input.otherElectricitySource ?? null,
      JSON.stringify(input.drainageOptions ?? []), input.otherDrainageOption ?? null,
      input.furnishingStatus ?? null, input.furnishingStatusOther ?? null, input.amenitiesMarkdown ?? null,
      input.facingDirection ?? null, input.facingOther ?? null, input.sunlightOrientation ?? null,
      input.neighborhoodType ?? null, input.neighborhoodTypeOther ?? null, input.floorCount ?? null,
      input.publicComplianceSummary ?? null, input.publicationStatus, input.commercialUse ?? null,
      input.commercialUseOther ?? null, input.yearBuilt ?? null, input.recentUpgradesMarkdown ?? null,
      input.transactionType ?? null, input.leaseStructureMarkdown ?? null, input.occupancyStatus ?? null,
      input.leaseExpiryDate ?? null, input.tenantProfileMarkdown ?? null, input.availabilityOther ?? null,
      input.enquiryEnabled ?? true, input.seoTitle ?? null, input.seoDescription ?? null,
      input.projectTotalLandArea ?? null, input.projectPhaseLandArea ?? null, input.projectApartmentCount ?? null,
      input.projectVillaCount ?? null, input.projectFeaturesMarkdown ?? null,
    ],
  );
  if (!result.rows[0]) return null;
  await replacePropertyConfigurations(client, id, input.configurations);
  return result.rows[0];
  });
}

export async function deleteProperty(id: UUID): Promise<boolean> {
  const result = await pool.query('DELETE FROM "Property" WHERE "id" = $1', [id]);
  return Boolean(result.rowCount);
}

export async function transitionPropertyPublication(id: UUID, action: 'archive' | 'restore' | 'publish'): Promise<'updated' | 'missing' | 'invalid-transition'> {
  return withTransaction(async (client) => {
    const current = await client.query<{ publicationStatus: PublicationStatus }>(
      'SELECT "publicationStatus" FROM "Property" WHERE "id" = $1 FOR UPDATE', [id],
    );
    const status = current.rows[0]?.publicationStatus;
    if (!status) return 'missing';
    if ((action === 'archive' && status !== 'PUBLISHED')
      || (action === 'restore' && status !== 'ARCHIVED')
      || (action === 'publish' && status !== 'DRAFT')) return 'invalid-transition';
    const target = action === 'archive' ? 'ARCHIVED' : 'PUBLISHED';
    await client.query('UPDATE "Property" SET "publicationStatus" = $2, "updatedAt" = NOW() WHERE "id" = $1', [id, target]);
    return 'updated';
  });
}

export async function createSellerPropertySubmission(input: {
  property: PropertyWrite;
  enquiry: { name: string; email: string; phone: string; message: string };
  media: Array<{ storageKey: string; mimeType: string; byteSize: number; width: number; height: number }>;
}): Promise<AdminProperty> {
  return withTransaction(async (client) => {
    const created = await client.query<AdminProperty>(
      `INSERT INTO "Property" (
         "slug", "title", "description", "location", "propertyType", "priceAmount",
         "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
         "representationType", "publicationStatus", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       RETURNING ${adminPropertyColumns}`,
      [input.property.slug, input.property.title, input.property.description, input.property.location,
        input.property.propertyType, input.property.priceAmount, input.property.priceCurrency, input.property.priceMode,
        input.property.plotSize, input.property.plotSizeUnit, input.property.status, input.property.representationType,
        input.property.publicationStatus],
    );
    const property = created.rows[0];
    for (const [position, item] of input.media.entries()) {
      const media = await client.query<{ id: UUID }>(
        `INSERT INTO "Media" ("storageKey", "provider", "mimeType", "byteSize", "width", "height")
         VALUES ($1, 'cloudinary', $2, $3, $4, $5) RETURNING "id"`,
        [item.storageKey, item.mimeType, item.byteSize, item.width, item.height],
      );
      await client.query(
        `INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText") VALUES ($1, $2, $3, NULL)`,
        [property.id, media.rows[0].id, position],
      );
    }
    await client.query(
      `INSERT INTO "Enquiry" ("name", "email", "phone", "interestedServiceLabel", "message", "propertyId", "updatedAt")
       VALUES ($1, $2, $3, 'Real Estate - Seller Property Submission', $4, $5, NOW())`,
      [input.enquiry.name, input.enquiry.email, input.enquiry.phone, input.enquiry.message, property.id],
    );
    return property;
  });
}
