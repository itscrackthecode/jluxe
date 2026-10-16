ALTER TABLE public."Property"
  ADD COLUMN "sourceCategory" VARCHAR(40),
  ADD COLUMN "sourceCategoryOther" VARCHAR(120),
  ADD COLUMN "sellerOrganizationName" VARCHAR(200),
  ADD COLUMN "submitterRelationship" VARCHAR(40),
  ADD COLUMN "submitterRelationshipOther" VARCHAR(160),
  ADD COLUMN "representationRoleOther" VARCHAR(160),
  ADD COLUMN "authorityVerificationStatus" VARCHAR(24) NOT NULL DEFAULT 'NOT_CHECKED',
  ADD COLUMN "internalContactName" VARCHAR(150),
  ADD COLUMN "internalContactPhone" VARCHAR(32),
  ADD COLUMN "internalContactEmail" VARCHAR(320),
  ADD COLUMN "privateNotesMarkdown" TEXT;

ALTER TABLE public."Property"
  ADD CONSTRAINT "Property_sourceCategory_check"
    CHECK ("sourceCategory" IS NULL OR "sourceCategory" IN ('INDIVIDUAL_OWNER', 'LANDOWNER', 'DEVELOPER', 'BUILDER', 'PROJECT_PROMOTER', 'AUTHORIZED_REPRESENTATIVE', 'OTHER')),
  ADD CONSTRAINT "Property_submitterRelationship_check"
    CHECK ("submitterRelationship" IS NULL OR "submitterRelationship" IN ('OWNER', 'DEVELOPER', 'BUILDER', 'APPOINTED_REPRESENTATIVE', 'OTHER')),
  ADD CONSTRAINT "Property_authorityVerificationStatus_check"
    CHECK ("authorityVerificationStatus" IN ('NOT_CHECKED', 'IN_REVIEW', 'VERIFIED', 'UNABLE_TO_VERIFY'));

CREATE TABLE public."PropertyVerificationDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propertyId" UUID NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "content" BYTEA NOT NULL,
  "uploadedByAdminId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyVerificationDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyVerificationDocument_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PropertyVerificationDocument_uploadedByAdminId_fkey"
    FOREIGN KEY ("uploadedByAdminId") REFERENCES public."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PropertyVerificationDocument_mimeType_check"
    CHECK ("mimeType" IN ('application/pdf', 'application/msword')),
  CONSTRAINT "PropertyVerificationDocument_byteSize_check"
    CHECK ("byteSize" > 0 AND "byteSize" <= 4194304)
);

CREATE INDEX "PropertyVerificationDocument_propertyId_createdAt_idx"
  ON public."PropertyVerificationDocument"("propertyId", "createdAt" DESC);
