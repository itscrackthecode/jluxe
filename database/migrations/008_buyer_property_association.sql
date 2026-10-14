ALTER TABLE public."BuyerPropertyEnquiry"
  ADD COLUMN "propertyId" UUID,
  ADD COLUMN "propertyTitle" VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN "propertySlug" VARCHAR(180) NOT NULL DEFAULT '',
  ADD COLUMN "propertyLocation" VARCHAR(255);

ALTER TABLE public."BuyerPropertyEnquiry"
  ADD CONSTRAINT "BuyerPropertyEnquiry_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE SET NULL;

CREATE INDEX "BuyerPropertyEnquiry_propertyId_createdAt_idx"
  ON public."BuyerPropertyEnquiry" ("propertyId", "createdAt" DESC);
