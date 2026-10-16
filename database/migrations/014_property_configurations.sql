CREATE TABLE IF NOT EXISTS public."PropertyConfiguration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "propertyId" UUID NOT NULL REFERENCES public."Property"("id") ON DELETE CASCADE,
  "position" INTEGER NOT NULL DEFAULT 0 CHECK ("position" >= 0),
  "optionName" VARCHAR(160),
  "areaValue" DECIMAL(14,2),
  "areaUnit" VARCHAR(16),
  "customAreaUnit" VARCHAR(80),
  "areaBasis" VARCHAR(24),
  "customAreaBasis" VARCHAR(100),
  "dimensionLength" DECIMAL(14,2),
  "dimensionWidth" DECIMAL(14,2),
  "notesMarkdown" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyConfiguration_areaValue_nonnegative_check" CHECK ("areaValue" IS NULL OR "areaValue" >= 0),
  CONSTRAINT "PropertyConfiguration_dimensionLength_nonnegative_check" CHECK ("dimensionLength" IS NULL OR "dimensionLength" >= 0),
  CONSTRAINT "PropertyConfiguration_dimensionWidth_nonnegative_check" CHECK ("dimensionWidth" IS NULL OR "dimensionWidth" >= 0),
  CONSTRAINT "PropertyConfiguration_areaUnit_check" CHECK ("areaUnit" IS NULL OR "areaUnit" IN ('SQ_FT', 'SQ_M', 'CENT', 'ACRE', 'OTHER')),
  CONSTRAINT "PropertyConfiguration_areaBasis_check" CHECK ("areaBasis" IS NULL OR "areaBasis" IN ('PLOT_AREA', 'BUILT_UP_AREA', 'CARPET_AREA', 'OTHER'))
);

-- CREATE TABLE IF NOT EXISTS leaves an older table untouched. Add the fields
-- required by the current application when a table with this name already exists.
ALTER TABLE public."PropertyConfiguration"
  ADD COLUMN IF NOT EXISTS "id" UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "propertyId" UUID,
  ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "optionName" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "areaValue" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "areaUnit" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "customAreaUnit" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "areaBasis" VARCHAR(24),
  ADD COLUMN IF NOT EXISTS "customAreaBasis" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "dimensionLength" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "dimensionWidth" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "notesMarkdown" TEXT;

-- An older PropertyConfiguration table may reuse the PlotSizeUnit enum,
-- whose labels differ from the configuration form's area unit values.
ALTER TABLE public."PropertyConfiguration"
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_areaUnit_check",
  DROP CONSTRAINT IF EXISTS "PropertyConfiguration_areaBasis_check";

ALTER TABLE public."PropertyConfiguration"
  ALTER COLUMN "areaUnit" DROP DEFAULT,
  ALTER COLUMN "areaUnit" TYPE VARCHAR(16) USING "areaUnit"::text,
  ALTER COLUMN "areaBasis" DROP DEFAULT,
  ALTER COLUMN "areaBasis" TYPE VARCHAR(24) USING "areaBasis"::text;

UPDATE public."PropertyConfiguration"
SET "areaUnit" = CASE "areaUnit"
  WHEN 'SQFT' THEN 'SQ_FT'
  WHEN 'SQM' THEN 'SQ_M'
  WHEN 'HECTARE' THEN 'OTHER'
  ELSE "areaUnit"
END,
"customAreaUnit" = CASE WHEN "areaUnit" = 'HECTARE' THEN COALESCE("customAreaUnit", 'hectare') ELSE "customAreaUnit" END;

UPDATE public."PropertyConfiguration"
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;

UPDATE public."PropertyConfiguration"
SET "position" = 0
WHERE "position" IS NULL;

ALTER TABLE public."PropertyConfiguration"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "id" SET NOT NULL,
  ALTER COLUMN "position" SET DEFAULT 0,
  ALTER COLUMN "position" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_propertyId_fkey'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_areaValue_nonnegative_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_areaValue_nonnegative_check"
      CHECK ("areaValue" IS NULL OR "areaValue" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_dimensionLength_nonnegative_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_dimensionLength_nonnegative_check"
      CHECK ("dimensionLength" IS NULL OR "dimensionLength" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_dimensionWidth_nonnegative_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_dimensionWidth_nonnegative_check"
      CHECK ("dimensionWidth" IS NULL OR "dimensionWidth" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_areaUnit_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_areaUnit_check"
      CHECK ("areaUnit" IS NULL OR "areaUnit" IN ('SQ_FT', 'SQ_M', 'CENT', 'ACRE', 'OTHER')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyConfiguration_areaBasis_check'
      AND conrelid = 'public."PropertyConfiguration"'::regclass
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ADD CONSTRAINT "PropertyConfiguration_areaBasis_check"
      CHECK ("areaBasis" IS NULL OR "areaBasis" IN ('PLOT_AREA', 'BUILT_UP_AREA', 'CARPET_AREA', 'OTHER')) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PropertyConfiguration_propertyId_position_idx"
  ON public."PropertyConfiguration" ("propertyId", "position");
