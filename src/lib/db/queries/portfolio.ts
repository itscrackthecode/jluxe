import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl } from '@/lib/cloudinary';
import type {
  PortfolioWork,
  PortfolioWorkMediaItem,
  PortfolioWorkWithService,
  PublicationStatus,
  Service,
  ServiceCategory,
  UUID,
} from '../types';

export type PortfolioSort = 'latest' | 'oldest' | 'featured';

export type PublicPortfolioWork = Omit<Pick<
  PortfolioWork,
  'id' | 'slug' | 'title' | 'description' | 'location' | 'year' | 'featured' | 'createdAt'
>, 'createdAt'> & {
  createdAt: string;
  service: Pick<Service, 'id' | 'slug' | 'title'> & { categories: string[] };
};

export type PortfolioServiceOption = Pick<Service, 'id' | 'slug' | 'title'> & {
  categories: string[];
  categoryIds: UUID[];
};

export type AdminPortfolioWork = Omit<PortfolioWork, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  service: PortfolioServiceOption;
};

export type PortfolioWorkWrite = Pick<
  PortfolioWork,
  'title' | 'slug' | 'serviceId' | 'description' | 'location' | 'year' | 'featured' | 'publicationStatus'
>;

type PortfolioRow = Omit<Pick<
  PortfolioWork,
  'id' | 'slug' | 'title' | 'serviceId' | 'description' | 'location' | 'year' | 'featured' | 'createdAt'
>, 'createdAt'> & {
  createdAt: string;
  serviceSlug: string;
  serviceTitle: string;
  serviceCategories: string[];
};

