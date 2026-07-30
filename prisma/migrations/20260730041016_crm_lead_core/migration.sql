-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'WEBSITE';
ALTER TYPE "LeadSource" ADD VALUE 'SEO_AUDIT';
ALTER TYPE "LeadSource" ADD VALUE 'PPC';
ALTER TYPE "LeadSource" ADD VALUE 'LANDING';
ALTER TYPE "LeadSource" ADD VALUE 'WHATSAPP';
ALTER TYPE "LeadSource" ADD VALUE 'FACEBOOK';
ALTER TYPE "LeadSource" ADD VALUE 'INSTAGRAM';
ALTER TYPE "LeadSource" ADD VALUE 'GOOGLE_ADS';
ALTER TYPE "LeadSource" ADD VALUE 'LINKEDIN';
ALTER TYPE "LeadSource" ADD VALUE 'REFERRAL';
ALTER TYPE "LeadSource" ADD VALUE 'ORGANIC';
ALTER TYPE "LeadSource" ADD VALUE 'EMAIL_CAMPAIGN';
ALTER TYPE "LeadSource" ADD VALUE 'COLD_CALL';
ALTER TYPE "LeadSource" ADD VALUE 'WALK_IN';
ALTER TYPE "LeadSource" ADD VALUE 'TRADE_SHOW';
ALTER TYPE "LeadSource" ADD VALUE 'MANUAL';
ALTER TYPE "LeadSource" ADD VALUE 'API';
ALTER TYPE "LeadSource" ADD VALUE 'CSV_IMPORT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'ATTEMPTED';
ALTER TYPE "LeadStatus" ADD VALUE 'CONTACTED';
ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL';
ALTER TYPE "LeadStatus" ADD VALUE 'NEGOTIATION';
ALTER TYPE "LeadStatus" ADD VALUE 'FOLLOW_UP';
ALTER TYPE "LeadStatus" ADD VALUE 'MEETING';
ALTER TYPE "LeadStatus" ADD VALUE 'SPAM';
ALTER TYPE "LeadStatus" ADD VALUE 'DUPLICATE';
ALTER TYPE "LeadStatus" ADD VALUE 'HOLD';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "address" TEXT,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expectedRevenue" INTEGER,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
