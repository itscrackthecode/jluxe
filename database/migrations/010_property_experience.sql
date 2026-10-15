-- Additive property experience fields. Existing properties keep their IDs,
-- slugs, pricing, availability, media links, and enquiry relationships.
ALTER TABLE public."Property"
  ADD COLUMN "subtype" VARCHAR(100),
  ADD COLUMN "projectName" VARCHAR(200),
  ADD COLUMN "address" VARCHAR(500),
  ADD COLUMN "locality" VARCHAR(150),
  ADD COLUMN "city" VARCHAR(150),
  ADD COLUMN "state" VARCHAR(150),
  ADD COLUMN "locationUrl" VARCHAR(1000),
  ADD COLUMN "bedrooms" SMALLINT,
  ADD COLUMN "bathrooms" SMALLINT,
  ADD COLUMN "builtUpArea" DECIMAL(12,2),
  ADD COLUMN "builtUpAreaUnit" "PlotSizeUnit",
  ADD COLUMN "floorCount" SMALLINT,
  ADD COLUMN "parkingSpaces" SMALLINT,
  ADD COLUMN "roadAccess" VARCHAR(255),
  ADD COLUMN "approvalInfo" VARCHAR(500),
  ADD COLUMN "features" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "customAttributes" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN "seoTitle" VARCHAR(200),
  ADD COLUMN "seoDescription" VARCHAR(320),
  ADD COLUMN "priceMinimum" DECIMAL(14,2),
  ADD COLUMN "priceMaximum" DECIMAL(14,2),
  ADD COLUMN "priceBasis" VARCHAR(30) NOT NULL DEFAULT 'TOTAL';

ALTER TABLE public."Property"
  DROP CONSTRAINT "Property_priceCurrency_matches_amount_check",
  ADD CONSTRAINT "Property_priceCurrency_matches_pricing_check"
    CHECK (
      ("priceAmount" IS NOT NULL AND "priceCurrency" IS NOT NULL)
      OR ("priceAmount" IS NULL AND ("priceMinimum" IS NOT NULL OR "priceMaximum" IS NOT NULL) AND "priceCurrency" IS NOT NULL)
      OR ("priceAmount" IS NULL AND "priceMinimum" IS NULL AND "priceMaximum" IS NULL AND "priceCurrency" IS NULL)
    );

ALTER TABLE public."Property"
  ADD CONSTRAINT "Property_subtype_length_check" CHECK ("subtype" IS NULL OR length("subtype") <= 100),
  ADD CONSTRAINT "Property_locationUrl_https_check" CHECK ("locationUrl" IS NULL OR "locationUrl" ~* '^https://'),
  ADD CONSTRAINT "Property_bedrooms_nonnegative_check" CHECK ("bedrooms" IS NULL OR "bedrooms" >= 0),
  ADD CONSTRAINT "Property_bathrooms_nonnegative_check" CHECK ("bathrooms" IS NULL OR "bathrooms" >= 0),
  ADD CONSTRAINT "Property_floorCount_nonnegative_check" CHECK ("floorCount" IS NULL OR "floorCount" >= 0),
  ADD CONSTRAINT "Property_parkingSpaces_nonnegative_check" CHECK ("parkingSpaces" IS NULL OR "parkingSpaces" >= 0),
  ADD CONSTRAINT "Property_builtUpArea_positive_check" CHECK ("builtUpArea" IS NULL OR "builtUpArea" > 0),
  ADD CONSTRAINT "Property_builtUpAreaUnit_matches_area_check" CHECK (("builtUpArea" IS NULL) = ("builtUpAreaUnit" IS NULL)),
  ADD CONSTRAINT "Property_priceRange_nonnegative_check" CHECK (("priceMinimum" IS NULL OR "priceMinimum" >= 0) AND ("priceMaximum" IS NULL OR "priceMaximum" >= 0)),
  ADD CONSTRAINT "Property_priceRange_order_check" CHECK ("priceMinimum" IS NULL OR "priceMaximum" IS NULL OR "priceMinimum" <= "priceMaximum"),
  ADD CONSTRAINT "Property_priceBasis_check" CHECK ("priceBasis" IN ('TOTAL', 'PER_UNIT', 'PER_SQFT', 'PER_SQM', 'PER_ACRE')),
  ADD CONSTRAINT "Property_features_array_check" CHECK (jsonb_typeof("features") = 'array'),
  ADD CONSTRAINT "Property_customAttributes_object_check" CHECK (jsonb_typeof("customAttributes") = 'object');

-- Publication and availability stay separate. These fields intentionally use
-- constrained varchar values to avoid changing the existing PropertyStatus enum.
ALTER TABLE public."Property"
  ADD COLUMN "availability" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE';
