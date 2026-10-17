BEGIN;

ALTER TABLE public."PropertyConfiguration"
  ADD COLUMN IF NOT EXISTS "priceMode" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "priceAmount" NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS "priceBasis" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "customPriceBasis" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "additionalCharges" JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_priceAmount_nonnegative_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_priceAmount_nonnegative_check"
      CHECK ("priceAmount" IS NULL OR "priceAmount" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_priceMode_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_priceMode_check"
      CHECK ("priceMode" IS NULL OR "priceMode" IN ('EXACT', 'STARTING_FROM', 'ON_REQUEST')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_priceBasis_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_priceBasis_check"
      CHECK ("priceBasis" IS NULL OR "priceBasis" IN ('TOTAL_PRICE', 'PER_SQFT', 'PER_CENT', 'OTHER')) NOT VALID;
  END IF;
END $$;

COMMIT;
