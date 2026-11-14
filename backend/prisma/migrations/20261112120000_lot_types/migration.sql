-- AlterTable
ALTER TABLE "tender_lots" ADD COLUMN     "fuel_included" BOOLEAN DEFAULT false,
ADD COLUMN     "support_included" BOOLEAN DEFAULT false,
ADD COLUMN     "with_operator" BOOLEAN DEFAULT false;

