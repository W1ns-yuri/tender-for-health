-- CreateEnum
CREATE TYPE "ProductModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('NUMBER', 'LIST', 'BOOLEAN', 'TEXT');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "photo_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "general_products" ADD COLUMN     "brand_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "image_file_name" TEXT,
ADD COLUMN     "moderation_note" TEXT,
ADD COLUMN     "moderation_status" "ProductModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "official_url" TEXT;

-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "publish_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "attributes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL DEFAULT 'TEXT',
    "unit" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "attribute_id" TEXT,
    "custom_name" TEXT,
    "value" TEXT NOT NULL,
    "number_value" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_attributes_category_id_attribute_id_key" ON "category_attributes"("category_id", "attribute_id");

-- CreateIndex
CREATE INDEX "product_attribute_values_product_id_idx" ON "product_attribute_values"("product_id");

-- CreateIndex
CREATE INDEX "general_products_moderation_status_idx" ON "general_products"("moderation_status");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_products" ADD CONSTRAINT "general_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_products" ADD CONSTRAINT "general_products_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "general_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data: группы вариаций («Цвет»: красный, синий) становятся характеристиками-списками.
-- Таблицы вариаций пока не удаляем, чтобы ничего не потерять.
INSERT INTO "attributes" ("id", "name", "type", "options")
SELECT g."id", g."name", 'LIST'::"AttributeType",
       COALESCE(array_agg(v."value" ORDER BY v."value") FILTER (WHERE v."value" IS NOT NULL), ARRAY[]::TEXT[])
FROM "variation_groups" g
LEFT JOIN "variation_values" v ON v."group_id" = g."id"
GROUP BY g."id", g."name"
ON CONFLICT ("id") DO NOTHING;
