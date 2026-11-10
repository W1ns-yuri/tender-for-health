-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "uploaded_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Чистим журнал аудита: раньше туда писалось тело запроса создания предложения
-- (цены, спецификации). Журнал видели админ до вскрытия и поставщики на дашборде.
UPDATE "logs"
SET "data" = jsonb_set("data", '{body}', '"***SEALED***"'::jsonb)
WHERE "data"->>'url' LIKE '/api/offers%'
  AND "data" ? 'body'
  AND "data"->'body' IS NOT NULL
  AND jsonb_typeof("data"->'body') = 'object';
