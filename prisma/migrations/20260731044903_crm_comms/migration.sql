-- CreateEnum
CREATE TYPE "CommChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "CommTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CommChannel" NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "channel" "CommChannel" NOT NULL,
    "templateId" TEXT,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "openedAt" TIMESTAMP(3),
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommTemplate_channel_active_idx" ON "CommTemplate"("channel", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CommLog_trackId_key" ON "CommLog"("trackId");

-- CreateIndex
CREATE INDEX "CommLog_leadId_createdAt_idx" ON "CommLog"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "CommLog_channel_createdAt_idx" ON "CommLog"("channel", "createdAt");

-- AddForeignKey
ALTER TABLE "CommLog" ADD CONSTRAINT "CommLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
