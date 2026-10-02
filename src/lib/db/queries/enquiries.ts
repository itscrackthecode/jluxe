import { pool, withTransaction } from '../pool';
import type { Enquiry, EnquiryStatus, Service, UUID } from '../types';

export type NewEnquiry = Pick<
  Enquiry,
  'name' | 'email' | 'phone' | 'interestedServiceLabel' | 'message'
> & Partial<Pick<Enquiry, 'interestedServiceId' | 'propertyId'>>;

export type AdminEnquiryListItem = Omit<Pick<
  Enquiry,
  'id' | 'name' | 'email' | 'phone' | 'interestedServiceLabel' | 'status' | 'createdAt'
>, 'createdAt'> & {
  createdAt: string;
  property: { title: string; slug: string; location: string | null } | null;
};

export type AdminEnquiryDetail = Omit<Enquiry, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  interestedService: { title: string; slug: string } | null;
  property: { title: string; slug: string; location: string | null } | null;
};

export async function countNewEnquiries(): Promise<number> {
  const result = await pool.query<{ total: string }>(
    'SELECT COUNT(*) AS "total" FROM "Enquiry" WHERE "status" = \'NEW\'',
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function findServiceById(id: UUID): Promise<Pick<Service, 'id'> | null> {
  const result = await pool.query<Pick<Service, 'id'>>(
    'SELECT "id" FROM "Service" WHERE "id" = $1 LIMIT 1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createEnquiry(
  input: NewEnquiry,
): Promise<Pick<Enquiry, 'propertyId' | 'createdAt'>> {
  const result = await pool.query<{ propertyId: UUID | null; createdAt: string }>(
    `INSERT INTO "Enquiry" (
       "name", "email", "phone", "interestedServiceId", "interestedServiceLabel",
       "message", "propertyId", "updatedAt"
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING "propertyId",
       TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
    [
      input.name,
      input.email,
      input.phone,
      input.interestedServiceId ?? null,
      input.interestedServiceLabel,
      input.message,
      input.propertyId ?? null,
    ],
  );
  const enquiry = result.rows[0];
  return { propertyId: enquiry.propertyId, createdAt: new Date(enquiry.createdAt) };
}

export async function listAdminEnquiries(filters: {
  search?: string;
  status?: EnquiryStatus;
  limit: number;
  offset: number;
}): Promise<{ data: AdminEnquiryListItem[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [filters.status ?? null, escapedSearch ? `%${escapedSearch}%` : null];
  const conditions = `
    ($1::"EnquiryStatus" IS NULL OR e."status" = $1::"EnquiryStatus")
    AND ($2::text IS NULL OR e."name" ILIKE $2 ESCAPE E'\\\\'
      OR e."email" ILIKE $2 ESCAPE E'\\\\' OR e."phone" ILIKE $2 ESCAPE E'\\\\'
      OR e."message" ILIKE $2 ESCAPE E'\\\\')`;

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `SELECT COUNT(*) AS "total" FROM "Enquiry" e WHERE ${conditions}`,
      values,
    );
    const rowsResult = await client.query<AdminEnquiryListItem & {
      propertyTitle: string | null;
      propertySlug: string | null;
      propertyLocation: string | null;
    }>(
      `SELECT e."id", e."name", e."email", e."phone", e."interestedServiceLabel",
              e."status",
              TO_CHAR(e."createdAt" AT TIME ZONE current_setting('TimeZone'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
              p."title" AS "propertyTitle",
              p."slug" AS "propertySlug", p."location" AS "propertyLocation"
       FROM "Enquiry" e
       LEFT JOIN "Property" p ON p."id" = e."propertyId"
       WHERE ${conditions}
       ORDER BY e."createdAt" DESC, e."id" DESC
       LIMIT $3 OFFSET $4`,
      [...values, filters.limit, filters.offset],
    );

    return {
      total: Number(countResult.rows[0]?.total ?? 0),
      data: rowsResult.rows.map(({ propertyTitle, propertySlug, propertyLocation, ...enquiry }) => ({
        ...enquiry,
        property: propertyTitle === null || propertySlug === null
          ? null
          : { title: propertyTitle, slug: propertySlug, location: propertyLocation },
      })),
    };
  });
}

export async function findEnquiryById(id: UUID): Promise<AdminEnquiryDetail | null> {
  const result = await pool.query<AdminEnquiryDetail & {
    serviceTitle: string | null;
    serviceSlug: string | null;
    propertyTitle: string | null;
    propertySlug: string | null;
    propertyLocation: string | null;
  }>(
    `SELECT e."id", e."name", e."email", e."phone", e."interestedServiceId",
            e."interestedServiceLabel", e."propertyId", e."message", e."status",
            TO_CHAR(e."createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            TO_CHAR(e."updatedAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
            s."title" AS "serviceTitle", s."slug" AS "serviceSlug",
            p."title" AS "propertyTitle", p."slug" AS "propertySlug",
            p."location" AS "propertyLocation"
     FROM "Enquiry" e
     LEFT JOIN "Service" s ON s."id" = e."interestedServiceId"
     LEFT JOIN "Property" p ON p."id" = e."propertyId"
     WHERE e."id" = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  const {
    serviceTitle,
    serviceSlug,
    propertyTitle,
    propertySlug,
    propertyLocation,
    ...enquiry
  } = row;

  return {
    ...enquiry,
    interestedService: serviceTitle === null || serviceSlug === null
      ? null
      : { title: serviceTitle, slug: serviceSlug },
    property: propertyTitle === null || propertySlug === null
      ? null
      : { title: propertyTitle, slug: propertySlug, location: propertyLocation },
  };
}

export async function updateEnquiryStatus(
  id: UUID,
  status: EnquiryStatus,
): Promise<{ id: UUID; status: EnquiryStatus; updatedAt: string } | null> {
  const result = await pool.query<{ id: UUID; status: EnquiryStatus; updatedAt: string }>(
    `UPDATE "Enquiry"
     SET "status" = $2, "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING "id", "status",
       TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`,
    [id, status],
  );
  return result.rows[0] ?? null;
}

export type EnquiryExportRow = {
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  interestedServiceLabel: string;
  propertyTitle: string | null;
  message: string;
  status: EnquiryStatus;
};

export async function listEnquiriesForExport(filters: { search?: string; status?: EnquiryStatus }): Promise<EnquiryExportRow[]> {
  const search = filters.search ? `%${filters.search.replace(/[\\%_]/g, '\\$&')}%` : null;
  const values = [filters.status ?? null, search];
  const conditions = `($1::"EnquiryStatus" IS NULL OR e."status" = $1::"EnquiryStatus")
    AND ($2::text IS NULL OR e."name" ILIKE $2 ESCAPE E'\\\\' OR e."email" ILIKE $2 ESCAPE E'\\\\' OR e."phone" ILIKE $2 ESCAPE E'\\\\' OR e."message" ILIKE $2 ESCAPE E'\\\\')`;
  const result = await pool.query<EnquiryExportRow>(
    `SELECT TO_CHAR(e."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
            e."name", e."email", e."phone", e."interestedServiceLabel", p."title" AS "propertyTitle", e."message", e."status"
     FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
     WHERE ${conditions} ORDER BY e."createdAt" DESC, e."id" DESC`,
    values,
  );
  return result.rows;
}