-- Names of the files sent with a message. Additive with a default so every
-- existing CommLog row stays valid and nothing is rewritten.
ALTER TABLE "CommLog" ADD COLUMN "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
