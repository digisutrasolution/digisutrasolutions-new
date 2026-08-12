-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "offerType" TEXT NOT NULL DEFAULT 'SOCIAL_FOLLOW';
