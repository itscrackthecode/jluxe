BEGIN;

-- Older PropertyConfiguration schemas included a cross-field check that is
-- not part of the current configuration model and blocks valid area options.
ALTER TABLE public."PropertyConfiguration"
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_area_matches_unit_check";

COMMIT;
