BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "facingDirection" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "facingOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "sunlightOrientation" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "neighborhoodType" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "neighborhoodTypeOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "floorCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "publicComplianceSummary" TEXT;

ALTER TABLE public."PropertyConfiguration"
  ADD COLUMN IF NOT EXISTS "carpetArea" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "superBuiltUpArea" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "roomConfiguration" JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_floorCount_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_floorCount_check" CHECK ("floorCount" IS NULL OR "floorCount" BETWEEN 1 AND 100) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyConfiguration_carpetArea_check' AND conrelid = 'public."PropertyConfiguration"'::regclass) THEN
    ALTER TABLE public."PropertyConfiguration" ADD CONSTRAINT "PropertyConfiguration_carpetArea_check" CHECK ("carpetArea" IS NULL OR "carpetArea" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyConfiguration_superBuiltUpArea_check' AND conrelid = 'public."PropertyConfiguration"'::regclass) THEN
    ALTER TABLE public."PropertyConfiguration" ADD CONSTRAINT "PropertyConfiguration_superBuiltUpArea_check" CHECK ("superBuiltUpArea" IS NULL OR "superBuiltUpArea" >= 0) NOT VALID;
  END IF;
END $$;

COMMIT;
