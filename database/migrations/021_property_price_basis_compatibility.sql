BEGIN;

ALTER TABLE public."Property"
  DROP CONSTRAINT IF EXISTS "Property_priceBasis_check";

UPDATE public."Property"
SET "priceBasis" = 'TOTAL_PRICE'
WHERE "priceBasis" = 'TOTAL';

ALTER TABLE public."Property"
  ADD CONSTRAINT "Property_priceBasis_check"
  CHECK ("priceBasis" IN ('TOTAL_PRICE', 'PER_SQFT', 'PER_CENT', 'OTHER'));

COMMIT;
