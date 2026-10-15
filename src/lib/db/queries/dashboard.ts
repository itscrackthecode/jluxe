import { pool } from '../pool';

export async function getAdminDashboardCounts() {
  const result = await pool.query<{ properties: string; published: string; drafts: string; archived: string; portfolio: string; enquiries: string; followUp: string }>(
    `SELECT
       (SELECT COUNT(*) FROM "Property") AS "properties",
       (SELECT COUNT(*) FROM "Property" WHERE "publicationStatus" = 'PUBLISHED') AS "published",
       (SELECT COUNT(*) FROM "Property" WHERE "publicationStatus" = 'DRAFT') AS "drafts",
       (SELECT COUNT(*) FROM "Property" WHERE "publicationStatus" = 'ARCHIVED') AS "archived",
       (SELECT COUNT(*) FROM "PortfolioWork") AS "portfolio",
       ((SELECT COUNT(*) FROM "Enquiry") + (SELECT COUNT(*) FROM public."BuyerPropertyEnquiry")) AS "enquiries",
       ((SELECT COUNT(*) FROM "Enquiry" WHERE "status" IN ('NEW','CONTACTED','IN_DISCUSSION')) +
        (SELECT COUNT(*) FROM public."BuyerPropertyEnquiry" WHERE "status" IN ('NEW','CONTACTED','IN_DISCUSSION'))) AS "followUp"`,
  );
  const row = result.rows[0];
  return {
    properties: Number(row?.properties ?? 0),
    published: Number(row?.published ?? 0),
    drafts: Number(row?.drafts ?? 0),
    archived: Number(row?.archived ?? 0),
    portfolio: Number(row?.portfolio ?? 0),
    enquiries: Number(row?.enquiries ?? 0),
    followUp: Number(row?.followUp ?? 0),
  };
}

export async function getAdminRecentActivity() {
  const result = await pool.query<{ kind: 'PROPERTY' | 'ENQUIRY'; label: string; detail: string; href: string; happenedAt: string }>(
    `WITH activity AS (
       SELECT 'PROPERTY'::text AS kind, p."title" AS label,
              'Property · ' || p."publicationStatus" AS detail,
              '/admin/properties/' || p."id"::text AS href, p."updatedAt" AS "happenedAt"
       FROM "Property" p
       UNION ALL
       SELECT 'ENQUIRY', 'New enquiry received',
              CASE WHEN p."title" IS NULL THEN e."interestedServiceLabel" ELSE 'Property · ' || p."title" END,
              '/admin/enquiries/e:' || e."id"::text, e."createdAt"
       FROM "Enquiry" e LEFT JOIN "Property" p ON p."id" = e."propertyId"
       UNION ALL
       SELECT 'ENQUIRY', 'Buyer requirements received',
              CASE WHEN b."propertyTitle" = '' THEN 'Buyer requirements' ELSE 'Property · ' || b."propertyTitle" END,
              '/admin/enquiries/b:' || b."id"::text, b."createdAt"
       FROM public."BuyerPropertyEnquiry" b
     )
     SELECT kind, label, detail, href,
       TO_CHAR("happenedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "happenedAt"
     FROM activity ORDER BY "happenedAt" DESC LIMIT 8`,
  );
  return result.rows;
}
