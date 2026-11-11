-- Перед уникальными индексами убираем дубли, которые мог оставить старый код
-- (двойной клик "Подать" создавал несколько заявок). Оставляем самую раннюю заявку:
-- именно её принял бы код с проверкой "одна заявка от поставщика".
DELETE FROM "offers" o
USING "offers" o2
WHERE o."tender_id" = o2."tender_id"
  AND o."supplier_id" = o2."supplier_id"
  AND (o."createdAt", o."id") > (o2."createdAt", o2."id");

DELETE FROM "offer_specifications" a USING "offer_specifications" b
WHERE a."offer_id" = b."offer_id" AND a."tender_spec_id" = b."tender_spec_id" AND a."id" > b."id";

DELETE FROM "tender_files" a USING "tender_files" b
WHERE a."tender_id" = b."tender_id" AND a."document_id" = b."document_id" AND a."id" > b."id";
DELETE FROM "lot_files" a USING "lot_files" b
WHERE a."lot_id" = b."lot_id" AND a."document_id" = b."document_id" AND a."id" > b."id";
DELETE FROM "supplier_files" a USING "supplier_files" b
WHERE a."supplier_id" = b."supplier_id" AND a."document_id" = b."document_id" AND a."id" > b."id";
DELETE FROM "offer_files" a USING "offer_files" b
WHERE a."offer_id" = b."offer_id" AND a."document_id" = b."document_id" AND a."id" > b."id";

-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "tenders" DROP CONSTRAINT "tenders_created_by_id_fkey";

-- CreateIndex
CREATE INDEX "documents_fileName_idx" ON "documents"("fileName");

-- CreateIndex
CREATE INDEX "logs_createdAt_idx" ON "logs"("createdAt");

-- CreateIndex
CREATE INDEX "logs_user_id_idx" ON "logs"("user_id");

-- CreateIndex
CREATE INDEX "lot_files_document_id_idx" ON "lot_files"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "lot_files_lot_id_document_id_key" ON "lot_files"("lot_id", "document_id");

-- CreateIndex
CREATE INDEX "offer_files_document_id_idx" ON "offer_files"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_files_offer_id_document_id_key" ON "offer_files"("offer_id", "document_id");

-- CreateIndex
CREATE INDEX "offer_specifications_tender_spec_id_idx" ON "offer_specifications"("tender_spec_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_specifications_offer_id_tender_spec_id_key" ON "offer_specifications"("offer_id", "tender_spec_id");

-- CreateIndex
CREATE INDEX "offers_supplier_id_idx" ON "offers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "offers_tender_id_supplier_id_key" ON "offers"("tender_id", "supplier_id");

-- CreateIndex
CREATE INDEX "supplier_files_document_id_idx" ON "supplier_files"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_files_supplier_id_document_id_key" ON "supplier_files"("supplier_id", "document_id");

-- CreateIndex
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");

-- CreateIndex
CREATE INDEX "suppliers_verification_status_idx" ON "suppliers"("verification_status");

-- CreateIndex
CREATE INDEX "tender_files_document_id_idx" ON "tender_files"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "tender_files_tender_id_document_id_key" ON "tender_files"("tender_id", "document_id");

-- CreateIndex
CREATE INDEX "tender_invited_suppliers_supplier_id_idx" ON "tender_invited_suppliers"("supplier_id");

-- CreateIndex
CREATE INDEX "tender_lots_tender_id_idx" ON "tender_lots"("tender_id");

-- CreateIndex
CREATE INDEX "tender_specifications_tender_id_idx" ON "tender_specifications"("tender_id");

-- CreateIndex
CREATE INDEX "tender_specifications_lot_id_idx" ON "tender_specifications"("lot_id");

-- CreateIndex
CREATE INDEX "tenders_status_deadline_idx" ON "tenders"("status", "deadline");

-- CreateIndex
CREATE INDEX "tenders_created_by_id_idx" ON "tenders"("created_by_id");

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

