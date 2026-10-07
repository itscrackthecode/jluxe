-- Normalize the single-category catalogue from migration 003. Keep the
-- existing Service rows as the referenced records wherever possible.
CREATE TABLE "ServiceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceCategory_name_key" UNIQUE ("name"),
  CONSTRAINT "ServiceCategory_slug_key" UNIQUE ("slug"),
  CONSTRAINT "ServiceCategory_sortOrder_nonnegative_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "ServiceCategoryService" (
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
CREATE INDEX "ServiceCategoryService_serviceId_idx" ON "ServiceCategoryService"("serviceId");

INSERT INTO "ServiceCategory" ("name", "slug", "sortOrder") VALUES
  ('Real Estate', 'real-estate', 10),
  ('Business Solutions', 'business-solutions', 20),
  ('Recruitment & Training', 'recruitment-training', 30),
  ('Interior Design', 'interior-design', 40);

-- Ensure every canonical service exists. Slug conflicts update catalogue
-- metadata in place, preserving each existing Service id and its references.
INSERT INTO "Service" ("slug", "title", "category", "publicationStatus", "sortOrder", "updatedAt") VALUES
  ('real-estate-sales', 'Real Estate Sales', 'Real Estate', 'PUBLISHED', 10, NOW()),
  ('real-estate-marketing', 'Real Estate Marketing', 'Real Estate', 'PUBLISHED', 20, NOW()),
  ('channel-partner', 'Channel Partner', 'Real Estate', 'PUBLISHED', 30, NOW()),
  ('banking-services', 'Banking Services', 'Real Estate', 'PUBLISHED', 40, NOW()),
  ('marketing-solutions', 'Marketing Solutions', 'Business Solutions', 'PUBLISHED', 10, NOW()),
  ('branding-solutions', 'Branding Solutions', 'Business Solutions', 'PUBLISHED', 20, NOW()),
  ('lead-generation', 'Lead Generation', 'Business Solutions', 'PUBLISHED', 30, NOW()),
  ('sales-business-development', 'Sales & Business Development', 'Business Solutions', 'PUBLISHED', 40, NOW()),
  ('event-management', 'Event Management', 'Business Solutions', 'PUBLISHED', 50, NOW()),
  ('recruitment-staffing', 'Recruitment & Staffing', 'Recruitment & Training', 'PUBLISHED', 10, NOW()),
  ('corporate-training', 'Corporate Training', 'Recruitment & Training', 'PUBLISHED', 20, NOW()),
  ('college-training-counselling', 'College Training & Counselling', 'Recruitment & Training', 'PUBLISHED', 30, NOW()),
  ('interior-designing', 'Interior Designing', 'Interior Design', 'PUBLISHED', 10, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "publicationStatus" = EXCLUDED."publicationStatus",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- Redirect legacy duplicate Banking Services references to the one canonical
-- Service record before deleting duplicate rows.
UPDATE "PortfolioWork"
SET "serviceId" = (SELECT "id" FROM "Service" WHERE "slug" = 'banking-services')
WHERE "serviceId" IN (
  SELECT "id" FROM "Service"
  WHERE lower("title") = 'banking services' AND "slug" <> 'banking-services'
);
UPDATE "Enquiry"
SET "interestedServiceId" = (SELECT "id" FROM "Service" WHERE "slug" = 'banking-services')
WHERE "interestedServiceId" IN (
  SELECT "id" FROM "Service"
  WHERE lower("title") = 'banking services' AND "slug" <> 'banking-services'
);
DELETE FROM "Service"
WHERE lower("title") = 'banking services' AND "slug" <> 'banking-services';

-- Preserve foreign-key rows for obvious test services by moving them to the
-- existing general business service before deleting the test records.
UPDATE "PortfolioWork"
SET "serviceId" = (SELECT "id" FROM "Service" WHERE "slug" = 'marketing-solutions')
WHERE "serviceId" IN (
  SELECT "id" FROM "Service" WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%'
);
UPDATE "Enquiry"
SET "interestedServiceId" = (SELECT "id" FROM "Service" WHERE "slug" = 'marketing-solutions')
WHERE "interestedServiceId" IN (
  SELECT "id" FROM "Service" WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%'
);
DELETE FROM "Service" WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%';

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
JOIN "Service" s ON s."slug" = catalogue.service_slug;
