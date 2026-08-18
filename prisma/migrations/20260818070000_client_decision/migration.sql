-- The client's own accept/reject on /q/<token>.
-- Additive and nullable; separate from approvedBy*, which records our internal
-- approval step and means something entirely different.
ALTER TABLE "Quotation" ADD COLUMN "clientDecisionBy" TEXT;
ALTER TABLE "Quotation" ADD COLUMN "clientDecisionAt" TIMESTAMP(3);
ALTER TABLE "Quotation" ADD COLUMN "clientDecisionNote" TEXT;
ALTER TABLE "Quotation" ADD COLUMN "clientDecisionIp" TEXT;
