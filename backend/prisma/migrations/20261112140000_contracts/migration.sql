-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SUPPLIER_SIGNED', 'SIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency_code" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "supplier_signed_file" TEXT,
    "admin_signed_file" TEXT,
    "note" TEXT,
    "cancel_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "supplier_signed_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_number_key" ON "contracts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_offer_id_key" ON "contracts"("offer_id");

-- CreateIndex
CREATE INDEX "contracts_tender_id_idx" ON "contracts"("tender_id");

-- CreateIndex
CREATE INDEX "contracts_supplier_id_idx" ON "contracts"("supplier_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

