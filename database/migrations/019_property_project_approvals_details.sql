BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "approvalAuthority" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "projectPhase" SMALLINT,
  ADD COLUMN IF NOT EXISTS "constructionStatus" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "handoverDate" VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_projectPhase_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_projectPhase_check"
      CHECK ("projectPhase" IS NULL OR "projectPhase" BETWEEN 1 AND 6) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_handoverDate_format_check' AND conrelid = 'public."Property"'::regclass) THEN
    ALTER TABLE public."Property" ADD CONSTRAINT "Property_handoverDate_format_check"
      CHECK ("handoverDate" IS NULL OR "handoverDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') NOT VALID;
  END IF;
END $$;

COMMIT;
