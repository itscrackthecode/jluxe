BEGIN;

-- Recreate these checks instead of relying on IF NOT EXISTS: older databases
-- may already have constraints with the same names but legacy definitions.
ALTER TABLE public."PropertyConfiguration"
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_priceAmount_nonnegative_check",
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_priceMode_check",
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_priceBasis_check";

ALTER TABLE public."PropertyConfiguration"
  ADD CONSTRAINT "PropertyConfiguration_priceAmount_nonnegative_check"
    CHECK ("priceAmount" IS NULL OR "priceAmount" >= 0) NOT VALID,
  ADD CONSTRAINT "PropertyConfiguration_priceMode_check"
    CHECK ("priceMode" IS NULL OR "priceMode" IN ('EXACT', 'STARTING_FROM', 'ON_REQUEST')) NOT VALID,
  ADD CONSTRAINT "PropertyConfiguration_priceBasis_check"
    CHECK ("priceBasis" IS NULL OR "priceBasis" IN ('TOTAL_PRICE', 'PER_SQFT', 'PER_CENT', 'OTHER')) NOT VALID;

COMMIT;
