-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "originalPrice" INTEGER,
ADD COLUMN     "refNo" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Property_refNo_key" ON "Property"("refNo");
