BEGIN;

ALTER TABLE public."Property"
  ADD COLUMN IF NOT EXISTS "roadAccess" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "proximityMarkdown" TEXT,
  ADD COLUMN IF NOT EXISTS "landApprovedFor" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "statutoryApprovals" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "otherStatutoryApprovals" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "approvalReference" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "waterSources" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "otherWaterSource" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "electricitySources" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "otherElectricitySource" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "drainageOptions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "otherDrainageOption" VARCHAR(200);

ALTER TABLE public."PropertyConfiguration"
  ADD COLUMN IF NOT EXISTS "plotNumber" VARCHAR(80);

CREATE TABLE IF NOT EXISTS public."PropertyLayoutDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propertyId" UUID NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(40) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "content" BYTEA NOT NULL,
  "uploadedByAdminId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PropertyLayoutDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyLayoutDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PropertyLayoutDocument_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES public."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PropertyLayoutDocument_mimeType_check" CHECK ("mimeType" IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT "PropertyLayoutDocument_byteSize_check" CHECK ("byteSize" > 0 AND "byteSize" <= 10485760)
);

CREATE INDEX IF NOT EXISTS "PropertyLayoutDocument_propertyId_createdAt_idx"
  ON public."PropertyLayoutDocument"("propertyId", "createdAt" DESC);

COMMIT;
