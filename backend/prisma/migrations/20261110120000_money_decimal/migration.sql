-- AlterTable
ALTER TABLE "bid_items" ALTER COLUMN "pricePerUnit" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "bids" ALTER COLUMN "offeredPrice" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "exchange_rates" ALTER COLUMN "value" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "offer_exchange_rates" ALTER COLUMN "value" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "offer_specifications" ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "offers" ALTER COLUMN "offered_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "tenders" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2);

