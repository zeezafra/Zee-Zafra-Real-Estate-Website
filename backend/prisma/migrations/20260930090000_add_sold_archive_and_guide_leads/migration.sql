-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "soldAt" TIMESTAMP(3);

-- Backfill: listings already marked SOLD get their last-updated time as the
-- sold date so they show up in the archive immediately. Zee can correct the
-- real closing date per listing from the admin edit form.
UPDATE "Property" SET "soldAt" = "updatedAt" WHERE "status" = 'SOLD' AND "soldAt" IS NULL;

-- CreateTable
CREATE TABLE "GuideLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "guide" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideLead_createdAt_idx" ON "GuideLead"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuideLead_email_guide_key" ON "GuideLead"("email", "guide");
