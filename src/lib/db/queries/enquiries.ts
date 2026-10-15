import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl } from '@/lib/cloudinary';
import { getConfigurationAvailability, getPropertyAvailability, isPropertyOptionEnquirable } from '@/lib/property-availability';
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
  configurationName: string | null;
  inventoryReference: string | null;
};

export type AdminEnquiryDetail = Omit<Enquiry, 'createdAt' | 'updatedAt'> & {
  enquiryType: 'GENERAL' | 'BUYER_REQUIREMENTS' | 'PROPERTY_ENQUIRY' | 'SELLER_SUBMISSION';
  createdAt: string;
  updatedAt: string;
  interestedService: { title: string; slug: string } | null;
  property: { title: string; slug: string; location: string | null } | null;
  configurationName: string | null;
  configurationPriceSnapshot: string | null;
  inventoryReference: string | null;
  inventoryPriceSnapshot: string | null;
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
  propertyId: UUID | null;
  propertyTitle: string;
  propertySlug: string;
  propertyLocation: string | null;
  configurationName: string | null;
  inventoryReference: string | null;
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
  configurationId?: UUID;
  inventoryId?: UUID;
}) {
  return withTransaction(async (client) => {
    const propertyResult = await client.query<{
      id: UUID; slug: string; title: string; location: string | null; propertyType: string;
      priceAmount: string | null; priceCurrency: string | null; priceMode: string;
      priceMinimum: string | null; priceMaximum: string | null; priceBasis: string; availability: string; imageUrl: string | null;
    }>(
      `SELECT p."id", p."slug", p."title", p."location", p."propertyType", p."priceAmount"::text AS "priceAmount", p."priceCurrency", p."priceMode", p."availability",
              p."priceMinimum"::text AS "priceMinimum", p."priceMaximum"::text AS "priceMaximum", p."priceBasis",
              (SELECT CASE WHEN m."provider" = 'cloudinary' THEN m."storageKey"
                           WHEN m."storageKey" LIKE 'https://%' THEN m."storageKey" ELSE NULL END
               FROM "PropertyMedia" pm JOIN "Media" m ON m."id" = pm."mediaId"
               WHERE pm."propertyId" = p."id" AND pm."assetType" = 'GALLERY'
               ORDER BY pm."position" ASC LIMIT 1) AS "imageUrl"
       FROM "Property" p WHERE p."slug" = $1 AND p."publicationStatus" = 'PUBLISHED'
       FOR SHARE`, [input.slug],
    );
    const property = propertyResult.rows[0];
    if (!property) return { kind: 'unavailable' as const };
    if (input.configurationId && input.inventoryId) return { kind: 'invalid-configuration' as const };
    const [configurationAvailabilityRows, inventoryAvailabilityRows] = await Promise.all([
      client.query<{ id: UUID; availability: string }>(`SELECT "id", "availability" FROM "PropertyConfiguration" WHERE "propertyId"=$1`, [property.id]),
      client.query<{ configurationId: UUID | null; availability: string }>(`SELECT "configurationId", "availability" FROM "PropertyInventory" WHERE "propertyId"=$1`, [property.id]),
    ]);
    const projectAvailability = getPropertyAvailability(property.availability, configurationAvailabilityRows.rows, inventoryAvailabilityRows.rows);
    if (!isPropertyOptionEnquirable(projectAvailability) && !input.configurationId && !input.inventoryId) return { kind: 'unavailable' as const };
    let selectedConfiguration: { id: UUID; name: string; priceSnapshot: string | null; availability: string } | null = null;
    let selectedInventory: { id: UUID; reference: string; priceSnapshot: string | null } | null = null;
    if (input.configurationId) {
      const configResult = await client.query<{ id: UUID; name: string; priceMode: string; priceAmount: string | null; priceMinimum: string | null; priceMaximum: string | null; priceCurrency: string | null; priceBasis: string; availability: string }>(
        `SELECT "id", "name", "priceMode", "priceAmount"::text AS "priceAmount", "priceMinimum"::text AS "priceMinimum", "priceMaximum"::text AS "priceMaximum", "priceCurrency", "priceBasis", "availability" FROM "PropertyConfiguration" WHERE "id"=$1 AND "propertyId"=$2 FOR SHARE`,
        [input.configurationId, property.id],
      );
      const config = configResult.rows[0];
      if (!config) return { kind: 'invalid-configuration' as const };
      const availability = getConfigurationAvailability(config, inventoryAvailabilityRows.rows);
      if (!isPropertyOptionEnquirable(availability)) return { kind: 'unavailable' as const };
      const price = config.priceMode === 'ON_REQUEST' ? 'Price on request'
        : config.priceMode === 'RANGE' && (config.priceMinimum || config.priceMaximum)
          ? `${config.priceCurrency ?? 'INR'} ${config.priceMinimum ?? '—'} – ${config.priceMaximum ?? '—'}${config.priceBasis !== 'TOTAL' ? ` ${config.priceBasis.toLowerCase()}` : ''}`
          : config.priceAmount ? `${config.priceCurrency ?? 'INR'} ${config.priceAmount}${config.priceMode === 'PER_UNIT' || config.priceBasis !== 'TOTAL' ? ` ${config.priceBasis.toLowerCase()}` : ''}` : null;
      selectedConfiguration = { id: config.id, name: config.name, priceSnapshot: price, availability };
    }
    if (input.inventoryId) {
      const inventoryResult = await client.query<{ id: UUID; reference: string; availability: string; priceAmount: string | null; priceCurrency: string | null }>(
        `SELECT "id", "reference", "availability", "priceAmount"::text AS "priceAmount", "priceCurrency" FROM "PropertyInventory" WHERE "id"=$1 AND "propertyId"=$2 FOR SHARE`,
        [input.inventoryId, property.id],
      );
      const inventory = inventoryResult.rows[0];
      if (!inventory) return { kind: 'invalid-configuration' as const };
      if (!isPropertyOptionEnquirable(inventory.availability)) return { kind: 'unavailable' as const };
      selectedInventory = { id: inventory.id, reference: inventory.reference, priceSnapshot: inventory.priceAmount ? `${inventory.priceCurrency ?? 'INR'} ${inventory.priceAmount}` : null };
    }
    const result = await client.query<{ id: UUID; createdAt: string }>(
      `INSERT INTO "Enquiry" ("name", "email", "phone", "interestedServiceLabel", "message", "propertyId", "configurationId", "configurationName", "configurationPriceSnapshot", "inventoryId", "inventoryReference", "inventoryPriceSnapshot", "updatedAt")
       VALUES ($1, $2, $3, 'Real Estate - Property Enquiry', $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING "id", TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
      [input.name, input.email, input.phone, input.message, property.id, selectedConfiguration?.id ?? null, selectedConfiguration?.name ?? null, selectedConfiguration?.priceSnapshot ?? null, selectedInventory?.id ?? null, selectedInventory?.reference ?? null, selectedInventory?.priceSnapshot ?? null],
    );
    return { kind: 'created' as const, enquiry: result.rows[0], property: {
      ...property,
      imageUrl: property.imageUrl
        ? property.imageUrl.startsWith('https://') ? property.imageUrl : cloudinaryDeliveryUrl(property.imageUrl, 560)
        : null,
    }, configuration: selectedConfiguration, inventory: selectedInventory };
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
                 e."status", e."createdAt", p."title" AS "propertyTitle", p."slug" AS "propertySlug", p."location" AS "propertyLocation", e."message", e."configurationName", e."inventoryReference"
         FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
         UNION ALL
         SELECT 'b:' || b."id"::text, b."name", b."email", b."phone", 'Buyer Requirements', 'BUYER_REQUIREMENTS',
                 b."status", b."createdAt", b."propertyTitle", b."propertySlug", b."propertyLocation",
                'Property type: ' || b."propertyType" || ' / ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                E'\\nPurpose: ' || COALESCE(b."purchasePurpose", 'Not provided') || E'\\nTimeline: ' || COALESCE(b."purchaseTimeline", 'Not provided') ||
                 E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided'), b."configurationName", b."inventoryReference"
                b."status", b."createdAt", NULL, NULL, NULL,
                'Property category: ' || b."propertyType" || ' / Property type: ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                CASE WHEN b."purchasePurpose" IS NOT NULL THEN E'\\nPurpose: ' || b."purchasePurpose" ELSE '' END ||
                CASE WHEN b."purchaseTimeline" IS NOT NULL THEN E'\\nTimeline: ' || b."purchaseTimeline" ELSE '' END ||
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
                 e."status", e."createdAt", p."title" AS "propertyTitle", p."slug" AS "propertySlug", p."location" AS "propertyLocation", e."message", e."configurationName", e."inventoryReference"
         FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
         UNION ALL
         SELECT 'b:' || b."id"::text, b."name", b."email", b."phone", 'Buyer Requirements', 'BUYER_REQUIREMENTS',
                 b."status", b."createdAt", b."propertyTitle", b."propertySlug", b."propertyLocation",
                'Property type: ' || b."propertyType" || ' / ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                E'\\nPurpose: ' || COALESCE(b."purchasePurpose", 'Not provided') || E'\\nTimeline: ' || COALESCE(b."purchaseTimeline", 'Not provided') ||
                 E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided'), b."configurationName", b."inventoryReference"
                b."status", b."createdAt", NULL, NULL, NULL,
                'Property category: ' || b."propertyType" || ' / Property type: ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
                E'\\nPreferred locality: ' || COALESCE(b."preferredLocality", 'Not provided') || E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text ||
                CASE WHEN b."purchasePurpose" IS NOT NULL THEN E'\\nPurpose: ' || b."purchasePurpose" ELSE '' END ||
                CASE WHEN b."purchaseTimeline" IS NOT NULL THEN E'\\nTimeline: ' || b."purchaseTimeline" ELSE '' END ||
                E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided')
         FROM public."BuyerPropertyEnquiry" b
       ) SELECT all_enquiries."id", all_enquiries."name", all_enquiries."email", all_enquiries."phone", all_enquiries."interestedServiceLabel",
              all_enquiries."enquiryType", all_enquiries."status",
              TO_CHAR(all_enquiries."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
               all_enquiries."propertyTitle", all_enquiries."propertySlug", all_enquiries."propertyLocation", all_enquiries."configurationName", all_enquiries."inventoryReference"
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

export async function deleteAdminEnquiries(ids: string[]): Promise<number> {
  const enquiryIds = ids.filter((id) => id.startsWith('e:')).map((id) => id.slice(2));
  const buyerIds = ids.filter((id) => id.startsWith('b:')).map((id) => id.slice(2));

  return withTransaction(async (client) => {
    const regularRows = enquiryIds.length
      ? await client.query<{ id: UUID }>(`SELECT "id" FROM "Enquiry" WHERE "id" = ANY($1::uuid[]) FOR UPDATE`, [enquiryIds])
      : { rows: [] as { id: UUID }[] };
    const buyerRows = buyerIds.length
      ? await client.query<{ id: UUID }>(`SELECT "id" FROM public."BuyerPropertyEnquiry" WHERE "id" = ANY($1::uuid[]) FOR UPDATE`, [buyerIds])
      : { rows: [] as { id: UUID }[] };

    if (regularRows.rows.length !== enquiryIds.length || buyerRows.rows.length !== buyerIds.length) {
      throw new Error('ENQUIRY_SELECTION_CHANGED');
    }

    if (enquiryIds.length) await client.query(`DELETE FROM "Enquiry" WHERE "id" = ANY($1::uuid[])`, [enquiryIds]);
    if (buyerIds.length) await client.query(`DELETE FROM public."BuyerPropertyEnquiry" WHERE "id" = ANY($1::uuid[])`, [buyerIds]);
    return ids.length;
  });
}

export async function findEnquiryById(id: UUID): Promise<AdminEnquiryDetail | null> {
    const [source, rawId] = id.startsWith('b:') || id.startsWith('e:') ? [id.slice(0, 1), id.slice(2)] : ['e', id];
  if (source === 'b') {
    const buyerResult = await pool.query<BuyerEnquiryQueryRow>(
      `SELECT "id", "name", "email", "phone", "status", "createdAt", "createdAt" AS "updatedAt",
              "propertyId", "propertyTitle", "propertySlug", "propertyLocation", "configurationName", "inventoryReference",
              "propertyType", "propertySubtype", "preferredCity", "preferredLocality", "budgetMin", "budgetMax",
              "purchasePurpose", "propertyRequirements", "purchaseTimeline", "preferredContactMethod", "additionalRequirements"
       FROM public."BuyerPropertyEnquiry" WHERE "id" = $1 LIMIT 1`, [rawId],
    );
    const b = buyerResult.rows[0];
    if (!b) return null;
    const details = Object.entries(b.propertyRequirements as Record<string, string>).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join('\n');
    return { id: `b:${b.id}`, name: b.name, email: b.email, phone: b.phone, interestedServiceId: null, interestedServiceLabel: 'Buyer Requirements', propertyId: b.propertyId,
      enquiryType: 'BUYER_REQUIREMENTS', message: `Property type: ${b.propertyType} / ${b.propertySubtype}\nPreferred location: ${b.preferredCity}\nPreferred locality: ${b.preferredLocality ?? 'Not provided'}\nBudget: INR ${b.budgetMin} to INR ${b.budgetMax}\nPurpose: ${b.purchasePurpose ?? 'Not provided'}\nTimeline: ${b.purchaseTimeline ?? 'Not provided'}\n${details}\nAdditional requirements: ${b.additionalRequirements ?? 'Not provided'}\nPreferred contact: ${b.preferredContactMethod}`,
       status: b.status, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(), interestedService: null,
       property: b.propertySlug ? { title: b.propertyTitle, slug: b.propertySlug, location: b.propertyLocation } : null,
       configurationName: b.configurationName, configurationPriceSnapshot: null, inventoryReference: b.inventoryReference, inventoryPriceSnapshot: null };
    return { id: `b:${b.id}`, name: b.name, email: b.email, phone: b.phone, interestedServiceId: null, interestedServiceLabel: 'Buyer Requirements', propertyId: null,
      enquiryType: 'BUYER_REQUIREMENTS', message: [`Property category: ${b.propertyType}`, `Property type: ${b.propertySubtype}`, `Preferred location: ${b.preferredCity}`, `Preferred locality: ${b.preferredLocality ?? 'Not provided'}`, `Budget: INR ${b.budgetMin} to INR ${b.budgetMax}`, b.purchasePurpose ? `Purpose: ${b.purchasePurpose}` : null, b.purchaseTimeline ? `Timeline: ${b.purchaseTimeline}` : null, details, `Additional requirements: ${b.additionalRequirements ?? 'Not provided'}`, `Preferred contact: ${b.preferredContactMethod}`].filter((line): line is string => Boolean(line)).join('\n'),
      status: b.status, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(), interestedService: null, property: null,
      configurationName: null, configurationPriceSnapshot: null, inventoryReference: null, inventoryPriceSnapshot: null };
  }
  const result = await pool.query<AdminEnquiryDetail & {
    serviceTitle: string | null;
    serviceSlug: string | null;
    propertyTitle: string | null;
    propertySlug: string | null;
    propertyLocation: string | null;
     configurationName: string | null;
     configurationPriceSnapshot: string | null;
     inventoryReference: string | null;
     inventoryPriceSnapshot: string | null;
  }>(
    `SELECT e."id", e."name", e."email", e."phone", e."interestedServiceId",
            e."interestedServiceLabel", e."propertyId", e."message", e."status",
            TO_CHAR(e."createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            TO_CHAR(e."updatedAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
            s."title" AS "serviceTitle", s."slug" AS "serviceSlug",
            p."title" AS "propertyTitle", p."slug" AS "propertySlug",
             p."location" AS "propertyLocation", e."configurationName", e."configurationPriceSnapshot", e."inventoryReference", e."inventoryPriceSnapshot"
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
    configurationName,
    configurationPriceSnapshot,
    inventoryReference,
    inventoryPriceSnapshot,
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
    configurationName,
    configurationPriceSnapshot,
    inventoryReference,
    inventoryPriceSnapshot,
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
            'Property category: ' || b."propertyType" || ' / Property type: ' || b."propertySubtype" || E'\\nPreferred location: ' || b."preferredCity" ||
            E'\\nBudget: INR ' || b."budgetMin"::text || ' to INR ' || b."budgetMax"::text || E'\\nRequirements: ' || COALESCE(b."additionalRequirements", 'Not provided') AS "message",
            b."status"
     FROM public."BuyerPropertyEnquiry" b
     WHERE ($1::"EnquiryStatus" IS NULL OR b."status" = $1::"EnquiryStatus")
       AND ($2::text IS NULL OR b."name" ILIKE $2 ESCAPE E'\\\\' OR b."email" ILIKE $2 ESCAPE E'\\\\' OR b."phone" ILIKE $2 ESCAPE E'\\\\' OR b."additionalRequirements" ILIKE $2 ESCAPE E'\\\\')
     ORDER BY b."createdAt" DESC, b."id" DESC`, values,
  );
  return [...result.rows, ...buyerResult.rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
