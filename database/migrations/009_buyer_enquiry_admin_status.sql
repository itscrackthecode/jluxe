ALTER TABLE public."BuyerPropertyEnquiry"
  ADD COLUMN "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  ADD COLUMN "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "BuyerPropertyEnquiry_status_createdAt_idx"
  ON public."BuyerPropertyEnquiry" ("status", "createdAt" DESC);
