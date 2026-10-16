ALTER TYPE public."PropertyType" ADD VALUE IF NOT EXISTS 'RESIDENTIAL';
ALTER TYPE public."PropertyType" ADD VALUE IF NOT EXISTS 'LAND_PLOT';

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "shortSummary" TEXT,
  ADD COLUMN IF NOT EXISTS "propertyTypeOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "propertySubtype" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "propertySubtypeOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "locality" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "city" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "nearbyLandmark" VARCHAR(180),
  ADD COLUMN IF NOT EXISTS "district" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "state" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "pincode" VARCHAR(12),
  ADD COLUMN IF NOT EXISTS "publicAddressMode" VARCHAR(12) NOT NULL DEFAULT 'FALLBACK',
  ADD COLUMN IF NOT EXISTS "manualPublicAddress" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "mapLocation" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7);

UPDATE public."Property"
SET "publicAddressMode" = 'MANUAL', "manualPublicAddress" = "location"
WHERE "location" IS NOT NULL
  AND "publicAddressMode" = 'FALLBACK'
  AND "manualPublicAddress" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_publicAddressMode_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_publicAddressMode_check"
      CHECK ("publicAddressMode" IN ('FALLBACK', 'MANUAL'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_latitude_range_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_latitude_range_check"
      CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_longitude_range_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_longitude_range_check"
      CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
  END IF;
END $$;
