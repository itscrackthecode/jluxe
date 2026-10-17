BEGIN;

-- The live table may have originated from an older configuration model with
-- mandatory currency and pricing-mode combinations. The current model keeps
-- configuration pricing optional and uses property-level currency.
ALTER TABLE public."PropertyConfiguration"
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_priceCurrency_matches_pricing_check",
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_pricingMode_matches_values_check";

ALTER TABLE public."PropertyConfiguration"
  ALTER COLUMN "priceMode" DROP NOT NULL,
  ALTER COLUMN "priceMode" DROP DEFAULT,
  ALTER COLUMN "priceBasis" DROP NOT NULL,
  ALTER COLUMN "priceBasis" DROP DEFAULT;

COMMIT;
