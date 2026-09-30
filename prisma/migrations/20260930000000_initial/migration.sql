-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('PLOT', 'VILLA', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'UNDER_OFFER', 'SOLD', 'LEASED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RepresentationType" AS ENUM ('CHANNEL_PARTNER', 'AUTHORIZED_REPRESENTATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('EXACT', 'STARTING_FROM', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "PlotSizeUnit" AS ENUM ('SQFT', 'SQM', 'ACRE', 'HECTARE');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Admin" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(150) NOT NULL,
    "role" "AdminRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "propertyType" "PropertyType" NOT NULL,
    "priceAmount" DECIMAL(14,2),
    "priceCurrency" CHAR(3),
    "priceMode" "PriceMode" NOT NULL DEFAULT 'EXACT',
    "plotSize" DECIMAL(12,2),
    "plotSizeUnit" "PlotSizeUnit",
    "status" "PropertyStatus" NOT NULL,
    "representationType" "RepresentationType" NOT NULL,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioWork" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "serviceId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(255),
    "year" SMALLINT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PortfolioWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "interestedServiceId" UUID,
    "interestedServiceLabel" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "propertyId" UUID,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storageKey" VARCHAR(500) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedByAdminId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMedia" (
    "propertyId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "altText" VARCHAR(255),

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("propertyId","mediaId")
);

-- CreateTable
CREATE TABLE "PortfolioWorkMedia" (
    "portfolioWorkId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "altText" VARCHAR(255),

    CONSTRAINT "PortfolioWorkMedia_pkey" PRIMARY KEY ("portfolioWorkId","mediaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_publicationStatus_sortOrder_idx" ON "Service"("publicationStatus", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_publicationStatus_status_propertyType_idx" ON "Property"("publicationStatus", "status", "propertyType");

-- CreateIndex
CREATE INDEX "Property_priceAmount_idx" ON "Property"("priceAmount");

-- CreateIndex
CREATE INDEX "Property_plotSize_idx" ON "Property"("plotSize");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioWork_slug_key" ON "PortfolioWork"("slug");

-- CreateIndex
CREATE INDEX "PortfolioWork_serviceId_idx" ON "PortfolioWork"("serviceId");

-- CreateIndex
CREATE INDEX "PortfolioWork_publicationStatus_featured_idx" ON "PortfolioWork"("publicationStatus", "featured");

-- CreateIndex
CREATE INDEX "Enquiry_interestedServiceId_idx" ON "Enquiry"("interestedServiceId");

-- CreateIndex
CREATE INDEX "Enquiry_propertyId_idx" ON "Enquiry"("propertyId");

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE INDEX "Media_uploadedByAdminId_idx" ON "Media"("uploadedByAdminId");

-- CreateIndex
CREATE INDEX "PropertyMedia_mediaId_idx" ON "PropertyMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMedia_propertyId_position_key" ON "PropertyMedia"("propertyId", "position");

-- CreateIndex
CREATE INDEX "PortfolioWorkMedia_mediaId_idx" ON "PortfolioWorkMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioWorkMedia_portfolioWorkId_position_key" ON "PortfolioWorkMedia"("portfolioWorkId", "position");

-- AddForeignKey
ALTER TABLE "PortfolioWork" ADD CONSTRAINT "PortfolioWork_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_interestedServiceId_fkey" FOREIGN KEY ("interestedServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioWorkMedia" ADD CONSTRAINT "PortfolioWorkMedia_portfolioWorkId_fkey" FOREIGN KEY ("portfolioWorkId") REFERENCES "PortfolioWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioWorkMedia" ADD CONSTRAINT "PortfolioWorkMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "Service" ADD CONSTRAINT "Service_sortOrder_nonnegative_check" CHECK ("sortOrder" >= 0);

-- AddCheckConstraint
ALTER TABLE "Property" ADD CONSTRAINT "Property_priceAmount_nonnegative_check" CHECK ("priceAmount" IS NULL OR "priceAmount" >= 0);

-- AddCheckConstraint
ALTER TABLE "Property" ADD CONSTRAINT "Property_priceCurrency_matches_amount_check" CHECK (("priceAmount" IS NULL) = ("priceCurrency" IS NULL));

-- AddCheckConstraint
ALTER TABLE "Property" ADD CONSTRAINT "Property_plotSize_positive_check" CHECK ("plotSize" IS NULL OR "plotSize" > 0);

-- AddCheckConstraint
ALTER TABLE "Property" ADD CONSTRAINT "Property_plotSizeUnit_matches_size_check" CHECK (("plotSize" IS NULL) = ("plotSizeUnit" IS NULL));

-- AddCheckConstraint
ALTER TABLE "Media" ADD CONSTRAINT "Media_byteSize_positive_check" CHECK ("byteSize" > 0);

-- AddCheckConstraint
ALTER TABLE "Media" ADD CONSTRAINT "Media_width_positive_check" CHECK ("width" IS NULL OR "width" > 0);

-- AddCheckConstraint
ALTER TABLE "Media" ADD CONSTRAINT "Media_height_positive_check" CHECK ("height" IS NULL OR "height" > 0);

-- AddCheckConstraint
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_position_nonnegative_check" CHECK ("position" >= 0);

-- AddCheckConstraint
ALTER TABLE "PortfolioWorkMedia" ADD CONSTRAINT "PortfolioWorkMedia_position_nonnegative_check" CHECK ("position" >= 0);
