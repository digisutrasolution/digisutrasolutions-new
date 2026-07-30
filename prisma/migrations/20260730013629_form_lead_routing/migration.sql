-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'FORM';

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "destination" TEXT NOT NULL DEFAULT 'submission';
