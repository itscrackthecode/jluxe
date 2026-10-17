BEGIN;

ALTER TYPE public."PriceMode" ADD VALUE IF NOT EXISTS 'EARLY_BIRD';

ALTER TABLE public."PropertyConfiguration"
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_priceMode_check";

ALTER TABLE public."PropertyConfiguration"
  ADD CONSTRAINT "PropertyConfiguration_priceMode_check"
    CHECK ("priceMode" IS NULL OR "priceMode" IN ('EXACT', 'STARTING_FROM', 'ON_REQUEST', 'EARLY_BIRD')) NOT VALID;

COMMIT;
