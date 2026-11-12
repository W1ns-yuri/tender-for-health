-- CreateEnum
CREATE TYPE "RequirementOperator" AS ENUM ('EQ', 'GTE', 'LTE');

-- CreateTable
CREATE TABLE "tender_spec_requirements" (
    "id" TEXT NOT NULL,
    "spec_id" TEXT NOT NULL,
    "attribute_id" TEXT,
    "custom_name" TEXT,
    "operator" "RequirementOperator" NOT NULL DEFAULT 'EQ',
    "value" TEXT NOT NULL,
    "number_value" DOUBLE PRECISION,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tender_spec_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tender_spec_requirements_spec_id_idx" ON "tender_spec_requirements"("spec_id");

-- AddForeignKey
ALTER TABLE "tender_spec_requirements" ADD CONSTRAINT "tender_spec_requirements_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "tender_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_spec_requirements" ADD CONSTRAINT "tender_spec_requirements_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

