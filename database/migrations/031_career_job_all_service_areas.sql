ALTER TABLE public."CareerJob"
  DROP CONSTRAINT IF EXISTS "CareerJob_serviceArea_check";

ALTER TABLE public."CareerJob"
  ADD CONSTRAINT "CareerJob_serviceArea_check"
  CHECK (
    "serviceArea" IS NULL OR
    "serviceArea" IN (
      'REAL_ESTATE',
      'BUSINESS_SOLUTIONS',
      'RECRUITMENT_AND_TRAINING',
      'INTERIOR_DESIGN_AND_ARCHITECTURE',
      'ALL_SERVICES'
    )
  );
