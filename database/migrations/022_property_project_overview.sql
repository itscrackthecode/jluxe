BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "projectTotalLandArea" NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS "projectPhaseLandArea" NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS "projectApartmentCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "projectVillaCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "projectFeaturesMarkdown" TEXT;

ALTER TABLE public."Property"
  ADD CONSTRAINT "Property_projectTotalLandArea_nonnegative_check"
    CHECK ("projectTotalLandArea" IS NULL OR "projectTotalLandArea" >= 0),
  ADD CONSTRAINT "Property_projectPhaseLandArea_nonnegative_check"
    CHECK ("projectPhaseLandArea" IS NULL OR "projectPhaseLandArea" >= 0),
  ADD CONSTRAINT "Property_projectApartmentCount_nonnegative_check"
    CHECK ("projectApartmentCount" IS NULL OR "projectApartmentCount" >= 0),
  ADD CONSTRAINT "Property_projectVillaCount_nonnegative_check"
    CHECK ("projectVillaCount" IS NULL OR "projectVillaCount" >= 0);

COMMIT;
