-- Forward repair for databases whose migration ledger includes 004 but whose
-- category tables are absent. Every DDL/data operation is safe to rerun.
CREATE TABLE IF NOT EXISTS "ServiceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceCategory_sortOrder_nonnegative_check" CHECK ("sortOrder" >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCategory_name_key" ON "ServiceCategory"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

CREATE TABLE IF NOT EXISTS "ServiceCategoryService" (
  "categoryId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ServiceCategoryService_pkey" PRIMARY KEY ("categoryId", "serviceId"),
  CONSTRAINT "ServiceCategoryService_sortOrder_nonnegative_check" CHECK ("sortOrder" >= 0),
  CONSTRAINT "ServiceCategoryService_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceCategoryService_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ServiceCategoryService_serviceId_idx" ON "ServiceCategoryService"("serviceId");

INSERT INTO "ServiceCategory" ("name", "slug", "sortOrder") VALUES
  ('Real Estate', 'real-estate', 10),
  ('Business Solutions', 'business-solutions', 20),
  ('Recruitment & Training', 'recruitment-training', 30),
  ('Interior Design', 'interior-design', 40)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder";

-- Keep existing IDs and foreign-key references for the canonical services.
INSERT INTO "Service" ("slug", "title", "publicationStatus", "sortOrder", "updatedAt") VALUES
  ('real-estate-sales', 'Real Estate Sales', 'PUBLISHED', 10, NOW()),
  ('real-estate-marketing', 'Real Estate Marketing', 'PUBLISHED', 20, NOW()),
  ('channel-partner', 'Channel Partner', 'PUBLISHED', 30, NOW()),
  ('marketing-solutions', 'Marketing Solutions', 'PUBLISHED', 10, NOW()),
  ('branding-solutions', 'Branding Solutions', 'PUBLISHED', 20, NOW()),
  ('lead-generation', 'Lead Generation', 'PUBLISHED', 30, NOW()),
  ('sales-business-development', 'Sales & Business Development', 'PUBLISHED', 40, NOW()),
  ('event-management', 'Event Management', 'PUBLISHED', 50, NOW()),
  ('recruitment-staffing', 'Recruitment & Staffing', 'PUBLISHED', 10, NOW()),
  ('corporate-training', 'Corporate Training', 'PUBLISHED', 20, NOW()),
  ('college-training-counselling', 'College Training & Counselling', 'PUBLISHED', 30, NOW()),
  ('interior-designing', 'Interior Designing', 'PUBLISHED', 10, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "publicationStatus" = EXCLUDED."publicationStatus",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- Reuse an existing Banking Services row (and therefore its ID) when possible.
-- Older catalogue data used separate category-specific slugs. Preserve those
-- rows, but point their work/enquiry references at the one canonical service.
DO $$
DECLARE
  canonical_id UUID;
  candidate_id UUID;
BEGIN
  SELECT "id" INTO canonical_id FROM "Service" WHERE "slug" = 'banking-services' LIMIT 1;

  IF canonical_id IS NULL THEN
    SELECT "id" INTO candidate_id
    FROM "Service"
    WHERE lower("title") = 'banking services'
    ORDER BY CASE WHEN "slug" IN ('real-estate-banking-services', 'business-banking-services') THEN 0 ELSE 1 END,
             "createdAt", "id"
    LIMIT 1;

    IF candidate_id IS NULL THEN
      INSERT INTO "Service" ("slug", "title", "publicationStatus", "sortOrder", "updatedAt")
      VALUES ('banking-services', 'Banking Services', 'PUBLISHED', 40, NOW())
      RETURNING "id" INTO canonical_id;
    ELSE
      UPDATE "Service"
      SET "slug" = 'banking-services',
          "title" = 'Banking Services',
          "publicationStatus" = 'PUBLISHED',
          "sortOrder" = 40,
          "updatedAt" = NOW()
      WHERE "id" = candidate_id
      RETURNING "id" INTO canonical_id;
    END IF;
  ELSE
    UPDATE "Service"
    SET "title" = 'Banking Services',
        "publicationStatus" = 'PUBLISHED',
        "sortOrder" = 40,
        "updatedAt" = NOW()
    WHERE "id" = canonical_id;
  END IF;

  UPDATE "PortfolioWork"
  SET "serviceId" = canonical_id
  WHERE "serviceId" IN (
    SELECT "id" FROM "Service"
    WHERE lower("title") = 'banking services' AND "id" <> canonical_id
  );
  UPDATE "Enquiry"
  SET "interestedServiceId" = canonical_id
  WHERE "interestedServiceId" IN (
    SELECT "id" FROM "Service"
    WHERE lower("title") = 'banking services' AND "id" <> canonical_id
  );
END $$;

INSERT INTO "ServiceCategoryService" ("categoryId", "serviceId", "sortOrder")
SELECT c."id", s."id", catalogue."position"
FROM (VALUES
  ('real-estate', 'real-estate-sales', 10),
  ('real-estate', 'real-estate-marketing', 20),
  ('real-estate', 'channel-partner', 30),
  ('real-estate', 'banking-services', 40),
  ('business-solutions', 'marketing-solutions', 10),
  ('business-solutions', 'branding-solutions', 20),
  ('business-solutions', 'lead-generation', 30),
  ('business-solutions', 'sales-business-development', 40),
  ('business-solutions', 'event-management', 50),
  ('business-solutions', 'banking-services', 60),
  ('recruitment-training', 'recruitment-staffing', 10),
  ('recruitment-training', 'corporate-training', 20),
  ('recruitment-training', 'college-training-counselling', 30),
  ('interior-design', 'interior-designing', 10)
) AS catalogue(category_slug, service_slug, position)
JOIN "ServiceCategory" c ON c."slug" = catalogue.category_slug
JOIN "Service" s ON s."slug" = catalogue.service_slug
ON CONFLICT ("categoryId", "serviceId") DO UPDATE
SET "sortOrder" = EXCLUDED."sortOrder";
