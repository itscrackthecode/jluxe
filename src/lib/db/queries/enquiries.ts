import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl } from '@/lib/cloudinary';
import type { Enquiry, EnquiryStatus, Service, UUID } from '../types';

export type NewEnquiry = Pick<
  Enquiry,
  'name' | 'email' | 'phone' | 'interestedServiceLabel' | 'message'
> & Partial<Pick<Enquiry, 'interestedServiceId' | 'propertyId'>>;

export type AdminEnquiryListItem = Omit<Pick<
  Enquiry,
  'id' | 'name' | 'email' | 'phone' | 'interestedServiceLabel' | 'status' | 'createdAt'
>, 'createdAt'> & {
  enquiryType: 'GENERAL' | 'BUYER_REQUIREMENTS' | 'PROPERTY_ENQUIRY' | 'SELLER_SUBMISSION';
  createdAt: string;
  property: { title: string; slug: string; location: string | null } | null;
};

export type AdminEnquiryDetail = Omit<Enquiry, 'createdAt' | 'updatedAt'> & {
  enquiryType: 'GENERAL' | 'BUYER_REQUIREMENTS' | 'PROPERTY_ENQUIRY' | 'SELLER_SUBMISSION';
  createdAt: string;
  updatedAt: string;
  interestedService: { title: string; slug: string } | null;
  property: { title: string; slug: string; location: string | null } | null;
};

interface BuyerEnquiryQueryRow {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
  propertyType: string;
  propertySubtype: string;
  preferredCity: string;
  preferredLocality: string | null;
  budgetMin: string;
  budgetMax: string;
  purchasePurpose: string | null;
  propertyRequirements: Record<string, string>;
  purchaseTimeline: string | null;
  preferredContactMethod: string;
  additionalRequirements: string | null;
}

export async function countNewEnquiries(): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `SELECT (SELECT COUNT(*) FROM "Enquiry" WHERE "status" = 'NEW') +
            (SELECT COUNT(*) FROM public."BuyerPropertyEnquiry" WHERE "status" = 'NEW') AS "total"`,
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