UPDATE public."Property"
SET "availability" = CASE
  WHEN "status" = 'UNDER_OFFER' THEN 'RESERVED'
  WHEN "status" IN ('SOLD', 'LEASED', 'WITHDRAWN') THEN 'UNAVAILABLE'
  ELSE 'AVAILABLE'
END;
ALTER TABLE public."Property"
  ADD CONSTRAINT "Property_availability_check" CHECK ("availability" IN ('AVAILABLE', 'LIMITED', 'COMING_SOON', 'RESERVED', 'SOLD_OUT', 'UNAVAILABLE'));

CREATE TABLE public."PropertyConfiguration" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propertyId" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "area" DECIMAL(12,2),
  "areaUnit" "PlotSizeUnit",
  "bedrooms" SMALLINT,
  "bathrooms" SMALLINT,
  "floor" VARCHAR(80),
  "block" VARCHAR(100),
  "priceMode" VARCHAR(20) NOT NULL DEFAULT 'ON_REQUEST',
  "priceAmount" DECIMAL(14,2),
  "priceMinimum" DECIMAL(14,2),
  "priceMaximum" DECIMAL(14,2),
  "priceCurrency" CHAR(3),
  "priceBasis" VARCHAR(30) NOT NULL DEFAULT 'TOTAL',
  "availability" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
  "availableUnits" INTEGER,
  "features" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyConfiguration_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE CASCADE,
  CONSTRAINT "PropertyConfiguration_name_nonempty_check" CHECK (length(trim("name")) > 0),
  CONSTRAINT "PropertyConfiguration_area_matches_unit_check" CHECK (("area" IS NULL) = ("areaUnit" IS NULL)),
  CONSTRAINT "PropertyConfiguration_priceMode_check" CHECK ("priceMode" IN ('EXACT', 'RANGE', 'PER_UNIT', 'ON_REQUEST')),
  CONSTRAINT "PropertyConfiguration_priceAmount_nonnegative_check" CHECK ("priceAmount" IS NULL OR "priceAmount" >= 0),
  CONSTRAINT "PropertyConfiguration_pricingMode_matches_values_check" CHECK (
    ("priceMode" = 'RANGE' AND "priceAmount" IS NULL AND ("priceMinimum" IS NOT NULL OR "priceMaximum" IS NOT NULL))
    OR ("priceMode" = 'EXACT' AND "priceAmount" IS NOT NULL AND "priceMinimum" IS NULL AND "priceMaximum" IS NULL)
    OR ("priceMode" = 'PER_UNIT' AND "priceAmount" IS NOT NULL AND "priceMinimum" IS NULL AND "priceMaximum" IS NULL AND "priceBasis" <> 'TOTAL')
    OR ("priceMode" = 'ON_REQUEST' AND "priceAmount" IS NULL AND "priceMinimum" IS NULL AND "priceMaximum" IS NULL)
  ),
  CONSTRAINT "PropertyConfiguration_priceCurrency_matches_pricing_check" CHECK (("priceAmount" IS NOT NULL AND "priceCurrency" IS NOT NULL) OR ("priceAmount" IS NULL AND ("priceMinimum" IS NOT NULL OR "priceMaximum" IS NOT NULL) AND "priceCurrency" IS NOT NULL) OR ("priceAmount" IS NULL AND "priceMinimum" IS NULL AND "priceMaximum" IS NULL AND "priceCurrency" IS NULL)),
  CONSTRAINT "PropertyConfiguration_priceRange_check" CHECK (("priceMinimum" IS NULL OR "priceMinimum" >= 0) AND ("priceMaximum" IS NULL OR "priceMaximum" >= 0) AND ("priceMinimum" IS NULL OR "priceMaximum" IS NULL OR "priceMinimum" <= "priceMaximum")),
  CONSTRAINT "PropertyConfiguration_priceBasis_check" CHECK ("priceBasis" IN ('TOTAL', 'PER_UNIT', 'PER_SQFT', 'PER_SQM', 'PER_ACRE')),
  CONSTRAINT "PropertyConfiguration_availability_check" CHECK ("availability" IN ('AVAILABLE', 'LIMITED', 'COMING_SOON', 'RESERVED', 'SOLD_OUT', 'UNAVAILABLE')),
  CONSTRAINT "PropertyConfiguration_availableUnits_nonnegative_check" CHECK ("availableUnits" IS NULL OR "availableUnits" >= 0),
  CONSTRAINT "PropertyConfiguration_bedrooms_nonnegative_check" CHECK ("bedrooms" IS NULL OR "bedrooms" >= 0),
  CONSTRAINT "PropertyConfiguration_bathrooms_nonnegative_check" CHECK ("bathrooms" IS NULL OR "bathrooms" >= 0),
  CONSTRAINT "PropertyConfiguration_features_array_check" CHECK (jsonb_typeof("features") = 'array')
);
CREATE INDEX "PropertyConfiguration_propertyId_idx" ON public."PropertyConfiguration"("propertyId");

