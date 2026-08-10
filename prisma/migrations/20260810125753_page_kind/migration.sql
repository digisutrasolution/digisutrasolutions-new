-- CreateEnum
CREATE TYPE "PageKind" AS ENUM ('PAGE', 'LANDING', 'TEMPLATE');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "kind" "PageKind" NOT NULL DEFAULT 'PAGE';

-- CreateIndex
CREATE INDEX "Page_kind_status_idx" ON "Page"("kind", "status");