export async function createPropertyEnquiry(input: {
  slug: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  return withTransaction(async (client) => {
    const propertyResult = await client.query<{
      id: UUID; slug: string; title: string; location: string | null; propertyType: string;
      priceAmount: string | null; priceCurrency: string | null; priceMode: string; imageUrl: string | null;
    }>(
      `SELECT p."id", p."slug", p."title", p."location", p."propertyType", p."priceAmount", p."priceCurrency", p."priceMode",
              (SELECT CASE WHEN m."provider" = 'cloudinary' THEN m."storageKey"
                           WHEN m."storageKey" LIKE 'https://%' THEN m."storageKey" ELSE NULL END
               FROM "PropertyMedia" pm JOIN "Media" m ON m."id" = pm."mediaId"
               WHERE pm."propertyId" = p."id" ORDER BY pm."position" ASC LIMIT 1) AS "imageUrl"
       FROM "Property" p WHERE p."slug" = $1 AND p."publicationStatus" = 'PUBLISHED' AND p."status" IN ('AVAILABLE', 'UNDER_OFFER')
       FOR SHARE`, [input.slug],
    );
    const property = propertyResult.rows[0];
    if (!property) return { kind: 'unavailable' as const };
    const result = await client.query<{ id: UUID; createdAt: string }>(
      `INSERT INTO "Enquiry" ("name", "email", "phone", "interestedServiceLabel", "message", "propertyId", "updatedAt")
       VALUES ($1, $2, $3, 'Real Estate - Property Enquiry', $4, $5, NOW())
       RETURNING "id", TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
      [input.name, input.email, input.phone, input.message, property.id],
    );
    return { kind: 'created' as const, enquiry: result.rows[0], property: {
      ...property,
      imageUrl: property.imageUrl
        ? property.imageUrl.startsWith('https://') ? property.imageUrl : cloudinaryDeliveryUrl(property.imageUrl, 560)
        : null,
    } };
  });
}

export async function listAdminEnquiries(filters: {
  search?: string;
  status?: EnquiryStatus;
  limit: number;
  offset: number;
}): Promise<{ data: AdminEnquiryListItem[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [filters.status ?? null, escapedSearch ? `%${escapedSearch}%` : null];
  const conditions = `($1::"EnquiryStatus" IS NULL OR all_enquiries."status" = $1::"EnquiryStatus")
    AND ($2::text IS NULL OR all_enquiries."name" ILIKE $2 ESCAPE E'\\\\'
      OR all_enquiries."email" ILIKE $2 ESCAPE E'\\\\' OR all_enquiries."phone" ILIKE $2 ESCAPE E'\\\\'
      OR all_enquiries."message" ILIKE $2 ESCAPE E'\\\\')`;

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `WITH all_enquiries AS (
         SELECT 'e:' || e."id"::text AS "id", e."name", e."email", e."phone", e."interestedServiceLabel",
                CASE WHEN e."interestedServiceLabel" = 'Real Estate - Property Enquiry' THEN 'PROPERTY_ENQUIRY'
                     WHEN e."interestedServiceLabel" ILIKE '%Seller Property Submission%' THEN 'SELLER_SUBMISSION' ELSE 'GENERAL' END AS "enquiryType",
                e."status", e."createdAt", p."title" AS "propertyTitle", p."slug" AS "propertySlug", p."location" AS "propertyLocation", e."message"
         FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
         UNION ALL
         SELECT 'b:' || b."id"::text, b."name", b."email", b."phone", 'Buyer Requirements', 'BUYER_REQUIREMENTS',
                b."status", b."createdAt", NULL, NULL, NULL,
                'Property type: ' || b."propertyType" || ' / ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                E'\\nPurpose: ' || COALESCE(b."purchasePurpose", 'Not provided') || E'\\nTimeline: ' || COALESCE(b."purchaseTimeline", 'Not provided') ||
                E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided')
         FROM public."BuyerPropertyEnquiry" b
       ) SELECT COUNT(*) AS "total" FROM all_enquiries WHERE ${conditions}`,
      values,
    );
    const rowsResult = await client.query<AdminEnquiryListItem & {
      propertyTitle: string | null;
      propertySlug: string | null;
      propertyLocation: string | null;
    }>(
      `WITH all_enquiries AS (
         SELECT 'e:' || e."id"::text AS "id", e."name", e."email", e."phone", e."interestedServiceLabel",
                CASE WHEN e."interestedServiceLabel" = 'Real Estate - Property Enquiry' THEN 'PROPERTY_ENQUIRY'
                     WHEN e."interestedServiceLabel" ILIKE '%Seller Property Submission%' THEN 'SELLER_SUBMISSION' ELSE 'GENERAL' END AS "enquiryType",
                e."status", e."createdAt", p."title" AS "propertyTitle", p."slug" AS "propertySlug", p."location" AS "propertyLocation", e."message"
         FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
         UNION ALL
         SELECT 'b:' || b."id"::text, b."name", b."email", b."phone", 'Buyer Requirements', 'BUYER_REQUIREMENTS',
                b."status", b."createdAt", NULL, NULL, NULL,
                'Property type: ' || b."propertyType" || ' / ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                E'\\nPurpose: ' || COALESCE(b."purchasePurpose", 'Not provided') || E'\\nTimeline: ' || COALESCE(b."purchaseTimeline", 'Not provided') ||
                E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided')
         FROM public."BuyerPropertyEnquiry" b
       ) SELECT all_enquiries."id", all_enquiries."name", all_enquiries."email", all_enquiries."phone", all_enquiries."interestedServiceLabel",
              all_enquiries."enquiryType", all_enquiries."status",
              TO_CHAR(all_enquiries."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
              all_enquiries."propertyTitle", all_enquiries."propertySlug", all_enquiries."propertyLocation"
       FROM all_enquiries WHERE ${conditions}
       ORDER BY all_enquiries."createdAt" DESC, all_enquiries."id" DESC
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
  const [source, rawId] = id.startsWith('b:') || id.startsWith('e:') ? [id.slice(0, 1), id.slice(2)] : ['e', id];
  if (source === 'b') {
    const buyerResult = await pool.query<BuyerEnquiryQueryRow>(
      `SELECT "id", "name", "email", "phone", "status", "createdAt", "createdAt" AS "updatedAt",
              "propertyType", "propertySubtype", "preferredCity", "preferredLocality", "budgetMin", "budgetMax",
              "purchasePurpose", "propertyRequirements", "purchaseTimeline", "preferredContactMethod", "additionalRequirements"
       FROM public."BuyerPropertyEnquiry" WHERE "id" = $1 LIMIT 1`, [rawId],
    );
    const b = buyerResult.rows[0];
    if (!b) return null;
    const details = Object.entries(b.propertyRequirements as Record<string, string>).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join('\n');
    return { id: `b:${b.id}`, name: b.name, email: b.email, phone: b.phone, interestedServiceId: null, interestedServiceLabel: 'Buyer Requirements', propertyId: null,
      enquiryType: 'BUYER_REQUIREMENTS', message: `Property type: ${b.propertyType} / ${b.propertySubtype}\nPreferred location: ${b.preferredCity}\nPreferred locality: ${b.preferredLocality ?? 'Not provided'}\nBudget: INR ${b.budgetMin} to INR ${b.budgetMax}\nPurpose: ${b.purchasePurpose ?? 'Not provided'}\nTimeline: ${b.purchaseTimeline ?? 'Not provided'}\n${details}\nAdditional requirements: ${b.additionalRequirements ?? 'Not provided'}\nPreferred contact: ${b.preferredContactMethod}`,
      status: b.status, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(), interestedService: null, property: null };
  }
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
    [rawId],
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
    id: `e:${enquiry.id}`,
    enquiryType: enquiry.interestedServiceLabel === 'Real Estate - Property Enquiry' ? 'PROPERTY_ENQUIRY' : enquiry.interestedServiceLabel.includes('Seller Property Submission') ? 'SELLER_SUBMISSION' : 'GENERAL',
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
  if (id.startsWith('b:')) {
    const result = await pool.query<{ id: UUID; status: EnquiryStatus; updatedAt: string }>(
      `UPDATE public."BuyerPropertyEnquiry" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1
       RETURNING 'b:' || "id"::text AS "id", "status", TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`,
      [id.slice(2), status],
    );
    return result.rows[0] ?? null;
  }
  const rawId = id.startsWith('e:') ? id.slice(2) : id;
  const result = await pool.query<{ id: UUID; status: EnquiryStatus; updatedAt: string }>(
    `UPDATE "Enquiry"
     SET "status" = $2, "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING "id", "status",
       TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`,
    [rawId, status],
  );
  return result.rows[0] ?? null;
}

export type EnquiryExportRow = {
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  interestedServiceLabel: string;
  enquiryType: string;
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
            e."name", e."email", e."phone", e."interestedServiceLabel",
            CASE WHEN e."interestedServiceLabel" = 'Real Estate - Property Enquiry' THEN 'PROPERTY_ENQUIRY'
                 WHEN e."interestedServiceLabel" ILIKE '%Seller Property Submission%' THEN 'SELLER_SUBMISSION' ELSE 'GENERAL' END AS "enquiryType",
            p."title" AS "propertyTitle", e."message", e."status"
     FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
     WHERE ${conditions} ORDER BY e."createdAt" DESC, e."id" DESC`,
    values,
  );
  const buyerResult = await pool.query<EnquiryExportRow>(
    `SELECT TO_CHAR(b."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
            b."name", b."email", b."phone", 'Buyer Requirements' AS "interestedServiceLabel", 'BUYER_REQUIREMENTS' AS "enquiryType",
            NULL::text AS "propertyTitle",
            'Property type: ' || b."propertyType" || ' / ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
            E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text || E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided') AS "message",
            b."status"
     FROM public."BuyerPropertyEnquiry" b
     WHERE ($1::"EnquiryStatus" IS NULL OR b."status" = $1::"EnquiryStatus")
       AND ($2::text IS NULL OR b."name" ILIKE $2 ESCAPE E'\\\\' OR b."email" ILIKE $2 ESCAPE E'\\\\' OR b."phone" ILIKE $2 ESCAPE E'\\\\' OR b."additionalRequirements" ILIKE $2 ESCAPE E'\\\\')
     ORDER BY b."createdAt" DESC, b."id" DESC`, values,
  );
  return [...result.rows, ...buyerResult.rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