function withService(row: PortfolioRow): PublicPortfolioWork {
  const { serviceId, serviceSlug, serviceTitle, serviceCategories, ...work } = row;
  return { ...work, service: { id: serviceId, slug: serviceSlug, title: serviceTitle, categories: serviceCategories } };
}

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function findServiceBySlug(slug: string): Promise<Pick<Service, 'id' | 'slug' | 'title'> | null> {
  const result = await pool.query<Pick<Service, 'id' | 'slug' | 'title'>>(
    'SELECT "id", "slug", "title" FROM "Service" WHERE "slug" = $1 LIMIT 1',
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function listPublicPortfolio(filters: {
  serviceSlug?: string;
  category?: string;
  location?: string;
  featured?: boolean;
  sort: PortfolioSort;
  limit: number;
  offset: number;
}): Promise<{ data: PublicPortfolioWork[]; total: number }> {
  const values = [
    filters.serviceSlug ?? null,
    filters.category ?? null,
    filters.location ? escapeLikeValue(filters.location) : null,
    filters.featured ?? null,
  ];
  const conditions = `
    w."publicationStatus" = 'PUBLISHED'
    AND ($1::text IS NULL OR s."slug" = $1)
    AND ($2::text IS NULL OR EXISTS (
      SELECT 1 FROM "ServiceCategoryService" scs JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId"
      WHERE scs."serviceId" = s."id" AND sc."name" = $2
    ))
    AND ($3::text IS NULL OR w."location" ILIKE '%' || $3 || '%' ESCAPE E'\\\\')
    AND ($4::boolean IS NULL OR w."featured" = $4)`;
  const orderBy: Record<PortfolioSort, string> = {
    latest: 'w."createdAt" DESC, w."id" DESC',
    oldest: 'w."createdAt" ASC, w."id" ASC',
    featured: 'w."featured" DESC, w."createdAt" DESC, w."id" DESC',
  };
  const from = `FROM "PortfolioWork" w JOIN "Service" s ON s."id" = w."serviceId"`;

  const [countResult, rowsResult] = await Promise.all([
    pool.query<{ total: string }>(`SELECT COUNT(*) AS "total" ${from} WHERE ${conditions}`, values),
    pool.query<PortfolioRow>(
      `SELECT w."id", w."slug", w."title", w."serviceId", w."description",
              w."location", w."year", w."featured",
              TO_CHAR(w."createdAt" AT TIME ZONE current_setting('TimeZone'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
              s."slug" AS "serviceSlug", s."title" AS "serviceTitle",
              COALESCE((SELECT array_agg(sc."name" ORDER BY sc."sortOrder") FROM "ServiceCategoryService" scs JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId" WHERE scs."serviceId" = s."id"), ARRAY[]::text[]) AS "serviceCategories"
       ${from} WHERE ${conditions}
       ORDER BY ${orderBy[filters.sort]} LIMIT $5 OFFSET $6`,
      [...values, filters.limit, filters.offset],
    ),
  ]);

  return {
    data: rowsResult.rows.map(withService),
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

export async function findPublishedPortfolioBySlug(slug: string): Promise<PublicPortfolioWork | null> {
  const result = await pool.query<PortfolioRow>(
    `SELECT w."id", w."slug", w."title", w."serviceId", w."description",
            w."location", w."year", w."featured",
            TO_CHAR(w."createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            s."slug" AS "serviceSlug", s."title" AS "serviceTitle",
            COALESCE((SELECT array_agg(sc."name" ORDER BY sc."sortOrder") FROM "ServiceCategoryService" scs JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId" WHERE scs."serviceId" = s."id"), ARRAY[]::text[]) AS "serviceCategories"
     FROM "PortfolioWork" w
     JOIN "Service" s ON s."id" = w."serviceId"
     WHERE w."slug" = $1 AND w."publicationStatus" = 'PUBLISHED'
     LIMIT 1`,
    [slug],
  );
  return result.rows[0] ? withService(result.rows[0]) : null;
}

export async function listPortfolioWorkMedia(portfolioWorkIds: UUID[]): Promise<PortfolioWorkMediaItem[]> {
  if (portfolioWorkIds.length === 0) return [];

  const result = await pool.query<PortfolioWorkMediaItem>(
    `SELECT pwm."portfolioWorkId", pwm."mediaId", pwm."position", pwm."altText",
              m."id", m."storageKey", m."mimeType", m."width", m."height", m."provider"
     FROM "PortfolioWorkMedia" pwm
     JOIN "Media" m ON m."id" = pwm."mediaId"
    WHERE pwm."portfolioWorkId" = ANY($1::uuid[])
    ORDER BY pwm."portfolioWorkId", pwm."position" ASC`,
    [portfolioWorkIds],
  );
    return result.rows.map((item) => ({ ...item, deliveryUrl: item.provider === 'cloudinary' ? cloudinaryDeliveryUrl(item.storageKey) : item.storageKey.startsWith('/') ? item.storageKey : null }));
}

export async function setPortfolioWorkCover(
  portfolioWorkId: UUID,
  mediaId: UUID | null,
): Promise<'updated' | 'work-missing' | 'media-missing'> {
  return withTransaction(async (client) => {
    const work = await client.query('SELECT "id" FROM "PortfolioWork" WHERE "id" = $1 LIMIT 1', [portfolioWorkId]);
    if (work.rowCount === 0) return 'work-missing';

    if (mediaId === null) {
      await client.query(
        'DELETE FROM "PortfolioWorkMedia" WHERE "portfolioWorkId" = $1 AND "position" = 0',
        [portfolioWorkId],
      );
      return 'updated';
    }

    const media = await client.query('SELECT "id" FROM "Media" WHERE "id" = $1 LIMIT 1', [mediaId]);
    if (media.rowCount === 0) return 'media-missing';

    // The cover is the image at position 0; other associated images keep their order after it.
    const existing = await client.query<{ mediaId: UUID; altText: string | null }>(
      `SELECT "mediaId", "altText" FROM "PortfolioWorkMedia"
       WHERE "portfolioWorkId" = $1
       ORDER BY "position" ASC`,
      [portfolioWorkId],
    );
    const coverAltText = existing.rows.find((row) => row.mediaId === mediaId)?.altText ?? null;
    const others = existing.rows.filter((row) => row.mediaId !== mediaId);
    await client.query('DELETE FROM "PortfolioWorkMedia" WHERE "portfolioWorkId" = $1', [portfolioWorkId]);
    await client.query(
      'INSERT INTO "PortfolioWorkMedia" ("portfolioWorkId", "mediaId", "position", "altText") VALUES ($1, $2, 0, $3)',
      [portfolioWorkId, mediaId, coverAltText],
    );
    for (const [index, item] of others.entries()) {
      await client.query(
        'INSERT INTO "PortfolioWorkMedia" ("portfolioWorkId", "mediaId", "position", "altText") VALUES ($1, $2, $3, $4)',
        [portfolioWorkId, item.mediaId, index + 1, item.altText],
      );
    }
    return 'updated';
  });
}

type AdminPortfolioRow = Omit<PortfolioWork, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  serviceSlug: string;
  serviceTitle: string;
  serviceCategories: string[];
  serviceCategoryIds: UUID[];
};

function withAdminService(row: AdminPortfolioRow): AdminPortfolioWork {
  const { serviceSlug, serviceTitle, serviceCategories, serviceCategoryIds, ...work } = row;
  return { ...work, service: { id: work.serviceId, slug: serviceSlug, title: serviceTitle, categories: serviceCategories, categoryIds: serviceCategoryIds } };
}

const adminPortfolioColumns = `
  w."id", w."slug", w."title", w."serviceId", w."description", w."location",
  w."year", w."featured", w."publicationStatus",
  TO_CHAR(w."createdAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR(w."updatedAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
  s."slug" AS "serviceSlug", s."title" AS "serviceTitle",
  COALESCE((SELECT array_agg(sc."name" ORDER BY sc."sortOrder") FROM "ServiceCategoryService" scs JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId" WHERE scs."serviceId" = s."id"), ARRAY[]::text[]) AS "serviceCategories",
  COALESCE((SELECT array_agg(sc."id" ORDER BY sc."sortOrder") FROM "ServiceCategoryService" scs JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId" WHERE scs."serviceId" = s."id"), ARRAY[]::uuid[]) AS "serviceCategoryIds"`;

export async function updatePortfolioWorkMedia(
  portfolioWorkId: UUID,
  mediaItems: Array<{ mediaId: UUID; altText?: string | null }>,
): Promise<'updated' | 'work-missing' | 'media-missing'> {
  return withTransaction(async (client) => {
    const work = await client.query('SELECT "id" FROM "PortfolioWork" WHERE "id" = $1 LIMIT 1', [portfolioWorkId]);
    if (work.rowCount === 0) return 'work-missing';

    if (mediaItems.length > 0) {
      const mediaIds = mediaItems.map((item) => item.mediaId);
      const mediaCheck = await client.query(
        'SELECT "id" FROM "Media" WHERE "id" = ANY($1::uuid[])',
        [mediaIds],
      );
      if (mediaCheck.rowCount !== mediaIds.length) return 'media-missing';
    }

    await client.query('DELETE FROM "PortfolioWorkMedia" WHERE "portfolioWorkId" = $1', [portfolioWorkId]);

    for (const [index, item] of mediaItems.entries()) {
      await client.query(
        'INSERT INTO "PortfolioWorkMedia" ("portfolioWorkId", "mediaId", "position", "altText") VALUES ($1, $2, $3, $4)',
        [portfolioWorkId, item.mediaId, index, item.altText ?? null],
      );
    }

    return 'updated';
  });
}

export async function listPortfolioServiceOptions(): Promise<PortfolioServiceOption[]> {
  const result = await pool.query<PortfolioServiceOption>(
    `SELECT s."id", s."slug", s."title",
       COALESCE(array_agg(sc."name" ORDER BY sc."sortOrder") FILTER (WHERE sc."id" IS NOT NULL), ARRAY[]::text[]) AS "categories",
       COALESCE(array_agg(sc."id" ORDER BY sc."sortOrder") FILTER (WHERE sc."id" IS NOT NULL), ARRAY[]::uuid[]) AS "categoryIds"
     FROM "Service" s
     LEFT JOIN "ServiceCategoryService" scs ON scs."serviceId" = s."id"
     LEFT JOIN "ServiceCategory" sc ON sc."id" = scs."categoryId"
     WHERE s."publicationStatus" = 'PUBLISHED'
     GROUP BY s."id"
     HAVING COUNT(sc."id") > 0
     ORDER BY MIN(sc."sortOrder"), MIN(s."sortOrder"), s."title", s."id"`,
  );
  return result.rows;
}

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const result = await pool.query<ServiceCategory>(
    'SELECT "id", "name", "slug", "sortOrder" FROM "ServiceCategory" ORDER BY "sortOrder", "name"',
  );
  return result.rows;
}

export async function findPortfolioServiceById(id: UUID): Promise<Pick<Service, 'id' | 'slug' | 'title'> | null> {
  const result = await pool.query<Pick<Service, 'id' | 'slug' | 'title'>>(
    'SELECT "id", "slug", "title" FROM "Service" WHERE "id" = $1 LIMIT 1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listAdminPortfolio(filters: {
  search?: string;
  serviceId?: UUID;
  publicationStatus?: PublicationStatus;
  featured?: boolean;
  sort: PortfolioSort;
  limit: number;
  offset: number;
}): Promise<{ data: AdminPortfolioWork[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [
    escapedSearch ? `%${escapedSearch}%` : null,
    filters.serviceId ?? null,
    filters.publicationStatus ?? null,
    filters.featured ?? null,
  ];
  const conditions = `
    ($1::text IS NULL OR w."title" ILIKE $1 ESCAPE E'\\\\')
    AND ($2::uuid IS NULL OR w."serviceId" = $2)
    AND ($3::"PublicationStatus" IS NULL OR w."publicationStatus" = $3::"PublicationStatus")
    AND ($4::boolean IS NULL OR w."featured" = $4)`;
  const orderBy: Record<PortfolioSort, string> = {
    latest: 'w."createdAt" DESC, w."id" DESC',
    oldest: 'w."createdAt" ASC, w."id" ASC',
    featured: 'w."featured" DESC, w."createdAt" DESC, w."id" DESC',
  };
  const from = 'FROM "PortfolioWork" w JOIN "Service" s ON s."id" = w."serviceId"';

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `SELECT COUNT(*) AS "total" ${from} WHERE ${conditions}`,
      values,
    );
    const rowsResult = await client.query<AdminPortfolioRow>(
      `SELECT ${adminPortfolioColumns} ${from} WHERE ${conditions}
       ORDER BY ${orderBy[filters.sort]} LIMIT $5 OFFSET $6`,
      [...values, filters.limit, filters.offset],
    );

    return {
      data: rowsResult.rows.map(withAdminService),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  });
}

export async function findAdminPortfolioById(id: UUID): Promise<AdminPortfolioWork | null> {
  const result = await pool.query<AdminPortfolioRow>(
    `SELECT ${adminPortfolioColumns}
     FROM "PortfolioWork" w
     JOIN "Service" s ON s."id" = w."serviceId"
     WHERE w."id" = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ? withAdminService(result.rows[0]) : null;
}

export async function createAdminPortfolioWork(input: PortfolioWorkWrite): Promise<AdminPortfolioWork> {
  const result = await pool.query<AdminPortfolioRow>(
    `WITH created AS (
       INSERT INTO "PortfolioWork" (
         "title", "slug", "serviceId", "description", "location", "year",
         "featured", "publicationStatus", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *
     )
     SELECT ${adminPortfolioColumns}
     FROM created w
     JOIN "Service" s ON s."id" = w."serviceId"`,
    [
      input.title, input.slug, input.serviceId, input.description, input.location,
      input.year, input.featured, input.publicationStatus,
    ],
  );
  return withAdminService(result.rows[0]);
}

export async function updateAdminPortfolioWork(
  id: UUID,
  input: PortfolioWorkWrite,
): Promise<AdminPortfolioWork | null> {
  const result = await pool.query<AdminPortfolioRow>(
    `WITH updated AS (
       UPDATE "PortfolioWork" SET
         "title" = $2,
         "slug" = $3,
         "serviceId" = $4,
         "description" = $5,
         "location" = $6,
         "year" = $7,
         "featured" = $8,
         "publicationStatus" = $9,
         "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING *
     )
     SELECT ${adminPortfolioColumns}
     FROM updated w
     JOIN "Service" s ON s."id" = w."serviceId"`,
    [
      id, input.title, input.slug, input.serviceId, input.description, input.location,
      input.year, input.featured, input.publicationStatus,
    ],
  );
  return result.rows[0] ? withAdminService(result.rows[0]) : null;
}

export async function deleteAdminPortfolioWork(id: UUID): Promise<boolean> {
  const result = await pool.query('DELETE FROM "PortfolioWork" WHERE "id" = $1', [id]);
  return Boolean(result.rowCount);
}
