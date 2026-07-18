-- AlterEnum
ALTER TYPE "AdPlacement" ADD VALUE 'SERVICE_SIDEBAR';

-- AlterTable
ALTER TABLE "ServiceOffer" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "image" TEXT,
ADD COLUMN     "priceNote" TEXT;
