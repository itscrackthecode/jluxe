ALTER TABLE public."CareerJob"
  DROP CONSTRAINT IF EXISTS "CareerJob_openings_positive_check";

ALTER TABLE public."CareerJob"
  ADD CONSTRAINT "CareerJob_openings_nonnegative_check"
  CHECK ("openings" >= 0);
