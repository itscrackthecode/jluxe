-- AlterTable Service: add category
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "category" VARCHAR(100);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_category_sortOrder_idx" ON "Service"("category", "sortOrder");

-- Canonical JLUXE Service Catalogue:
-- 1. Real Estate
INSERT INTO "Service" ("slug", "title", "category", "publicationStatus", "sortOrder", "updatedAt")
VALUES
  ('real-estate-sales', 'Real Estate Sales', 'Real Estate', 'PUBLISHED', 10, NOW()),
  ('real-estate-marketing', 'Real Estate Marketing', 'Real Estate', 'PUBLISHED', 20, NOW()),
  ('channel-partner', 'Channel Partner', 'Real Estate', 'PUBLISHED', 30, NOW()),
  ('real-estate-banking-services', 'Banking Services', 'Real Estate', 'PUBLISHED', 40, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "publicationStatus" = 'PUBLISHED',
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- 2. Business Solutions
INSERT INTO "Service" ("slug", "title", "category", "publicationStatus", "sortOrder", "updatedAt")
VALUES
  ('marketing-solutions', 'Marketing Solutions', 'Business Solutions', 'PUBLISHED', 10, NOW()),
  ('branding-solutions', 'Branding Solutions', 'Business Solutions', 'PUBLISHED', 20, NOW()),
  ('lead-generation', 'Lead Generation', 'Business Solutions', 'PUBLISHED', 30, NOW()),
  ('sales-business-development', 'Sales & Business Development', 'Business Solutions', 'PUBLISHED', 40, NOW()),
  ('event-management', 'Event Management', 'Business Solutions', 'PUBLISHED', 50, NOW()),
  ('business-banking-services', 'Banking Services', 'Business Solutions', 'PUBLISHED', 60, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "publicationStatus" = 'PUBLISHED',
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- 3. Recruitment & Training
INSERT INTO "Service" ("slug", "title", "category", "publicationStatus", "sortOrder", "updatedAt")
VALUES
  ('recruitment-staffing', 'Recruitment & Staffing', 'Recruitment & Training', 'PUBLISHED', 10, NOW()),
  ('corporate-training', 'Corporate Training', 'Recruitment & Training', 'PUBLISHED', 20, NOW()),
  ('college-training-counselling', 'College Training & Counselling', 'Recruitment & Training', 'PUBLISHED', 30, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "publicationStatus" = 'PUBLISHED',
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- 4. Interior Design
INSERT INTO "Service" ("slug", "title", "category", "publicationStatus", "sortOrder", "updatedAt")
VALUES
  ('interior-designing', 'Interior Designing', 'Interior Design', 'PUBLISHED', 10, NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "publicationStatus" = 'PUBLISHED',
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- Clean up test services like 'edited test servicee'
DO $$
DECLARE
  default_service_id UUID;
BEGIN
  SELECT "id" INTO default_service_id FROM "Service" WHERE "slug" = 'marketing-solutions' LIMIT 1;
  IF default_service_id IS NOT NULL THEN
    UPDATE "PortfolioWork"
    SET "serviceId" = default_service_id
    WHERE "serviceId" IN (
      SELECT "id" FROM "Service"
      WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%'
    );

    UPDATE "Enquiry"
    SET "interestedServiceId" = default_service_id
    WHERE "interestedServiceId" IN (
      SELECT "id" FROM "Service"
      WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%'
    );
  END IF;

  DELETE FROM "Service" WHERE "title" ILIKE '%test%' OR "slug" ILIKE '%test%';
END $$;
