-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('BUYER', 'SELLER');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "type" "InquiryType" NOT NULL DEFAULT 'BUYER';
