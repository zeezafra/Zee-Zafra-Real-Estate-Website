-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('NAV_CTA', 'PROPERTY_PAGE', 'CTA_BANNER', 'VIEWING_FORM', 'SELL_PAGE', 'DIRECT');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "spam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "InquirySource" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Inquiry_propertyId_idx" ON "Inquiry"("propertyId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_spam_archived_idx" ON "Inquiry"("spam", "archived");

-- Backfill: any inquiry already sitting in a closed state before this
-- migration gets its createdAt as closedAt, so the "average days to
-- close" figure doesn't silently exclude every historical lead. It reads
-- as "closed the day it arrived," which is wrong but bounded — and the
-- alternative (NULL) would drop those rows from the average entirely.
UPDATE "Inquiry" SET "closedAt" = "createdAt" WHERE "status" IN ('CLOSED_WON', 'CLOSED_LOST');
