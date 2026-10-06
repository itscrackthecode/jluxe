import { pool, withTransaction } from '../pool';
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

const adminPropertyColumns = `
  "id", "slug", "title", "description", "location", "propertyType", "priceAmount",
  "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
  "representationType", "publicationStatus",
  TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`;
export type PublicProperty = Omit<Pick<
  Property,
  | 'id' | 'slug' | 'title' | 'description' | 'location' | 'propertyType'
  | 'priceAmount' | 'priceCurrency' | 'priceMode' | 'plotSize' | 'plotSizeUnit'
  | 'status' | 'representationType' | 'createdAt'
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
      `SELECT "id", "slug", "title", "description", "location", "propertyType",
              "priceAmount", "priceCurrency", "priceMode", "plotSize", "plotSizeUnit",
              "status", "representationType",
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

export async function findPublishedPropertyBySlug(slug: string): Promise<PublicProperty | null> {
  const result = await pool.query<PublicProperty>(
    `SELECT "id", "slug", "title", "description", "location", "propertyType",
            "priceAmount", "priceCurrency", "priceMode", "plotSize", "plotSizeUnit",
            "status", "representationType",
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
            m."id", m."storageKey", m."mimeType", m."width", m."height"
     FROM "PropertyMedia" pm
     JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = $1
     ORDER BY pm."position" ASC`,
    [propertyId],
  );
  return result.rows;
}

export async function listPropertiesMedia(propertyIds: UUID[]): Promise<PropertyMediaItem[]> {
  if (propertyIds.length === 0) return [];

  const result = await pool.query<PropertyMediaItem>(
    `SELECT pm."propertyId", pm."mediaId", pm."position", pm."altText",
            m."id", m."storageKey", m."mimeType", m."width", m."height"
     FROM "PropertyMedia" pm
     JOIN "Media" m ON m."id" = pm."mediaId"
     WHERE pm."propertyId" = ANY($1::uuid[])
     ORDER BY pm."propertyId", pm."position" ASC`,
    [propertyIds],
  );
  return result.rows;
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
>;

export async function createProperty(input: PropertyWrite): Promise<AdminProperty> {
  const result = await pool.query<AdminProperty>(
    `INSERT INTO "Property" (
       "slug", "title", "description", "location", "propertyType", "priceAmount",
       "priceCurrency", "priceMode", "plotSize", "plotSizeUnit", "status",
       "representationType", "publicationStatus", "updatedAt"
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    RETURNING ${adminPropertyColumns}`,
    [
      input.slug, input.title, input.description, input.location, input.propertyType,
      input.priceAmount, input.priceCurrency, input.priceMode, input.plotSize,
      input.plotSizeUnit, input.status, input.representationType, input.publicationStatus,
    ],
  );
  return result.rows[0];
}

export async function updateProperty(id: UUID, input: PropertyWrite): Promise<AdminProperty | null> {
  const result = await pool.query<AdminProperty>(
    `UPDATE "Property" SET
       "slug" = $2, "title" = $3, "description" = $4, "location" = $5,
       "propertyType" = $6, "priceAmount" = $7, "priceCurrency" = $8,
       "priceMode" = $9, "plotSize" = $10, "plotSizeUnit" = $11, "status" = $12,
       "representationType" = $13, "publicationStatus" = $14, "updatedAt" = NOW()
     WHERE "id" = $1
    RETURNING ${adminPropertyColumns}`,
    [
      id, input.slug, input.title, input.description, input.location, input.propertyType,
      input.priceAmount, input.priceCurrency, input.priceMode, input.plotSize,
      input.plotSizeUnit, input.status, input.representationType, input.publicationStatus,
    ],
  );
  return result.rows[0] ?? null;
}

export async function deleteProperty(id: UUID): Promise<boolean> {
  const result = await pool.query('DELETE FROM "Property" WHERE "id" = $1', [id]);
  return Boolean(result.rowCount);
}