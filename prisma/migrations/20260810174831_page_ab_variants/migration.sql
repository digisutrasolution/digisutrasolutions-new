-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "variantOfId" TEXT,
ADD COLUMN     "variantWeight" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "PageView" ADD COLUMN     "pageId" TEXT;

-- CreateIndex
CREATE INDEX "Page_variantOfId_idx" ON "Page"("variantOfId");

-- CreateIndex
CREATE INDEX "PageView_pageId_createdAt_idx" ON "PageView"("pageId", "createdAt");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_variantOfId_fkey" FOREIGN KEY ("variantOfId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
