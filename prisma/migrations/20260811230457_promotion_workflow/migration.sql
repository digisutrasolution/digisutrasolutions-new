-- Promotion lifecycle: replace the isActive boolean with a status enum.
--
-- Prisma's generated version dropped isActive and defaulted every row to
-- DRAFT, which would have taken every currently-live offer off the public
-- site the moment this ran. The column is therefore READ before it is
-- dropped, and each row carried across to the state that matches what it was
-- actually doing.

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'LIVE', 'PAUSED', 'ENDED');

-- AlterTable: new columns first, so the data migration below has somewhere to write
ALTER TABLE "Promotion"
  ADD COLUMN "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "statusNote" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "approvedById" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

-- Data migration, most specific case first.
--
-- An active row whose end date has already passed is ENDED, not LIVE: it was
-- only ever kept off the site by the date check in isPromotionLive(), and
-- calling it LIVE would misreport history. An active row that has not started
-- yet is SCHEDULED for the same reason. Everything else active is LIVE, and
-- everything inactive becomes DRAFT.
UPDATE "Promotion" SET "status" = 'ENDED'
  WHERE "isActive" = true AND "endsAt" IS NOT NULL AND "endsAt" <= NOW();

UPDATE "Promotion" SET "status" = 'SCHEDULED'
  WHERE "isActive" = true AND "status" = 'DRAFT'
    AND "startsAt" IS NOT NULL AND "startsAt" > NOW();

UPDATE "Promotion" SET "status" = 'LIVE'
  WHERE "isActive" = true AND "status" = 'DRAFT';

-- Anything already published stays published without a fresh approval, so the
-- migration cannot knock a running offer off the site. Approver is left null
-- on purpose — nobody approved these, and inventing an approver would put a
-- name against a decision that was never made.
UPDATE "Promotion" SET "approvedAt" = "createdAt"
  WHERE "status" IN ('LIVE', 'SCHEDULED', 'PAUSED');

-- Only now is the old column safe to remove.
DROP INDEX "Promotion_isActive_idx";
ALTER TABLE "Promotion" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "PromotionClaim" ADD COLUMN "redeemedById" TEXT;

-- CreateIndex
CREATE INDEX "Promotion_status_idx" ON "Promotion"("status");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionClaim" ADD CONSTRAINT "PromotionClaim_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
