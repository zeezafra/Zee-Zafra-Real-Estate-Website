-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "publishAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "publishAt" TIMESTAMP(3);