CREATE TABLE public."PropertyInventory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propertyId" UUID NOT NULL,
  "configurationId" UUID,
  "reference" VARCHAR(120) NOT NULL,
  "availability" VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
  "priceAmount" DECIMAL(14,2),
  "priceCurrency" CHAR(3),
  "area" DECIMAL(12,2),
  "areaUnit" "PlotSizeUnit",
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyInventory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyInventory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE CASCADE,
  CONSTRAINT "PropertyInventory_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES public."PropertyConfiguration"("id") ON DELETE SET NULL,
  CONSTRAINT "PropertyInventory_propertyId_reference_key" UNIQUE ("propertyId", "reference"),
  CONSTRAINT "PropertyInventory_availability_check" CHECK ("availability" IN ('AVAILABLE', 'LIMITED', 'COMING_SOON', 'RESERVED', 'SOLD_OUT', 'UNAVAILABLE')),
  CONSTRAINT "PropertyInventory_price_matches_currency_check" CHECK (("priceAmount" IS NULL) = ("priceCurrency" IS NULL)),
  CONSTRAINT "PropertyInventory_area_matches_unit_check" CHECK (("area" IS NULL) = ("areaUnit" IS NULL))
);
CREATE INDEX "PropertyInventory_propertyId_idx" ON public."PropertyInventory"("propertyId");

ALTER TABLE public."PropertyMedia"
  ADD COLUMN "assetType" VARCHAR(20) NOT NULL DEFAULT 'GALLERY';
ALTER TABLE public."PropertyMedia"
  ADD CONSTRAINT "PropertyMedia_assetType_check" CHECK ("assetType" IN ('GALLERY', 'FLOOR_PLAN', 'BROCHURE', 'PRICE_DOCUMENT', 'PROMO_LANDSCAPE', 'PROMO_PORTRAIT'));
DROP INDEX public."PropertyMedia_propertyId_position_key";
CREATE UNIQUE INDEX "PropertyMedia_propertyId_assetType_position_key" ON public."PropertyMedia"("propertyId", "assetType", "position");

CREATE TABLE public."PropertyConfigurationMedia" (
  "configurationId" UUID NOT NULL,
  "mediaId" UUID NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "assetType" VARCHAR(20) NOT NULL DEFAULT 'GALLERY',
  "altText" VARCHAR(255),
  CONSTRAINT "PropertyConfigurationMedia_pkey" PRIMARY KEY ("configurationId", "mediaId"),
  CONSTRAINT "PropertyConfigurationMedia_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES public."PropertyConfiguration"("id") ON DELETE CASCADE,
  CONSTRAINT "PropertyConfigurationMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."Media"("id") ON DELETE RESTRICT,
  CONSTRAINT "PropertyConfigurationMedia_position_check" CHECK ("position" >= 0),
  CONSTRAINT "PropertyConfigurationMedia_assetType_check" CHECK ("assetType" IN ('GALLERY', 'FLOOR_PLAN', 'BROCHURE', 'PRICE_DOCUMENT', 'PROMO_LANDSCAPE', 'PROMO_PORTRAIT'))
);

ALTER TABLE public."Enquiry"
  ADD COLUMN "configurationId" UUID,
  ADD COLUMN "configurationName" VARCHAR(150),
  ADD COLUMN "configurationPriceSnapshot" VARCHAR(120),
  ADD COLUMN "inventoryId" UUID,
  ADD COLUMN "inventoryReference" VARCHAR(120),
  ADD COLUMN "inventoryPriceSnapshot" VARCHAR(120),
  ADD CONSTRAINT "Enquiry_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES public."PropertyConfiguration"("id") ON DELETE SET NULL;
ALTER TABLE public."Enquiry"
  ADD CONSTRAINT "Enquiry_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public."PropertyInventory"("id") ON DELETE SET NULL;
ALTER TABLE public."BuyerPropertyEnquiry"
  ADD COLUMN "configurationId" UUID,
  ADD COLUMN "configurationName" VARCHAR(150),
  ADD COLUMN "inventoryId" UUID,
  ADD COLUMN "inventoryReference" VARCHAR(120),
  ADD CONSTRAINT "BuyerPropertyEnquiry_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES public."PropertyConfiguration"("id") ON DELETE SET NULL;
ALTER TABLE public."BuyerPropertyEnquiry"
  ADD CONSTRAINT "BuyerPropertyEnquiry_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public."PropertyInventory"("id") ON DELETE SET NULL;

ALTER TABLE public."PortfolioWork"
  ADD COLUMN "propertyId" UUID,
  ADD CONSTRAINT "PortfolioWork_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"("id") ON DELETE SET NULL;
CREATE INDEX "PortfolioWork_propertyId_idx" ON public."PortfolioWork"("propertyId");
