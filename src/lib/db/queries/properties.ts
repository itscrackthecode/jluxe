import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl, cloudinaryRawDeliveryUrl } from '@/lib/cloudinary';
import type {
  Property,
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
export type PropertyConfigurationItem = {
  id: UUID;
  propertyId: UUID;
  name: string;
  area: string | null;
  areaUnit: Property['plotSizeUnit'];
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  block: string | null;
  priceMode: 'EXACT' | 'RANGE' | 'PER_UNIT' | 'ON_REQUEST';
  priceAmount: string | null;
  priceMinimum: string | null;
  priceMaximum: string | null;
  priceCurrency: string | null;
  priceBasis: string;
  availability: string;
  availableUnits: number | null;
  features: string[];
  media: Array<{ id: UUID; storageKey: string; mimeType: string; width: number | null; height: number | null; position: number; altText: string | null; deliveryUrl: string | null }>;
};

const adminPropertyColumns = `
  "id", "slug", "title", "description", "location", "propertyType", "priceAmount",
  "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
  "representationType", "publicationStatus", "subtype", "projectName", "address", "locality", "city", "state", "locationUrl",
  "bedrooms", "bathrooms", "builtUpArea", "builtUpAreaUnit", "floorCount", "parkingSpaces", "roadAccess", "approvalInfo",
  "features", "customAttributes", "seoTitle", "seoDescription", "priceMinimum", "priceMaximum", "priceBasis", "availability",
  TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`;
export type PublicProperty = Omit<Pick<
  Property,
  | 'id' | 'slug' | 'title' | 'description' | 'location' | 'propertyType'
  | 'priceAmount' | 'priceCurrency' | 'priceMode' | 'plotSize' | 'plotSizeUnit'
  | 'status' | 'representationType' | 'createdAt' | 'subtype' | 'projectName' | 'bedrooms' | 'bathrooms' | 'builtUpArea' | 'builtUpAreaUnit' | 'availability' | 'priceMinimum' | 'priceMaximum' | 'priceBasis' | 'features' | 'seoTitle' | 'seoDescription' | 'priceMinimum' | 'priceMaximum'
>, 'createdAt'> & { createdAt: string };

const effectivePropertyAvailabilitySql = `CASE
  WHEN EXISTS (SELECT 1 FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id")
    OR EXISTS (SELECT 1 FROM "PropertyInventory" pi WHERE pi."propertyId" = "Property"."id")
  THEN (SELECT CASE
      WHEN BOOL_OR(tracked."availability" = 'AVAILABLE') THEN 'AVAILABLE'
      WHEN BOOL_OR(tracked."availability" = 'LIMITED') THEN 'LIMITED'
      WHEN BOOL_OR(tracked."availability" = 'COMING_SOON') THEN 'COMING_SOON'
      WHEN BOOL_OR(tracked."availability" = 'RESERVED') THEN 'RESERVED'
      WHEN BOOL_OR(tracked."availability" = 'SOLD_OUT') THEN 'SOLD_OUT'
      ELSE 'UNAVAILABLE'
    END
    FROM (
      SELECT CASE
          WHEN COUNT(pi."id") = 0 THEN pc."availability"
          WHEN BOOL_OR(pi."availability" = 'AVAILABLE') THEN 'AVAILABLE'
          WHEN BOOL_OR(pi."availability" = 'LIMITED') THEN 'LIMITED'
          WHEN BOOL_OR(pi."availability" = 'COMING_SOON') THEN 'COMING_SOON'
          WHEN BOOL_OR(pi."availability" = 'RESERVED') THEN 'RESERVED'
          WHEN BOOL_OR(pi."availability" = 'SOLD_OUT') THEN 'SOLD_OUT'
          ELSE 'UNAVAILABLE'
        END AS "availability"
      FROM "PropertyConfiguration" pc
      LEFT JOIN "PropertyInventory" pi ON pi."configurationId" = pc."id"
      WHERE pc."propertyId" = "Property"."id"
      GROUP BY pc."id", pc."availability"
      UNION ALL
      SELECT pi."availability"
      FROM "PropertyInventory" pi
      WHERE pi."propertyId" = "Property"."id" AND pi."configurationId" IS NULL
    ) tracked)
  ELSE "Property"."availability"
END`;

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function listPublicProperties(filters: {
  location?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  availability?: Property['availability'];
  bedrooms?: number;
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
    filters.availability ?? null,
    filters.bedrooms ?? null,
  ];
  const conditions = `
    "publicationStatus" = 'PUBLISHED'
    AND ($1::text IS NULL OR "location" ILIKE '%' || $1 || '%' ESCAPE E'\\\\')
    AND ($2::"PropertyType" IS NULL OR "propertyType" = $2::"PropertyType")
    AND ($3::"PropertyStatus" IS NULL OR "status" = $3::"PropertyStatus")
    AND (($4::numeric IS NULL AND $5::numeric IS NULL)
      OR ((COALESCE("priceMinimum", "priceAmount") IS NOT NULL OR COALESCE("priceMaximum", "priceAmount") IS NOT NULL)
        AND ($4::numeric IS NULL OR COALESCE("priceMaximum", "priceAmount") IS NULL OR COALESCE("priceMaximum", "priceAmount") >= $4)
        AND ($5::numeric IS NULL OR COALESCE("priceMinimum", "priceAmount") IS NULL OR COALESCE("priceMinimum", "priceAmount") <= $5))
      OR EXISTS (SELECT 1 FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id"
        AND (pc."priceMinimum" IS NOT NULL OR pc."priceMaximum" IS NOT NULL OR pc."priceAmount" IS NOT NULL)
        AND ($4::numeric IS NULL OR COALESCE(pc."priceMaximum", pc."priceAmount") IS NULL OR COALESCE(pc."priceMaximum", pc."priceAmount") >= $4)
        AND ($5::numeric IS NULL OR COALESCE(pc."priceMinimum", pc."priceAmount") IS NULL OR COALESCE(pc."priceMinimum", pc."priceAmount") <= $5)))`;
  const queryConditions = `${conditions}
    AND ($6::text IS NULL OR (${effectivePropertyAvailabilitySql}) = $6)
    AND ($7::integer IS NULL OR "bedrooms" = $7 OR EXISTS (SELECT 1 FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id" AND pc."bedrooms" = $7))`;
  const orderBy: Record<PropertySort, string> = {
    latest: '"createdAt" DESC, "id" DESC',
    price_asc: 'COALESCE("priceMinimum", "priceAmount", (SELECT MIN(COALESCE(pc."priceMinimum", pc."priceAmount")) FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id")) ASC NULLS LAST, "id" ASC',
    price_desc: 'COALESCE("priceMaximum", "priceAmount", (SELECT MAX(COALESCE(pc."priceMaximum", pc."priceAmount")) FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id")) DESC NULLS LAST, "id" ASC',
  };

  const [countResult, rowsResult] = await Promise.all([
    pool.query<{ total: string }>(`SELECT COUNT(*) AS "total" FROM "Property" WHERE ${queryConditions}`, values),
    pool.query<PublicProperty>(
      `SELECT "id", "slug", "title", "description", "location", "propertyType",
              "priceAmount", "priceCurrency", "priceMode", "plotSize", "plotSizeUnit",
              "status", "representationType", "subtype", "projectName", "bedrooms", "bathrooms", "builtUpArea", "builtUpAreaUnit", (${effectivePropertyAvailabilitySql}) AS "availability", "priceMinimum", "priceMaximum", "priceBasis", "features", "seoTitle", "seoDescription",
              TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
       FROM "Property" WHERE ${queryConditions}
       ORDER BY ${orderBy[filters.sort]} LIMIT $8 OFFSET $9`,
      [...values, filters.limit, filters.offset],
    ),
  ]);

  return { data: rowsResult.rows, total: Number(countResult.rows[0]?.total ?? 0) };
}

export async function listAdminProperties(filters: {
  search?: string;
  publicationStatus?: PublicationStatus;
  status?: PropertyStatus;
  propertyType?: PropertyType;
  availability?: Property['availability'];
  priceMin?: number;
  priceMax?: number;
  sort?: 'updated' | 'price_asc' | 'price_desc';
  limit: number;
  offset: number;
}): Promise<{ data: AdminProperty[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [
    escapedSearch ? `%${escapedSearch}%` : null,
    filters.publicationStatus ?? null,
    filters.status ?? null,
    filters.propertyType ?? null,
    filters.priceMin ?? null,
    filters.priceMax ?? null,
    filters.availability ?? null,
  ];
  const conditions = `
    ($1::text IS NULL OR "title" ILIKE $1 ESCAPE E'\\\\' OR "location" ILIKE $1 ESCAPE E'\\\\' OR "city" ILIKE $1 ESCAPE E'\\\\' OR "locality" ILIKE $1 ESCAPE E'\\\\')
    AND ($2::"PublicationStatus" IS NULL OR "publicationStatus" = $2::"PublicationStatus")
    AND ($3::"PropertyStatus" IS NULL OR "status" = $3::"PropertyStatus")
    AND ($4::"PropertyType" IS NULL OR "propertyType" = $4::"PropertyType")
    AND (($5::numeric IS NULL AND $6::numeric IS NULL)
      OR ((COALESCE("priceMinimum", "priceAmount") IS NOT NULL OR COALESCE("priceMaximum", "priceAmount") IS NOT NULL)
        AND ($5::numeric IS NULL OR COALESCE("priceMaximum", "priceAmount") IS NULL OR COALESCE("priceMaximum", "priceAmount") >= $5)
        AND ($6::numeric IS NULL OR COALESCE("priceMinimum", "priceAmount") IS NULL OR COALESCE("priceMinimum", "priceAmount") <= $6))
      OR EXISTS (SELECT 1 FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id"
        AND (pc."priceMinimum" IS NOT NULL OR pc."priceMaximum" IS NOT NULL OR pc."priceAmount" IS NOT NULL)
        AND ($5::numeric IS NULL OR COALESCE(pc."priceMaximum", pc."priceAmount") IS NULL OR COALESCE(pc."priceMaximum", pc."priceAmount") >= $5)
        AND ($6::numeric IS NULL OR COALESCE(pc."priceMinimum", pc."priceAmount") IS NULL OR COALESCE(pc."priceMinimum", pc."priceAmount") <= $6)))
    AND ($7::text IS NULL OR (${effectivePropertyAvailabilitySql}) = $7)`;

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `SELECT COUNT(*) AS "total" FROM "Property" WHERE ${conditions}`,
      values,
    );
    const ordering = filters.sort === 'price_asc' ? 'COALESCE("priceMinimum", "priceAmount", (SELECT MIN(COALESCE(pc."priceMinimum", pc."priceAmount")) FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id")) ASC NULLS LAST, "updatedAt" DESC'
      : filters.sort === 'price_desc' ? 'COALESCE("priceMaximum", "priceAmount", (SELECT MAX(COALESCE(pc."priceMaximum", pc."priceAmount")) FROM "PropertyConfiguration" pc WHERE pc."propertyId" = "Property"."id")) DESC NULLS LAST, "updatedAt" DESC'
        : '"updatedAt" DESC, "id" DESC';
    const rowsResult = await client.query<AdminProperty>(
      `SELECT ${adminPropertyColumns} FROM "Property" WHERE ${conditions}
       ORDER BY ${ordering} LIMIT $8 OFFSET $9`,
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

export async function findPublishedPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  const result = await pool.query<PublicProperty>(
    `SELECT "id", "slug", "title", "description", "location", "propertyType",
            "priceAmount", "priceCurrency", "priceMode", "plotSize", "plotSizeUnit",
            "status", "representationType", "subtype", "projectName", "bedrooms", "bathrooms", "builtUpArea", "builtUpAreaUnit", "availability", "priceMinimum", "priceMaximum", "priceBasis", "features", "seoTitle", "seoDescription",
            "address", "locality", "city", "state", "locationUrl", "floorCount", "parkingSpaces", "roadAccess", "approvalInfo",
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
     WHERE pm."propertyId" = $1 AND pm."assetType" = 'GALLERY'
     ORDER BY pm."position" ASC`,
    [propertyId],
  );
    return result.rows.map((item) => ({ ...item, deliveryUrl: item.provider === 'cloudinary' ? cloudinaryDeliveryUrl(item.storageKey) : item.storageKey.startsWith('/') ? item.storageKey : null }));
}

export async function listPropertyDocuments(propertyId: UUID) {
  const result = await pool.query<{ id: UUID; storageKey: string; assetType: string; mimeType: string; byteSize: string; provider: string; altText: string | null }>(
    `SELECT m."id", m."storageKey", pm."assetType", m."mimeType", m."byteSize"::text AS "byteSize", m."provider", pm."altText"
     FROM "PropertyMedia" pm JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = $1 AND pm."assetType" IN ('FLOOR_PLAN','BROCHURE','PRICE_DOCUMENT')
     ORDER BY pm."assetType", pm."position", m."createdAt"`, [propertyId],
  );
  return result.rows.map((item) => ({ id: item.id, title: item.altText ?? item.storageKey.split('/').pop() ?? 'Property document', kind: item.assetType, url: item.provider === 'cloudinary' ? cloudinaryRawDeliveryUrl(item.storageKey) : item.storageKey, mimeType: item.mimeType, byteSize: item.byteSize }));
}

export async function createPropertyDocument(input: { propertyId: UUID; storageKey: string; title: string; kind: 'FLOOR_PLAN' | 'BROCHURE' | 'PRICE_DOCUMENT'; byteSize: number; adminId: UUID }) {
  return withTransaction(async (client) => {
    const property = await client.query('SELECT "id" FROM "Property" WHERE "id"=$1', [input.propertyId]);
    if (!property.rowCount) return null;
    const media = await client.query<{ id: UUID }>(
      `INSERT INTO "Media" ("storageKey","provider","mimeType","byteSize","uploadedByAdminId") VALUES ($1,'cloudinary','application/pdf',$2,$3) RETURNING "id"`,
      [input.storageKey, input.byteSize, input.adminId],
    );
    await client.query(
      `INSERT INTO "PropertyMedia" ("propertyId","mediaId","position","altText","assetType") VALUES ($1,$2,COALESCE((SELECT MAX("position") + 1 FROM "PropertyMedia" WHERE "propertyId"=$1 AND "assetType"=$3),0),$4,$3)`,
      [input.propertyId, media.rows[0].id, input.kind, input.title],
    );
    return { id: media.rows[0].id, title: input.title, kind: input.kind, url: cloudinaryRawDeliveryUrl(input.storageKey) };
  });
}

export async function removePropertyDocument(propertyId: UUID, mediaId: UUID) {
  const result = await pool.query(
    `DELETE FROM "PropertyMedia" WHERE "propertyId"=$1 AND "mediaId"=$2 AND "assetType" IN ('FLOOR_PLAN','BROCHURE','PRICE_DOCUMENT')`,
    [propertyId, mediaId],
  );
  return Boolean(result.rowCount);
}

export async function listPropertyPromotionalMedia(propertyId: UUID) {
  const result = await pool.query<{ id: UUID; storageKey: string; provider: string; kind: 'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT'; width: number | null; height: number | null; altText: string | null; url: string | null }>(
    `SELECT m."id",m."storageKey",m."provider",pm."assetType" AS "kind",m."width",m."height",pm."altText"
     FROM "PropertyMedia" pm JOIN "Media" m ON m."id"=pm."mediaId"
     WHERE pm."propertyId"=$1 AND pm."assetType" IN ('PROMO_LANDSCAPE','PROMO_PORTRAIT')
     ORDER BY pm."assetType",pm."position"`, [propertyId],
  );
  return result.rows.map((item) => ({
    ...item,
    url: item.provider === 'cloudinary'
      ? cloudinaryDeliveryUrl(item.storageKey)
      : item.storageKey.startsWith('/') ? item.storageKey : null,
  }));
}

export async function updatePropertyPromotionalMedia(propertyId: UUID, items: Array<{ mediaId: UUID; kind: 'PROMO_LANDSCAPE' | 'PROMO_PORTRAIT' }>) {
  return withTransaction(async (client) => {
    const property = await client.query('SELECT "id" FROM "Property" WHERE "id"=$1', [propertyId]);
    if (!property.rowCount) return 'property-missing' as const;
    if (items.length > 24 || new Set(items.map((item) => item.mediaId)).size !== items.length) return 'invalid-media' as const;
    if (items.length) {
      const media = await client.query<{ id: UUID; mimeType: string; width: number | null; height: number | null }>(`SELECT "id","mimeType","width","height" FROM "Media" WHERE "id"=ANY($1::uuid[])`, [items.map((item) => item.mediaId)]);
      if (media.rowCount !== items.length) return 'media-missing' as const;
      const byId = new Map(media.rows.map((item) => [item.id, item]));
      for (const item of items) {
        const asset = byId.get(item.mediaId);
        if (!asset?.mimeType.startsWith('image/')) return 'invalid-media' as const;
        if (item.kind === 'PROMO_LANDSCAPE' && asset.width !== null && asset.height !== null && asset.width <= asset.height) return 'invalid-media' as const;
        if (item.kind === 'PROMO_PORTRAIT' && asset.width !== null && asset.height !== null && asset.height <= asset.width) return 'invalid-media' as const;
      }
    }
    await client.query(`DELETE FROM "PropertyMedia" WHERE "propertyId"=$1 AND "assetType" IN ('PROMO_LANDSCAPE','PROMO_PORTRAIT')`, [propertyId]);
    const positions = new Map<string, number>();
    for (const item of items) {
      const position = positions.get(item.kind) ?? 0;
      positions.set(item.kind, position + 1);
      await client.query(`INSERT INTO "PropertyMedia" ("propertyId","mediaId","position","assetType") VALUES ($1,$2,$3,$4)`, [propertyId,item.mediaId,position,item.kind]);
    }
    return 'updated' as const;
  });
}

export async function listPropertiesMedia(propertyIds: UUID[]): Promise<PropertyMediaItem[]> {
  if (propertyIds.length === 0) return [];

  const result = await pool.query<PropertyMediaItem>(
    `SELECT pm."propertyId", pm."mediaId", pm."position", pm."altText",
              m."id", m."storageKey", m."mimeType", m."width", m."height", m."provider"
     FROM "PropertyMedia" pm
     JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = ANY($1::uuid[]) AND pm."assetType" = 'GALLERY'
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

    await client.query(`DELETE FROM "PropertyMedia" WHERE "propertyId" = $1 AND "assetType" = 'GALLERY'`, [propertyId]);

    for (const [index, item] of mediaItems.entries()) {
      await client.query(
        `INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText", "assetType") VALUES ($1, $2, $3, $4, 'GALLERY')`,
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
        `DELETE FROM "PropertyMedia" WHERE "propertyId" = $1 AND "position" = 0 AND "assetType" = 'GALLERY'`,
        [propertyId],
      );
      return 'updated';
    }

    const media = await client.query('SELECT "id" FROM "Media" WHERE "id" = $1 AND "mimeType" LIKE \'image/%\' LIMIT 1', [mediaId]);
    if (media.rowCount === 0) return 'media-missing';

    const existing = await client.query<{ mediaId: UUID; altText: string | null }>(
      `SELECT "mediaId", "altText" FROM "PropertyMedia"
       WHERE "propertyId" = $1 AND "assetType" = 'GALLERY'
       ORDER BY "position" ASC`,
      [propertyId],
    );
    const coverAltText = existing.rows.find((row) => row.mediaId === mediaId)?.altText ?? null;
    const others = existing.rows.filter((row) => row.mediaId !== mediaId);
    await client.query(`DELETE FROM "PropertyMedia" WHERE "propertyId" = $1 AND "assetType" = 'GALLERY'`, [propertyId]);
    await client.query(
      `INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText", "assetType") VALUES ($1, $2, 0, $3, 'GALLERY')`,
      [propertyId, mediaId, coverAltText],
    );
    for (const [index, item] of others.entries()) {
      await client.query(
        `INSERT INTO "PropertyMedia" ("propertyId", "mediaId", "position", "altText", "assetType") VALUES ($1, $2, $3, $4, 'GALLERY')`,
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
> & Partial<Pick<Property, 'subtype' | 'projectName' | 'address' | 'locality' | 'city' | 'state' | 'locationUrl' | 'bedrooms' | 'bathrooms' | 'builtUpArea' | 'builtUpAreaUnit' | 'floorCount' | 'parkingSpaces' | 'roadAccess' | 'approvalInfo' | 'features' | 'customAttributes' | 'seoTitle' | 'seoDescription' | 'priceMinimum' | 'priceMaximum' | 'priceBasis' | 'availability'>> & { configurations?: Array<{ id?: UUID; name: string; area: string | null; areaUnit: Property['plotSizeUnit']; bedrooms: number | null; bathrooms: number | null; floor: string | null; block: string | null; priceMode: string; priceAmount: string | null; priceMinimum: string | null; priceMaximum: string | null; priceCurrency: string | null; priceBasis: string; availability: string; availableUnits: number | null; features: string[] }>; inventory?: Array<{ id?: UUID; reference: string; configurationId: UUID | null; availability: string; priceAmount: string | null; priceCurrency: string | null; area: string | null; areaUnit: Property['plotSizeUnit'] }> };

export async function listPropertiesConfigurations(propertyIds: UUID[]): Promise<PropertyConfigurationItem[]> {
  if (propertyIds.length === 0) return [];
  const result = await pool.query<Omit<PropertyConfigurationItem, 'media'>>(
    `SELECT "id", "propertyId", "name", "area"::text AS "area", "areaUnit", "bedrooms", "bathrooms", "floor", "block", "priceMode",
      "priceAmount"::text AS "priceAmount", "priceMinimum"::text AS "priceMinimum", "priceMaximum"::text AS "priceMaximum",
      "priceCurrency", "priceBasis", "availability", "availableUnits", "features"
     FROM "PropertyConfiguration" WHERE "propertyId" = ANY($1::uuid[]) ORDER BY "propertyId", "createdAt", "id"`, [propertyIds],
  );
  const media = await pool.query<{ configurationId: UUID; id: UUID; storageKey: string; provider: string; mimeType: string; width: number | null; height: number | null; position: number; altText: string | null }>(
    `SELECT cm."configurationId",m."id",m."storageKey",m."provider",m."mimeType",m."width",m."height",cm."position",cm."altText"
     FROM "PropertyConfigurationMedia" cm JOIN "Media" m ON m."id"=cm."mediaId"
     JOIN "PropertyConfiguration" pc ON pc."id"=cm."configurationId"
     WHERE pc."propertyId"=ANY($1::uuid[]) AND cm."assetType"='GALLERY' ORDER BY cm."configurationId",cm."position"`, [propertyIds],
  );
  const byConfiguration = new Map<UUID, typeof media.rows>();
  for (const item of media.rows) {
    const list = byConfiguration.get(item.configurationId) ?? [];
    list.push(item);
    byConfiguration.set(item.configurationId, list);
  }
  return result.rows.map((item) => ({
    ...item,
    media: (byConfiguration.get(item.id) ?? []).map((image) => ({
      id: image.id,
      storageKey: image.storageKey,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      position: image.position,
      altText: image.altText,
      deliveryUrl: image.provider === 'cloudinary' ? cloudinaryDeliveryUrl(image.storageKey) : image.storageKey.startsWith('/') ? image.storageKey : null,
    })),
  }));
}

export async function updatePropertyConfigurationMedia(propertyId: UUID, configurationId: UUID, mediaIds: UUID[]) {
  return withTransaction(async (client) => {
    const configuration = await client.query('SELECT "id" FROM "PropertyConfiguration" WHERE "id"=$1 AND "propertyId"=$2', [configurationId, propertyId]);
    if (!configuration.rowCount) return 'configuration-missing' as const;
    if (mediaIds.length > 12 || new Set(mediaIds).size !== mediaIds.length) return 'invalid-media' as const;
    if (mediaIds.length) {
      const result = await client.query<{ id: UUID; mimeType: string }>('SELECT "id","mimeType" FROM "Media" WHERE "id"=ANY($1::uuid[])', [mediaIds]);
      if (result.rowCount !== mediaIds.length) return 'media-missing' as const;
      if (result.rows.some((item) => !item.mimeType.startsWith('image/'))) return 'invalid-media' as const;
    }
    await client.query('DELETE FROM "PropertyConfigurationMedia" WHERE "configurationId"=$1 AND "assetType"=\'GALLERY\'', [configurationId]);
    for (const [position, mediaId] of mediaIds.entries()) {
      await client.query('INSERT INTO "PropertyConfigurationMedia" ("configurationId","mediaId","position","assetType") VALUES ($1,$2,$3,\'GALLERY\')', [configurationId, mediaId, position]);
    }
    return 'updated' as const;
  });
}

export async function listPropertyConfigurations(propertyId: UUID) {
  return listPropertiesConfigurations([propertyId]);
}

export async function listPropertyInventory(propertyId: UUID) {
  const result = await pool.query(`SELECT "id","reference","configurationId","availability","priceAmount"::text AS "priceAmount","priceCurrency","area"::text AS "area","areaUnit" FROM "PropertyInventory" WHERE "propertyId"=$1 ORDER BY "reference","id"`, [propertyId]);
  return result.rows;
}

export async function listPropertiesInventory(propertyIds: UUID[]) {
  if (!propertyIds.length) return [];
  const result = await pool.query(`SELECT "id","propertyId","reference","configurationId","availability","priceAmount"::text AS "priceAmount","priceCurrency","area"::text AS "area","areaUnit" FROM "PropertyInventory" WHERE "propertyId"=ANY($1::uuid[]) ORDER BY "propertyId","reference","id"`, [propertyIds]);
  return result.rows;
}

async function saveConfigurations(client: import('pg').PoolClient, propertyId: UUID, items: NonNullable<PropertyWrite['configurations']> = []) {
  const retained: UUID[] = [];
  for (const item of items) {
    const values = [propertyId, item.name, item.area, item.areaUnit, item.bedrooms, item.bathrooms, item.floor, item.block, item.priceMode, item.priceAmount, item.priceMinimum, item.priceMaximum, item.priceCurrency, item.priceBasis, item.availability, item.availableUnits, JSON.stringify(item.features)];
    if (item.id) {
      const updated = await client.query<{ id: UUID }>(
        `UPDATE "PropertyConfiguration" SET "name"=$2,"area"=$3,"areaUnit"=$4,"bedrooms"=$5,"bathrooms"=$6,"floor"=$7,"block"=$8,"priceMode"=$9,"priceAmount"=$10,"priceMinimum"=$11,"priceMaximum"=$12,"priceCurrency"=$13,"priceBasis"=$14,"availability"=$15,"availableUnits"=$16,"features"=$17::jsonb,"updatedAt"=NOW() WHERE "propertyId"=$1 AND "id"=$18 RETURNING "id"`,
        [...values, item.id],
      );
      if (updated.rows[0]) retained.push(item.id);
      else {
        const existing = await client.query('SELECT "id" FROM "PropertyConfiguration" WHERE "id"=$1', [item.id]);
        if (existing.rowCount) throw new Error('Property configuration does not belong to this property.');
        const inserted = await client.query<{ id: UUID }>(
          `INSERT INTO "PropertyConfiguration" ("id","propertyId","name","area","areaUnit","bedrooms","bathrooms","floor","block","priceMode","priceAmount","priceMinimum","priceMaximum","priceCurrency","priceBasis","availability","availableUnits","features","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,NOW()) RETURNING "id"`,
          [item.id, ...values],
        );
        retained.push(inserted.rows[0].id);
      }
    } else {
      const inserted = await client.query<{ id: UUID }>(
        `INSERT INTO "PropertyConfiguration" ("propertyId","name","area","areaUnit","bedrooms","bathrooms","floor","block","priceMode","priceAmount","priceMinimum","priceMaximum","priceCurrency","priceBasis","availability","availableUnits","features","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,NOW()) RETURNING "id"`, values,
      );
      retained.push(inserted.rows[0].id);
    }
  }
  if (retained.length) await client.query('DELETE FROM "PropertyConfiguration" WHERE "propertyId"=$1 AND NOT ("id"=ANY($2::uuid[]))', [propertyId, retained]);
  else await client.query('DELETE FROM "PropertyConfiguration" WHERE "propertyId"=$1', [propertyId]);
}

async function saveInventory(client: import('pg').PoolClient, propertyId: UUID, items: NonNullable<PropertyWrite['inventory']> = []) {
  const retained: UUID[] = [];
  for (const item of items) {
    if (item.configurationId) {
      const belongs = await client.query('SELECT "id" FROM "PropertyConfiguration" WHERE "id"=$1 AND "propertyId"=$2', [item.configurationId, propertyId]);
      if (!belongs.rowCount) throw new Error('Inventory configuration does not belong to this property.');
    }
    if (item.id) {
      const updated = await client.query<{ id: UUID }>(`UPDATE "PropertyInventory" SET "reference"=$3,"configurationId"=$4,"availability"=$5,"priceAmount"=$6,"priceCurrency"=$7,"area"=$8,"areaUnit"=$9,"updatedAt"=NOW() WHERE "propertyId"=$1 AND "id"=$2 RETURNING "id"`, [propertyId,item.id,item.reference,item.configurationId,item.availability,item.priceAmount,item.priceCurrency,item.area,item.areaUnit]);
      if (!updated.rows[0]) throw new Error('Inventory record does not belong to this property.');
      retained.push(item.id);
    } else {
      const inserted = await client.query<{ id: UUID }>(`INSERT INTO "PropertyInventory" ("propertyId","reference","configurationId","availability","priceAmount","priceCurrency","area","areaUnit","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING "id"`, [propertyId,item.reference,item.configurationId,item.availability,item.priceAmount,item.priceCurrency,item.area,item.areaUnit]);
      retained.push(inserted.rows[0].id);
    }
  }
  if (retained.length) await client.query('DELETE FROM "PropertyInventory" WHERE "propertyId"=$1 AND NOT ("id"=ANY($2::uuid[]))', [propertyId,retained]);
  else await client.query('DELETE FROM "PropertyInventory" WHERE "propertyId"=$1', [propertyId]);
}

export async function createProperty(input: PropertyWrite): Promise<AdminProperty> {
  return withTransaction(async (client) => {
  const result = await client.query<AdminProperty>(
    `INSERT INTO "Property" (
       "slug", "title", "description", "location", "propertyType", "priceAmount",
       "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
       "representationType", "publicationStatus", "subtype", "projectName", "address", "locality", "city", "state", "locationUrl", "bedrooms", "bathrooms", "builtUpArea", "builtUpAreaUnit", "floorCount", "parkingSpaces", "roadAccess", "approvalInfo", "features", "customAttributes", "seoTitle", "seoDescription", "priceMinimum", "priceMaximum", "priceBasis", "availability", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29::jsonb,$30::jsonb,$31,$32,$33,$34,$35,$36,NOW())
    RETURNING ${adminPropertyColumns}`,
    [
      input.slug, input.title, input.description, input.location, input.propertyType,
      input.priceAmount, input.priceCurrency, input.priceMode, input.plotSize,
       input.plotSizeUnit, input.status, input.representationType, input.publicationStatus,
       input.subtype ?? null, input.projectName ?? null, input.address ?? null, input.locality ?? null, input.city ?? null, input.state ?? null,
       input.locationUrl ?? null, input.bedrooms ?? null, input.bathrooms ?? null, input.builtUpArea ?? null, input.builtUpAreaUnit ?? null,
       input.floorCount ?? null, input.parkingSpaces ?? null, input.roadAccess ?? null, input.approvalInfo ?? null,
       JSON.stringify(input.features ?? []), JSON.stringify(input.customAttributes ?? {}), input.seoTitle ?? null, input.seoDescription ?? null,
       input.priceMinimum ?? null, input.priceMaximum ?? null, input.priceBasis ?? 'TOTAL', input.availability ?? 'AVAILABLE',
    ],
  );
  await saveConfigurations(client, result.rows[0].id, input.configurations);
  await saveInventory(client, result.rows[0].id, input.inventory);
  return result.rows[0];
  });
}

export async function updateProperty(id: UUID, input: PropertyWrite): Promise<AdminProperty | null> {
  return withTransaction(async (client) => {
  const result = await client.query<AdminProperty>(
    `UPDATE "Property" SET
       "slug" = $2, "title" = $3, "description" = $4, "location" = $5,
       "propertyType" = $6, "priceAmount" = $7, "priceCurrency" = $8,
       "priceMode" = $9, "plotSize" = $10, "plotSizeUnit" = $11, "status" = $12,
       "representationType" = $13, "publicationStatus" = $14,
       "subtype"=$15,"projectName"=$16,"address"=$17,"locality"=$18,"city"=$19,"state"=$20,"locationUrl"=$21,
       "bedrooms"=$22,"bathrooms"=$23,"builtUpArea"=$24,"builtUpAreaUnit"=$25,"floorCount"=$26,"parkingSpaces"=$27,
       "roadAccess"=$28,"approvalInfo"=$29,"features"=$30::jsonb,"customAttributes"=$31::jsonb,"seoTitle"=$32,"seoDescription"=$33,
       "priceMinimum"=$34,"priceMaximum"=$35,"priceBasis"=$36,"availability"=$37,"updatedAt" = NOW()
     WHERE "id" = $1
    RETURNING ${adminPropertyColumns}`,
    [
      id, input.slug, input.title, input.description, input.location, input.propertyType,
      input.priceAmount, input.priceCurrency, input.priceMode, input.plotSize,
       input.plotSizeUnit, input.status, input.representationType, input.publicationStatus,
       input.subtype ?? null, input.projectName ?? null, input.address ?? null, input.locality ?? null, input.city ?? null, input.state ?? null,
       input.locationUrl ?? null, input.bedrooms ?? null, input.bathrooms ?? null, input.builtUpArea ?? null, input.builtUpAreaUnit ?? null,
       input.floorCount ?? null, input.parkingSpaces ?? null, input.roadAccess ?? null, input.approvalInfo ?? null,
       JSON.stringify(input.features ?? []), JSON.stringify(input.customAttributes ?? {}), input.seoTitle ?? null, input.seoDescription ?? null,
       input.priceMinimum ?? null, input.priceMaximum ?? null, input.priceBasis ?? 'TOTAL', input.availability ?? 'AVAILABLE',
    ],
  );
  if (result.rows[0]) {
    await saveConfigurations(client, id, input.configurations);
    await saveInventory(client, id, input.inventory);
  }
  return result.rows[0] ?? null;
  });
}

export async function deleteProperty(id: UUID): Promise<boolean> {
  const result = await pool.query('DELETE FROM "Property" WHERE "id" = $1', [id]);
  return Boolean(result.rowCount);
}

export async function transitionPropertyPublication(id: UUID, action: 'archive' | 'restore' | 'publish' | 'unpublish'): Promise<'updated' | 'missing' | 'invalid-transition'> {
  return withTransaction(async (client) => {
    const current = await client.query<{ publicationStatus: PublicationStatus }>(
      'SELECT "publicationStatus" FROM "Property" WHERE "id" = $1 FOR UPDATE', [id],
    );
    const status = current.rows[0]?.publicationStatus;
    if (!status) return 'missing';
    if ((action === 'archive' && status !== 'PUBLISHED')
      || (action === 'restore' && status !== 'ARCHIVED')
      || (action === 'publish' && status !== 'DRAFT')
      || (action === 'unpublish' && status !== 'PUBLISHED')) return 'invalid-transition';
    const target = action === 'archive' ? 'ARCHIVED' : action === 'unpublish' ? 'DRAFT' : 'PUBLISHED';
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
