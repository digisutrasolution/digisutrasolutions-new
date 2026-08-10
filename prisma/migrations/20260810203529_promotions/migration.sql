-- AlterTable
ALTER TABLE "OutreachLink" ADD COLUMN     "promotionId" TEXT;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENT',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "headline" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "codePrefix" TEXT NOT NULL DEFAULT 'SOCIAL',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxClaims" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionClaim" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "PromotionClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_isActive_idx" ON "Promotion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionClaim_code_key" ON "PromotionClaim"("code");

-- CreateIndex
CREATE INDEX "PromotionClaim_promotionId_claimedAt_idx" ON "PromotionClaim"("promotionId", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionClaim_promotionId_leadId_key" ON "PromotionClaim"("promotionId", "leadId");

-- AddForeignKey
ALTER TABLE "PromotionClaim" ADD CONSTRAINT "PromotionClaim_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionClaim" ADD CONSTRAINT "PromotionClaim_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
