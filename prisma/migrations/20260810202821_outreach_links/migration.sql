-- CreateEnum
CREATE TYPE "OutreachKind" AS ENUM ('REVIEW', 'PROMO');

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "leadId" TEXT;

-- CreateTable
CREATE TABLE "OutreachLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "OutreachKind" NOT NULL,
    "leadId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachLink_token_key" ON "OutreachLink"("token");

-- CreateIndex
CREATE INDEX "OutreachLink_leadId_kind_idx" ON "OutreachLink"("leadId", "kind");

-- CreateIndex
CREATE INDEX "Testimonial_leadId_idx" ON "Testimonial"("leadId");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachLink" ADD CONSTRAINT "OutreachLink_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
