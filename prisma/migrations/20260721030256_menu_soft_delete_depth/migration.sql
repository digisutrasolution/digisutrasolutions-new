-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MenuItem_location_deletedAt_idx" ON "MenuItem"("location", "deletedAt");
