-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "priceUsd" TEXT,
ADD COLUMN     "quarterlyPriceUsd" TEXT;

-- AlterTable
ALTER TABLE "RateCardRow" ADD COLUMN     "priceUsd" TEXT;
