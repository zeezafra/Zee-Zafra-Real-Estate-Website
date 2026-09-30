-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "alertsSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "type" "PropertyType",
    "listingType" "ListingType",
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minBeds" INTEGER,
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_token_key" ON "SavedSearch"("token");

-- CreateIndex
CREATE INDEX "SavedSearch_email_idx" ON "SavedSearch"("email");

-- CreateIndex
CREATE INDEX "SavedSearch_confirmedAt_idx" ON "SavedSearch"("confirmedAt");
