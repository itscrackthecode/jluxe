BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "furnishingStatus" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "furnishingStatusOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "amenitiesMarkdown" TEXT;

ALTER TABLE public."PropertyConfiguration"
  ADD COLUMN IF NOT EXISTS "bedroomCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "bathroomCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "floorNumber" VARCHAR(60);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyConfiguration_bedroomCount_check' AND conrelid = 'public."PropertyConfiguration"'::regclass) THEN
    ALTER TABLE public."PropertyConfiguration" ADD CONSTRAINT "PropertyConfiguration_bedroomCount_check" CHECK ("bedroomCount" IS NULL OR "bedroomCount" BETWEEN 0 AND 100) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyConfiguration_bathroomCount_check' AND conrelid = 'public."PropertyConfiguration"'::regclass) THEN
    ALTER TABLE public."PropertyConfiguration" ADD CONSTRAINT "PropertyConfiguration_bathroomCount_check" CHECK ("bathroomCount" IS NULL OR "bathroomCount" BETWEEN 0 AND 100) NOT VALID;
  END IF;
END $$;

COMMIT;
