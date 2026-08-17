-- Client-facing quotation link + send history.
-- All three columns are additive and nullable: no existing row is rewritten,
-- and nothing is backfilled. publicToken is minted lazily on the first send.
ALTER TABLE "Quotation" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "Quotation" ADD COLUMN "viewedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Quotation_publicToken_key" ON "Quotation"("publicToken");

ALTER TABLE "CommLog" ADD COLUMN "quotationId" TEXT;
CREATE INDEX "CommLog_quotationId_createdAt_idx" ON "CommLog"("quotationId", "createdAt");
ALTER TABLE "CommLog" ADD CONSTRAINT "CommLog_quotationId_fkey"
  FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
