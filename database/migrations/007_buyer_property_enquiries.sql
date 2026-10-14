CREATE TABLE public."BuyerPropertyEnquiry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propertyType" VARCHAR(24) NOT NULL
    CHECK ("propertyType" IN ('RESIDENTIAL', 'COMMERCIAL', 'LAND_PLOT', 'OTHER')),
  "propertySubtype" VARCHAR(150) NOT NULL,
  "preferredCity" VARCHAR(255) NOT NULL,
  "preferredLocality" VARCHAR(255),
  "budgetMin" NUMERIC(14,2) NOT NULL CHECK ("budgetMin" > 0),
  "budgetMax" NUMERIC(14,2) NOT NULL CHECK ("budgetMax" >= "budgetMin"),
  "budgetCurrency" CHAR(3) NOT NULL DEFAULT 'INR',
  "purchasePurpose" VARCHAR(32),
  "propertyRequirements" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "purchaseTimeline" VARCHAR(32),
  "name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "phone" VARCHAR(32) NOT NULL,
  "preferredContactMethod" VARCHAR(16) NOT NULL
    CHECK ("preferredContactMethod" IN ('Phone', 'WhatsApp', 'Email')),
  "additionalRequirements" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuyerPropertyEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuyerPropertyEnquiry_createdAt_idx"
  ON public."BuyerPropertyEnquiry" ("createdAt" DESC);

CREATE INDEX "BuyerPropertyEnquiry_propertyType_createdAt_idx"
  ON public."BuyerPropertyEnquiry" ("propertyType", "createdAt" DESC);
