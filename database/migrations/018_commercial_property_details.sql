BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "commercialUse" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "commercialUseOther" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER,
  ADD COLUMN IF NOT EXISTS "recentUpgradesMarkdown" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionType" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "leaseStructureMarkdown" TEXT,
  ADD COLUMN IF NOT EXISTS "occupancyStatus" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "leaseExpiryDate" VARCHAR(10),
  ADD COLUMN IF NOT EXISTS "tenantProfileMarkdown" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_commercialUse_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_commercialUse_check"
      CHECK ("commercialUse" IS NULL OR "commercialUse" IN ('RETAIL', 'OFFICE', 'INDUSTRIAL', 'WAREHOUSE', 'MIXED_USE', 'OTHER')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_yearBuilt_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_yearBuilt_check"
      CHECK ("yearBuilt" IS NULL OR "yearBuilt" BETWEEN 1800 AND 2100) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_transactionType_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_transactionType_check"
      CHECK ("transactionType" IS NULL OR "transactionType" IN ('SALE', 'LEASE', 'RENT')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_occupancyStatus_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_occupancyStatus_check"
      CHECK ("occupancyStatus" IS NULL OR "occupancyStatus" IN ('VACANT', 'PARTIALLY_OCCUPIED', 'OCCUPIED', 'NOT_DISCLOSED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_leaseExpiryDate_format_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_leaseExpiryDate_format_check"
      CHECK ("leaseExpiryDate" IS NULL OR "leaseExpiryDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') NOT VALID;
  END IF;
END $$;

COMMIT;
