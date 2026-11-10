-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'SUPPLIER', 'CLIENT', 'PURCHASING_SPECIALIST', 'COMMISSION_MEMBER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('taslama', 'açyk', 'ýapyk', 'bahalandyryldy', 'ýeňiji yglan edildi', 'goýbolsun edildi', 'arhiwlendi');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('taslama', 'tabşyryldy', 'kabul edildi', 'ýeňiji', 'goýbolsun edildi', 'ret edildi');

-- CreateEnum
CREATE TYPE "TenderType" AS ENUM ('ýerli', 'halkara');

-- CreateEnum
CREATE TYPE "TenderVisibility" AS ENUM ('açyk', 'ýapyk');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('ENTREPRENEUR', 'BUSINESS_SOCIETY', 'BUSINESS_COMPANY', 'GOVERNMENT', 'FARMER_ASSOCIATION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'NOT_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "DocumentScope" AS ENUM ('SUPPLIER_DOC', 'TENDER_DOC', 'OFFER_DOC');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('haryt', 'hyzmat');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('haryt', 'tender');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('okamak', 'ýazmak');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "allowed_modules" JSONB,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "role_type" "RoleType" NOT NULL DEFAULT 'SUPPLIER',
    "position" TEXT,
    "phone" TEXT,
    "role_id" TEXT,
    "last_login" TIMESTAMP(3),
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "lockout_expire_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "EventType" NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "ip" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "type" TEXT DEFAULT 'GOODS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "trade_name" TEXT,
    "code" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'haryt',
    "item_type" TEXT DEFAULT 'GOODS',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "general_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "flag" TEXT,
    "symbol" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency_id" TEXT NOT NULL,
    "to_currency_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alpha_2" TEXT NOT NULL,
    "alpha_3" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL,
    "country_id" TEXT,
    "brand_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "scope" "DocumentScope" NOT NULL DEFAULT 'TENDER_DOC',

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variation_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "variation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variation_values" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "variation_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "tender_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "technical_specs" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" "TenderType" NOT NULL DEFAULT 'ýerli',
    "status" "TenderStatus" NOT NULL DEFAULT 'taslama',
    "visibility" "TenderVisibility" NOT NULL DEFAULT 'açyk',
    "announcement_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3) NOT NULL,
    "client_id" TEXT,
    "category_id" TEXT,
    "procurement_type" TEXT DEFAULT 'GOODS',
    "created_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_lots" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "lot_number" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lot_type" TEXT DEFAULT 'GOODS',
    "category_id" TEXT,
    "end_user" TEXT,
    "delivery_term_id" TEXT,
    "delivery_address" TEXT,
    "work_address" TEXT,
    "work_period" TEXT,
    "license_required" BOOLEAN DEFAULT false,
    "service_format" TEXT,
    "sla_period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_specifications" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "general_product_id" TEXT,
    "unit_id" TEXT,
    "manufacturer_id" TEXT,
    "name" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "position_number" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "description" TEXT,
    "tenderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "country_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "SupplierType",
    "reg_number" TEXT,
    "license_number" TEXT,
    "tax_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "address" TEXT,
    "region" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_mfo" TEXT,
    "passport_info" TEXT,
    "passport_series" TEXT,
    "passport_issued_by" TEXT,
    "director_name" TEXT,
    "director_personal_code" TEXT,
    "okpo_code" TEXT,
    "legal_address" TEXT,
    "is_medical_licensed" BOOLEAN DEFAULT false,
    "license_issued_by" TEXT,
    "license_expiry_date" TEXT,
    "bank_corr_account" TEXT,
    "bank_swift" TEXT,
    "bank_iban" TEXT,
    "bank_currency" TEXT DEFAULT 'TMT',
    "logo_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_categories" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_invited_suppliers" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "viewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_invited_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "delivery_term_id" TEXT,
    "base_currency_id" TEXT,
    "number" TEXT,
    "bidder_code" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "payment_terms" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "status" "OfferStatus" NOT NULL DEFAULT 'taslama',
    "offered_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_specifications" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "tender_spec_id" TEXT NOT NULL,
    "general_product_id" TEXT,
    "unit_id" TEXT,
    "manufacturer_id" TEXT,
    "name" TEXT,
    "position_number" INTEGER,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_awarded" BOOLEAN NOT NULL DEFAULT false,
    "is_equivalent" BOOLEAN DEFAULT false,
    "equivalent_name" TEXT,
    "equivalent_justification" TEXT,

    CONSTRAINT "offer_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_exchange_rates" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "currency_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "offer_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "license" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "tenderId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_items" (
    "id" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isAlternative" BOOLEAN NOT NULL DEFAULT false,
    "alternativeDesc" TEXT,
    "bidId" TEXT NOT NULL,
    "tenderItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "file_size" INTEGER,
    "document_type_id" TEXT,
    "tenderId" TEXT,
    "bidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_files" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "tender_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_files" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "lot_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_files" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "supplier_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_files" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "offer_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_moderation_logs" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_id_to_currency_id_key" ON "exchange_rates"("from_currency_id", "to_currency_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_tender_number_key" ON "tenders"("tender_number");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_categories_supplier_id_category_id_key" ON "supplier_categories"("supplier_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "tender_invited_suppliers_tender_id_supplier_id_key" ON "tender_invited_suppliers"("tender_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_inn_key" ON "companies"("inn");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_products" ADD CONSTRAINT "general_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_id_fkey" FOREIGN KEY ("from_currency_id") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_id_fkey" FOREIGN KEY ("to_currency_id") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_values" ADD CONSTRAINT "variation_values_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "variation_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_lots" ADD CONSTRAINT "tender_lots_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_lots" ADD CONSTRAINT "tender_lots_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_lots" ADD CONSTRAINT "tender_lots_delivery_term_id_fkey" FOREIGN KEY ("delivery_term_id") REFERENCES "delivery_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_specifications" ADD CONSTRAINT "tender_specifications_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_specifications" ADD CONSTRAINT "tender_specifications_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "tender_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_specifications" ADD CONSTRAINT "tender_specifications_general_product_id_fkey" FOREIGN KEY ("general_product_id") REFERENCES "general_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_specifications" ADD CONSTRAINT "tender_specifications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_specifications" ADD CONSTRAINT "tender_specifications_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_items" ADD CONSTRAINT "tender_items_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_categories" ADD CONSTRAINT "supplier_categories_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_categories" ADD CONSTRAINT "supplier_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_invited_suppliers" ADD CONSTRAINT "tender_invited_suppliers_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_invited_suppliers" ADD CONSTRAINT "tender_invited_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_delivery_term_id_fkey" FOREIGN KEY ("delivery_term_id") REFERENCES "delivery_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_specifications" ADD CONSTRAINT "offer_specifications_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_specifications" ADD CONSTRAINT "offer_specifications_tender_spec_id_fkey" FOREIGN KEY ("tender_spec_id") REFERENCES "tender_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_specifications" ADD CONSTRAINT "offer_specifications_general_product_id_fkey" FOREIGN KEY ("general_product_id") REFERENCES "general_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_specifications" ADD CONSTRAINT "offer_specifications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_specifications" ADD CONSTRAINT "offer_specifications_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_exchange_rates" ADD CONSTRAINT "offer_exchange_rates_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_exchange_rates" ADD CONSTRAINT "offer_exchange_rates_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_tenderItemId_fkey" FOREIGN KEY ("tenderItemId") REFERENCES "tender_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_files" ADD CONSTRAINT "tender_files_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_files" ADD CONSTRAINT "tender_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_files" ADD CONSTRAINT "lot_files_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "tender_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_files" ADD CONSTRAINT "lot_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_files" ADD CONSTRAINT "supplier_files_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_files" ADD CONSTRAINT "supplier_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_files" ADD CONSTRAINT "offer_files_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_files" ADD CONSTRAINT "offer_files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_moderation_logs" ADD CONSTRAINT "supplier_moderation_logs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_moderation_logs" ADD CONSTRAINT "supplier_moderation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

