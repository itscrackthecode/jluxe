ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "priceBasis" VARCHAR(20) NOT NULL DEFAULT 'TOTAL_PRICE',
  ADD COLUMN IF NOT EXISTS "customPriceBasis" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "additionalCharges" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "offerDetails" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Property_priceBasis_check'
      AND conrelid = 'public."Property"'::regclass
  ) THEN
    ALTER TABLE public."Property"
      ADD CONSTRAINT "Property_priceBasis_check"
      CHECK ("priceBasis" IN ('TOTAL_PRICE', 'PER_SQFT', 'PER_CENT', 'OTHER'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Property_additionalCharges_array_check'
      AND conrelid = 'public."Property"'::regclass
  ) THEN
    ALTER TABLE public."Property"
      ADD CONSTRAINT "Property_additionalCharges_array_check"
      CHECK (jsonb_typeof("additionalCharges") = 'array');
  END IF;
END $$;
