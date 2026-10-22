ALTER TABLE public."CareerJob"
  ADD COLUMN "serviceArea" VARCHAR(80);

ALTER TABLE public."CareerJob"
  ADD CONSTRAINT "CareerJob_serviceArea_check"
  CHECK (
    "serviceArea" IS NULL OR
    "serviceArea" IN (
      'REAL_ESTATE',
      'BUSINESS_SOLUTIONS',
      'RECRUITMENT_AND_TRAINING',
      'INTERIOR_DESIGN_AND_ARCHITECTURE'
    )
  );
