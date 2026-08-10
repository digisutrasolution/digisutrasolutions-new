-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "landingPageId" TEXT,
ADD COLUMN     "landingPath" TEXT,
ADD COLUMN     "msclkid" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateIndex
CREATE INDEX "Lead_landingPageId_idx" ON "Lead"("landingPageId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
